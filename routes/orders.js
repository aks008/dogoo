const express = require('express');
const router = express.Router();
const Order = require('../model/orders');
const User = require('../model/users');
const Cart = require('../model/cart');
const Address = require('../model/address');
const Payment = require('../model/paymentTransaction');
const mongoose = require('mongoose');
const orderMail = require("../service/orderConfirm");
const newOrderMailForAdmin = require("../service/newOrderMailForAdmin");
const moment = require("moment");
const { log } = require('handlebars/runtime');
const ObjectId = mongoose.Types.ObjectId;

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
		const orders = await Order.aggregate([
			{
				$match: { orderBy: new ObjectId(req.user.id) } // Filter orders by the logged-in user
			},
			{
				$lookup: {
					from: "addresses", // Name of the Address collection
					localField: "address", // The field in Order referencing Address
					foreignField: "_id", // The primary key in Address collection
					as: "address" // Output array field with address data
				}
			},
			{
				$unwind: "$address" // Convert address array into a single object
			},
			{
				$lookup: {
					from: "payments", // Name of the Payment collection
					localField: "_id", // The field in Order matching with Payment's orderId
					foreignField: "orderId", // The field in Payment referencing Order _id
					as: "paymentDetails" // Output field containing the payment data
				}
			},
			{
				$unwind: { path: "$paymentDetails", preserveNullAndEmptyArrays: true } // If no payment, don't remove the order
			},
			{
				$sort: { _id: -1 } // Sort orders by _id in descending order
			}
		]);
		// console.log(orders);
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
		console.log(postData);
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
		// Create a new order
		if (totalPrice) {
			const newOrder = new Order(postData);
			const orderDetails = await newOrder.save();
			await Cart.deleteOne({
				userId: req.user.id
			});
			const orderAddressDetails = await Address.findOne({ _id: orderDetails.address });
			const userDetails = await User.findOne({ _id: req.user.id });
			const order = {
				orderNumber: orderDetails.orderNumber,
				customerName: orderAddressDetails.name,
				customerEmail: orderAddressDetails.email,
				orderDate: orderDetails.orderDate,
				totalAmount: orderDetails.totalAmount
			}
			order["customerEmail"] = userDetails.email;
			order.date = moment(new Date()).format("DD-MM-YYYY");
			// orderMail(order);
			// newOrderMailForAdmin(order);
			return res.status(201).json({ message: 'Order placed successfully!', newOrder, orderAddressDetails });
		}
		return res.status(201).json({
			message: "Order placed successfully!",
			isEmpty: true
		});
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
router.get('/:id', async (req, res) => {
	try {
		// Aggregate query to fetch the order based on orderNumber, and populate the product details
		const order = await Order.aggregate([
			// Step 1: Match the order by _id or orderNumber
			{
				$match: {
					_id: new ObjectId(req.params.id) // Match by Order ID
				}
			},
			{
				$lookup: {
					from: "payments",  // Payment collection
					localField: "_id",  // Field in Order (using _id as order reference)
					foreignField: "orderId",  // orderId in Payment collection
					as: "paymentDetails"  // Alias for merged payment details
				}
			},

			// Step 9: If no payment found, set to empty array
			{
				$addFields: {
					paymentDetails: { $ifNull: ["$paymentDetails", []] }
				}
			},
			// Step 2: Lookup to join the Address collection
			{
				$lookup: {
					from: "addresses",  // Address collection name
					localField: "address",  // Field in Order (ObjectId of address)
					foreignField: "_id",  // _id field in Address collection
					as: "addressDetails"  // Alias for the merged address details
				}
			},

			// Step 3: If no address found, set to empty array
			{
				$addFields: {
					addressDetails: { $ifNull: ["$addressDetails", []] }
				}
			},
			{
				$unwind: {
					path: "$addressDetails",  // Flatten the productsDetails array
					preserveNullAndEmptyArrays: true  // Keep documents even if there are no matches
				}
			},
			{
				$unwind: {
					path: "$paymentDetails",  // Flatten the productsDetails array
					preserveNullAndEmptyArrays: true  // Keep documents even if there are no matches
				}
			},
			// Step 4: Unwind the products array in the order
			{
				$unwind: "$products"
			},

			// Step 5: Lookup product details from the products collection
			{
				$lookup: {
					from: "products",  // Product collection
					localField: "products.productId",  // Field in Order's products array
					foreignField: "_id",  // _id in the Products collection
					as: "productDetails"  // Alias for merged product details
				}
			},

			// Step 6: Unwind the product details array
			{
				$unwind: {
					path: "$productDetails",  // Flatten the productsDetails array
					preserveNullAndEmptyArrays: true  // Keep documents even if there are no matches
				}
			},

			// Step 7: Match products that are correctly linked to the order's products
			{
				$match: {
					$expr: {
						$eq: ["$products.productId", "$productDetails._id"]
					}
				}
			},

			// Step 8: Group the results by orderNumber and aggregate relevant fields
			{
				$group: {
					_id: "$orderNumber",  // Group by orderNumber
					address: { $first: "$addressDetails" },  // Include the first matched address details
					totalAmount: { $first: "$totalAmount" },
					instructions: { $first: "$instructions" },
					timeSlot: { $first: "$timeSlot" },
					paymentMethod: { $first: "$paymentMethod" },
					paymentDetails: { $first: "$paymentDetails" },
					orderDate: {
						$first: {
							$dateToString: {
								format: "%d-%m-%Y",  // Format the order date as dd-mm-yyyy
								date: "$orderDate"
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
							name: "$productDetails.name",
							description: "$productDetails.description",
							price: "$productDetails.price",
							category: "$productDetails.category",
							stock: "$productDetails.stock",
							imageUrl: "$productDetails.imageUrl",
							discount: "$productDetails.discount",
							createdAt: "$productDetails.createdAt"
						}
					}
				}
			}
		]);


		console.log(order);

		const oadd = await Address.findOne({ _id: order[0].address });
		// If no order is found, redirect to the index page
		// if (order.length === 0) {
		// 	return res.redirect('/'); // Redirect to the index page
		// }
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

router.put('/cancel/:id', async (req, res) => {
	try {
		await Order.updateOne({ _id: req.params.id },
			{
				$set: {
					status: req.body.status,
					cancelReason: req.body.reason
				}
			});
		return res.status(200).json("sucess");
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
	}
});

router.post('/address/save', async (req, res) => {
	try {
		req.body["userId"] = req.user.id;
		const orders = await Address.create(req.body);
		console.log('API Response:', orders); // Log the created address
		return res.status(201).json({
			data: orders
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
	}
});


router.get('/address/list', async (req, res) => {
	try {
		const orders = await Address.find({ userId: req.user.id });
		return res.status(200).json(orders);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
	}
});

router.get('/address/:id', async (req, res) => {
	try {
		const order = await Address.findOne({ _id: req.params.id });
		return res.status(200).json(order);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
	}
});


router.put('/address/:id', async (req, res) => {
	try {
		console.log(req.body);

		await Address.updateOne(
			{ _id: req.params.id },  // filter condition
			{ $set: req.body }       // update operation
		);
		return res.status(200).json("Updated successfully");
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Failed to edit orders', error: err.message });
	}
});

module.exports = router;
