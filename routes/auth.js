const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controller/authController');

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

// Logout route
router.post('/logout', logout);

module.exports = router;
