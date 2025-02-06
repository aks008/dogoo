const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/authentication'); // Assuming this middleware is for JWT validation
const { adminLogin, logout } = require('../controller/authController');
const jwt = require('jsonwebtoken');
const Users = require('../model/users');
const Orders = require('../model/orders');
const Products = require('../model/products');
const PaymentTransaction = require('../model/paymentTransaction');
const delieverdMail = require("../service/deliverdEmail");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;


// Route for viewing order details by orderNumber
router.get('/', async (req, res) => {
	try {
		// Check if the user role is "customer"
		const token = req.cookies.token || req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
		if (token) {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			req.user = decoded;
		}
		if (req.user && req.user.role == "admin") {
			// If order is found, render the order details page and pass the order data
			return res.render("admin/index", {
				layout: 'admin',  // Use the dashboard layout
				user: req.user,  // Pass user data to the view
				title: 'Dashboard',  // Title for the page,
			});
		}
		// If order is found, render the order details page and pass the order data
		return res.render("admin/login", {
			layout: 'blank',  // Use the dashboard layout
			isAuthenticated: true,
			user: req.user,  // Pass user data to the view
			title: 'Dashboard',  // Title for the page,
		});
	} catch (error) {
		console.error(error);
	}
});

router.get('/dashboard', async (req, res) => {
	try {
		// If order is found, render the order details page and pass the order data
		return res.render("admin/index", {
			layout: 'admin',  // Use the dashboard layout
			user: req.user,  // Pass user data to the view
			title: 'Dashboard',  // Title for the page,
		});
	} catch (error) {
		console.error(error);
	}
});


router.get('/users', async (req, res) => {
	try {
		const users = await Users.aggregate([
			{
				// Join with the Orders collection
				$lookup: {
					from: "orders", // Name of the orders collection
					localField: "_id", // Field from Users collection
					foreignField: "orderBy", // Field in Orders collection
					as: "orders" // Output array
				}
			},
			{
				// Unwind the orders array to prepare for summing
				$unwind: {
					path: "$orders",
					preserveNullAndEmptyArrays: true // Handle users with no orders
				}
			},
			{
				// Group by user and calculate totalOrders and totalAmount
				$group: {
					_id: "$_id", // Group by user ID
					firstName: { $first: "$firstName" }, // Retain name field
					lastName: { $first: "$lastName" }, // Retain name field
					email: { $first: "$email" }, // Retain email field
					phone: { $first: "$phone" }, // Retain phone number
					totalOrders: { $sum: 1 }, // Count number of orders
					totalAmount: { $sum: "$orders.totalAmount" } // Sum totalAmount from orders
				}
			},
			{
				// Sort by totalAmount in descending order
				$sort: {
					totalAmount: -1
				}
			},
			{
				// Optional: Format the final output
				$project: {
					_id: 1,
					firstName: 1,
					lastName: 1,
					name: 1,
					email: 1,
					phone: 1,
					totalOrders: 1,
					totalAmount: 1
				}
			}
		]);
		// If order is found, render the order details page and pass the order data
		return res.render("admin/users", {
			layout: 'admin',  // Use the dashboard layout
			users: users,  // Pass user data to the view
			title: 'Dashboard',  // Title for the page,
		});
	} catch (error) {
		console.error(error);
	}
})


router.get('/orders/:status', async (req, res) => {
	try {
		const orderWithDetails = await Orders.aggregate([
			{
				$match: {
					"status": req.params.status
				}
			},
			// 1. Sort orders in descending order (most recent first)
			{ $sort: { _id: -1 } },

			// 2. If the "address" field is stored as an array, unwind it.
			{
				$unwind: {
					path: "$address",
					preserveNullAndEmptyArrays: true
				}
			},

			// 3. Lookup the payment details from the Payment collection
			{
				$lookup: {
					from: "payments",        // Collection name for Payment model (usually lower case plural)
					localField: "_id",       // Field in Orders
					foreignField: "orderId", // Field in Payment documents referencing the order's _id
					as: "payments"
				}
			},

			// 4. Unwind the payments array (if an order may have only one payment)
			{
				$unwind: {
					path: "$payments",
					preserveNullAndEmptyArrays: true // In case no payment exists for an order
				}
			},

			// 5. (Optional) If payments contain an array of transactions that you want to unwind:
			{
				$unwind: {
					path: "$payments.transaction",
					preserveNullAndEmptyArrays: true // In case no transaction exists
				}
			},

			// 6. Lookup the address details from the Addresses collection using the unwound address field
			{
				$lookup: {
					from: "addresses",       // Collection name for Addresses
					localField: "address",   // Now this is a single ObjectId from the unwound array
					foreignField: "_id",     // Field in Addresses collection
					as: "addressDetails"
				}
			},

			// 7. Unwind the addressDetails array
			{
				$unwind: {
					path: "$addressDetails",
					preserveNullAndEmptyArrays: true // In case no address exists
				}
			}
		]);

		return res.render("admin/orders", {
			layout: 'admin',  // Use the dashboard layout
			orders: orderWithDetails,  // Pass user data to the view
			title: 'Dashboard',  // Title for the page,
		});
	} catch (error) {
		console.error(error);
	}
});

