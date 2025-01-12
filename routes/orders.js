const express = require('express');
const router = express.Router();
const Order = require('../model/orders');
const User = require('../model/users');
const Cart = require('../model/cart');
const mongoose = require('mongoose');
const orderMail = require("../service/orderConfirm");
const moment = require("moment");

// Get all orders
router.get('/', async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.user.id });
		return res.render("order", {
			layout: 'dashboard',  // Use the dashboard layout
			isAuthenticated: true,
			user: req.user,  // Pass user data to the view
			title: 'Dashboard',
			profile: user// Title for the page,
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
	}
});

router.get('/details', async (req, res) => {
	try {
		const orders = await Order.find({ orderBy: req.user.id });
		const user = await User.findOne({ _id: req.user.id });
		return res.render("orderDetails", {
			layout: 'dashboard',  // Use the dashboard layout
			isAuthenticated: true,
			user: req.user,  // Pass user data to the view
			title: 'Dashboard',  // Title for the page,
			orders: orders,
			profile: user
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
	}
});

// Place a new order
router.post('/paynow', async (req, res) => {
	try {
		const postData = req.body;
		const items = await Cart.aggregate([
			// Match the cart with the specific userId
			{
				$match: {
					userId: new mongoose.Types.ObjectId(req.user.id)   // Replace 'userId' with the actual userId variable
				}
			},
			// Unwind the cart items (if the cart has an array of products)
			{
				$unwind: "$products"  // Assuming the cart contains an array of cartItems
			},
			// Lookup product details by productId from the Product collection
			{
				$lookup: {
					from: "products",  // Assuming the products are stored in the "products" collection
					localField: "products.productId",  // The productId in the cart
					foreignField: "_id",  // The product's _id in the products collection
					as: "productDetails"  // Alias for the product details in the result
				}
			},
			// Project the fields you need and calculate total price (quantity * price)
			{
				$project: {
					_id: 0,
					productId: "$products.productId",  // Include productId from cartItems
					quantity: "$products.quantity",  // Assuming cartItems has a quantity field
					price: { $arrayElemAt: ["$productDetails.price", 0] },  // Take the first (and only) match from the $lookup
					totalPrice: { $multiply: ["$products.quantity", { $arrayElemAt: ["$productDetails.price", 0] }] }  // Calculate qty * price
				}
			},
			// Optionally, you can add a step to sum the total price of all items in the cart
			{
				$group: {
					_id: "$productId",
					productId: { $first: "$productId" },
					quantity: { $first: "$quantity" },
					totalPrice: { $sum: "$totalPrice" }  // Sum of all item prices in the cart
				}
			}, {
				$project: {
					_id: 0
				}
			}
		]);
		// Calculate the total price for the items
		let totalPrice = 0;
		items.forEach(item => {
			totalPrice += item.totalPrice;
		});
		postData["products"] = items;
		postData["totalAmount"] = totalPrice;
		postData["orderBy"] = req.user.id;
		postData["paymentMethod"] = "Cash on Delivery";
		// Create a new order
		const newOrder = new Order(postData);
		const orderDetails = await newOrder.save();
		await Cart.deleteOne({
			userId: req.user.id
		});
		const user = await User.findOne({ _id: req.user.id });

		await User.updateOne({
			_id: req.user.id
		}, {
			$push: {
				address: postData.address
			}
		});
		const userDetails = await User.findOne({ _id: req.user.id });
		const order = {
			orderNumber: orderDetails.orderNumber,
			customerName: orderDetails.customerName,
			customerEmail: userDetails.email,
			orderDate: orderDetails.orderDate,
			totalAmount: orderDetails.totalAmount
		}
		order["customerEmail"] = userDetails.email;
		order.date = moment(new Date()).format("DD-MM-YYYY");
		orderMail(order);
		return res.status(201).json({ message: 'Order placed successfully!', order: newOrder });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Failed to place order', error: err.message });
	}
});

// Get all orders
router.get('/orders', async (req, res) => {
	try {
		const orders = await Order.find({ userId: req.user.id }).populate('items.productId');
		return res.status(200).json(orders);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
	}
});

// Route for viewing order details by orderNumber
router.get('/:orderNumber', async (req, res) => {
	const { orderNumber } = req.params;
	try {
		// Aggregate query to fetch the order based on orderNumber, and populate the product details
		const order = await Order.aggregate([
			// Match the order by orderNumber
			{
				$match: { orderNumber: parseInt(orderNumber) }
			},
			// Unwind the products array from the order
			{
				$unwind: "$products"
			},
			// Lookup the product details from the 'products' collection
			{
				$lookup: {
					from: "products",  // Collection where product details are stored
					localField: "products.productId",  // Field in Order's products array
					foreignField: "_id",  // _id in the products collection
					as: "productsDetails"  // Alias for merged product details
				}
			},
			// Unwind the productsDetails to flatten the resulting array
			{
				$unwind: {
					path: "$productsDetails",  // Flatten the productsDetails array
					preserveNullAndEmptyArrays: true  // Keep documents even if there are no matches
				}
			},
			// Combine fields from both products and productsDetails where their _id fields match
			{
				$match: {
					$expr: {
						$eq: ["$products.productId", "$productsDetails._id"]
					}
				}
			},
			// Merge both products and productsDetails fields into one document
			{
				$group: {
					_id: "$orderNumber",  // Group by orderNumber
					customerName: { $first: "$customerName" },
					customerPhone: { $first: "$customerPhone" },
					address: { $first: "$address" },
					totalAmount: { $first: "$totalAmount" },
					instructions: { $first: "$instructions" },
					timeSlot: { $first: "$timeSlot" },
					paymentMethod: { $first: "$paymentMethod" },
					orderDate: {
						$first: {
							$dateToString: {
								format: "%d-%m-%Y",  // dd-mm-yyyy format
								date: "$orderDate"   // The field to format
							}
						}
					},
					status: { $first: "$status" },
					orderNumber: { $first: "$orderNumber" },
					products: {
						$push: {
							productId: "$products.productId",
							quantity: "$products.quantity",
							totalPrice: "$products.totalPrice",
							name: "$productsDetails.name",
							description: "$productsDetails.description",
							price: "$productsDetails.price",
							category: "$productsDetails.category",
							stock: "$productsDetails.stock",
							imageUrl: "$productsDetails.imageUrl",
							discount: "$productsDetails.discount",
							createdAt: "$productsDetails.createdAt"
						}
					}
				}
			}
		]);


		// If no order is found, redirect to the index page
		if (order.length === 0) {
			return res.redirect('/'); // Redirect to the index page
		}

		// If order is found, render the order details page and pass the order data
		return res.render("orderedDetails", {
			layout: 'dashboard',  // Use the dashboard layout
			isAuthenticated: true,
			user: req.user,  // Pass user data to the view
			title: 'Dashboard',  // Title for the page,
			orders: order
		});
		// res.render('order-details', { order: order[0] }); // Pass the first matched order to the template
	} catch (error) {
		console.error(error);
	}
});

// Get all orders
router.put('/status/change/:id', async (req, res) => {
	try {
		await Order.updateOne({ _id: req.params.id },
			{
				$set: {
					status: req.body.status
				}
			});
		return res.status(200).json("sucess");
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
	}
});

module.exports = router;
