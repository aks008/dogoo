const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controller/authController');
const authenticateUser = require('../middleware/authentication'); // Assuming this middleware is for JWT validation
const users = require('../model/users');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require("fs");

// Register route
router.post('/register', register);


// Login route
router.post('/login', login);

// Logout route (JWT token invalidation will be handled on frontend)
router.get('/logout', authenticateUser.authenticateUser, logout);

// Route for viewing order details by orderNumber
router.get('/profile', authenticateUser.authenticateUser, async (req, res) => {
  try {
    // Aggregate query to fetch the order based on orderNumber, and populate the product details
	const user = await users.findOne({ _id: req.user.id });
	if (!user) {
    	return res.redirect('/'); // Redirect to the index page
	}
    // If order is found, render the order details page and pass the order data
	return res.render("userProfile", {
			layout: 'dashboard',  // Use the dashboard layout
			isAuthenticated: true,
			user: req.user,  // Pass user data to the view
			title: 'Dashboard',  // Title for the page,
			profile: user
	});
  } catch (error) {
    console.error(error);
  }
});

router.post('/upload', authenticateUser.authenticateUser, async (req, res) => {
	try {
		// Define the uploads directory path
		const uploadsDir = 'public/uploads/user';

		// Create the 'uploads' directory if it doesn't exist
		if (!fs.existsSync(uploadsDir)) {
			fs.mkdirSync(uploadsDir, { recursive: true }); // Create the 'uploads' directory if it doesn't exist
		}
		
		// Multer storage configuration
		const storage = multer.diskStorage({
			destination: (req, file, cb) => {
				cb(null, uploadsDir); // Save uploaded files to 'uploads' directory
			},
			filename: (req, file, cb) => {
				cb(null, Date.now() + path.extname(file.originalname)); // Use timestamp to avoid filename conflicts
			}
		});
		
		const upload = multer({ storage: storage }).single('image');
		
		// Handle file upload
		upload(req, res, async (err) => {
			try {
				if (err) {
					return res.status(400).json({ message: 'File upload failed', error: err });
				}
				const postData = req.body;
				if (req.file) {
					console.log(req.file);
					postData["attachment"] = {
						fieldname: req.file.fieldname,
						originalname: req.file.originalname,
						mimetype: req.file.mimetype,
						path: req.file.path.substring(6)
					} 
				}
				const userDetails = await users.findOne({ _id: req.user.id });				
				// Check if userDetails and the address array exist
				if (userDetails && Array.isArray(userDetails.address) && req.body.profileData && JSON.parse(req.body.profileData).defaultAddressId) {
					// ID to be matched
					const targetId = JSON.parse(req.body.profileData).defaultAddressId; // Assuming the ID is sent in the request body
					// Iterate through the address array and update the isDefault property
					userDetails.address = userDetails.address.map(address => {
						if (address._id.toString() === targetId) {
							return { ...address, isDefault: true }; // Set isDefault to true for the matched address
						} else {
							return { ...address, isDefault: false }; // Set isDefault to false for others
						}
					});
					postData["address"] = userDetails.address;
				}
				await users.updateOne({
					_id : req.user.id
				}, {
					$set : postData
				});
				return res.json({ message: 'User profile updated successfully'});
			} catch (error) {
				console.log(error);
				return res.status(400).send(error);
			}
		});
	} catch (err) {
		return res.status(400).send(error);
	}
});

module.exports = router;
