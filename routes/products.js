const express = require('express');
const router = express.Router();
const Product = require('../model/products');  // Assuming your model is in the 'models/product.js' file
const RenderUser = require("../middleware/userValidation")
// Import the product controller
const { createProduct, getAllProducts } = require('../controller/productController');
const jwt = require('jsonwebtoken');


// POST route to create a new product
router.post('/create', createProduct);


// GET route to fetch all products and render them in the products.hbs page
router.get('/', async (req, res) => {
	try {
		const token = req.cookies.token || req.headers['authorization'] && req.headers['authorization'];
		// Fetch all products from the database
		const products = await Product.find();
		if (token) {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			req.user = decoded;
			return res.render("productsLogin", {
				products: products,
				layout: 'dashboard',  // Use the dashboard layout
				isAuthenticated: true,
				user: req.user,  // Pass user data to the view
				title: 'Dashboard'  // Title for the page,
			});
		}
		// Render the products in the products.hbs template
		res.render('products', { products: products });
	} catch (err) {
		console.error('Error fetching products:', err);
		res.status(500).send('Server Error');
	}
});



module.exports = router;
