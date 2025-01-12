var express = require('express'); 
var router = express.Router();
const users = require("../model/users");
const jwt = require('jsonwebtoken');
const authenticateToken = require("../middleware/authentication");

/* GET home page. */
router.get('/dashboard', authenticateToken.authenticateUser,async (req, res) => {
  const user = await users.findOne({ _id: req.user.id });
  res.render('dashboard', { 
    layout: 'dashboard',  // Use the dashboard layout
    isAuthenticated: true, 
    user: req.user,  // Pass user data to the view
    title: 'Dashboard',  // Title for the page
    profile:user
  });
});

router.get('/contact', function(req, res, next) {
  res.render('contact',{ isAuthenticated: !!req.user, user: req.user });
});

router.get('/layout', function(req, res, next) {
  res.render('layout', { isAuthenticated: !!req.user, user: req.user });
});

router.get('/faqs', function(req, res, next) {
  res.render('faqs', { isAuthenticated: !!req.user, user: req.user });
});

router.get('/feed', function(req, res, next) {
  res.render('feed', { isAuthenticated: !!req.user, user: req.user });
});

// router.get('/products', function(req, res, next) {
//   res.render('products');
// });

router.get('/subscription', function(req, res, next) {
  res.render('subscription', { isAuthenticated: !!req.user, user: req.user });
});

module.exports = router;