router.get('/products', async (req, res) => {
	try {
		const products = await Products.find({}).sort({ _id: -1 });
		return res.render("admin/products", {
			layout: 'admin',  // Use the dashboard layout
			products: products,  // Pass user data to the view
			title: 'Dashboard',  // Title for the page,
		});
	} catch (error) {
		console.error(error);
	}
});


// Get all orders
router.delete('/products/:id', async (req, res) => {
	try {
		const data = await Products.deleteOne({ _id: req.params.id });
		return res.status(200).json({ data: "Product Deleted successfully" });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Failed to Delete products', error: err.message });
	}
});


// Get all orders
router.put('/status/change/:id', async (req, res) => {
	try {
		const orderDetails = await Orders.findOne({ _id: req.params.id });
		const order = await Orders.updateOne({
			_id: req.params.id
		},
			{
				$set: {
					status: req.body.status
				}
			});
		if (req.body.status === "delivered") {
			const userDetails = await Users.findOne({ _id: orderDetails.orderBy });
			const order = {
				orderNumber: orderDetails.orderNumber,
				customerName: orderDetails.customerName,
				customerEmail: userDetails.email,
				orderDate: orderDetails.orderDate,
				totalAmount: orderDetails.totalAmount
			}
			delieverdMail(order);
		} else if (req.body.status === "confirmed") {
			await PaymentTransaction.create({
				orderId: orderDetails._id,
				amount: orderDetails.totalAmount
			})
		}
		return res.status(200).json(order);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
	}
});

// Route for viewing order details by orderNumber
router.get('/order/:orderNumber', async (req, res) => {
	const { orderNumber } = req.params;
	try {
		// Aggregate query to fetch the order based on orderNumber, and populate the product details
		const order = await Orders.aggregate([
			// 1. Match the order by _id (using orderNumber as an ObjectId)
			{
				$match: { _id: new ObjectId(orderNumber) }
			},
			// 2. Lookup the address details from the Addresses collection
			{
				$lookup: {
					from: "addresses",       // Collection where addresses are stored
					localField: "address",   // Field in Orders containing the address ObjectId
					foreignField: "_id",     // Field in Addresses collection
					as: "addressDetails"
				}
			},
			// 3. Unwind the addressDetails array (if only one address is expected)
			{
				$unwind: {
					path: "$addressDetails",
					preserveNullAndEmptyArrays: true
				}
			},
			// 5. Unwind the products array from the order
			{
				$unwind: "$products"
			},
			// 6. Lookup the product details from the 'products' collection
			{
				$lookup: {
					from: "products",                // Collection where product details are stored
					localField: "products.productId",// Field in Order's products array
					foreignField: "_id",             // _id in the products collection
					as: "productsDetails"            // Alias for merged product details
				}
			},
			// 7. Unwind the productsDetails array to flatten the resulting array
			{
				$unwind: {
					path: "$productsDetails",
					preserveNullAndEmptyArrays: true
				}
			},
			// 8. Match to ensure the product lookup is valid (productId equals productsDetails._id)
			{
				$match: {
					$expr: {
						$eq: ["$products.productId", "$productsDetails._id"]
					}
				}
			},
			// 9. Group back to a single order document (grouped by orderNumber) and aggregate products
			{
				$group: {
					_id: "$orderNumber",  // Group by orderNumber
					customerName: { $first: "$customerName" },
					customerPhone: { $first: "$customerPhone" },
					address: { $first: "$address" },
					addressDetails: { $first: "$addressDetails" },
					payments: { $first: "$payments" },
					totalAmount: { $first: "$totalAmount" },
					instructions: { $first: "$instructions" },
					timeSlot: { $first: "$timeSlot" },
					paymentMethod: { $first: "$paymentMethod" },
					orderDate: {
						$first: {
							$dateToString: {
								format: "%d-%m-%Y",  // Format as dd-mm-yyyy
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
		return res.status(200).json(order);
		// res.render('order-details', { order: order[0] }); // Pass the first matched order to the template
	} catch (error) {
		console.error(error);
	}
});



// Route to get all payment transaction details with order lookup
router.get('/payments', async (req, res) => {
	try {
		// Lookup the payment details by orderId using $lookup
		const { Types } = require('mongoose');

		const paymentDetails = await PaymentTransaction.aggregate([
			{
				$lookup: {
					from: "orders",
					localField: "orderId",
					foreignField: "_id",
					as: "orderDetails"
				}
			},
			{
				$unwind: "$orderDetails" // Unwind orderDetails to flatten the array
			}
		]);
		return res.render("admin/payments", {
			layout: 'admin',  // Use the dashboard layout
			paymentDetails: paymentDetails,  // Pass user data to the view
			title: 'Dashboard',  // Title for the page,
		});
	} catch (error) {
		res.status(500).json({ message: 'Error retrieving payment transactions', error });
	}
});

// Route to save payment details
router.put('/payment-transaction/:id', async (req, res) => {
	try {
		await PaymentTransaction.updateOne({
			_id: req.params.id
		}, {
			$set: {
				paymentStatus: 'Completed',
				paymentType: req.body.paymentType
			}
		});
		return res.status(200).json({ message: 'Payment updated successfully', payment });
	} catch (error) {
		res.status(500).json({ message: 'Error udpate payment status', error });
	}
});

// Login route
router.post('/login', adminLogin);
router.get('/logout', logout);
module.exports = router;
