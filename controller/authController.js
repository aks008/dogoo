const User = require('../model/users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const serviceMail = require("../service/welcomeMail");
exports.register = async (req, res) => {
  const { email } = req.body;
  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user with hashed password
    const user = new User(req.body);
    await user.save();
    serviceMail(user);
    res.status(201).json({
      message: 'Registration successful. Please log in.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.logout = (req, res) => {
  // Clear the token cookie if you're using JWT
  res.clearCookie('token', { httpOnly: true, secure: true }); // secure: true ensures cookies are sent only over HTTPS

  // Redirect the user to the home page
  return res.redirect(process.env.BASE_PATH);
};
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare the password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id, role: "customer" }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Set the token in a cookie (HTTP-Only cookie for security)
    res.cookie('token', token, {
      httpOnly: true, // This helps prevent XSS attacks by not allowing JavaScript access to the cookie
      secure: 'production', // Ensure cookies are sent only over HTTPS in production
      maxAge: 3600 * 2000, // Cookie expiry time (1 hour)
    });
    res.status(200).json({
      message: 'Login successful',
      token,
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    console.log(user);

    if (!user || !user.role || user.role !== "admin") {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare the password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: '2h' });

    // Set the token in a cookie (HTTP-Only cookie for security)
    res.cookie('token', token, {
      httpOnly: true, // This helps prevent XSS attacks by not allowing JavaScript access to the cookie
      secure: 'production', // Ensure cookies are sent only over HTTPS in production
      maxAge: 3600 * 2000, // Cookie expiry time (1 hour)
    });
    res.status(200).json({
      message: 'Login successful',
      token,
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};