const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/authentication'); // Assuming this middleware is for JWT validation
const { adminLogin, logout } = require('../controller/authController');
const jwt = require('jsonwebtoken');
const Users = require('../model/users');
const Orders = require('../model/orders');
const Products = require('../model/products');


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
		const orders = await Orders.find({ status: req.params.status });
		return res.render("admin/orders", {
			layout: 'admin',  // Use the dashboard layout
			orders: orders,  // Pass user data to the view
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
router.put('/status/change/:id', async (req, res) => {
	try {
		const orders = await Orders.updateOne({ _id: req.params.id },
			{
				$set: {
					status: req.body.status
				}
			});
		return res.status(200).json(orders);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
	}
});

// Login route
router.post('/login', adminLogin);
router.get('/logout', logout);
module.exports = router;
