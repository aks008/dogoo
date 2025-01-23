var express = require('express'); 
var router = express.Router();
const RenderUser = require("../middleware/userValidation")

/* GET home page. */
router.get('/', function (req, res) {
return RenderUser.renderUser(req, res, "index");
});

router.get('/contact', function(req, res) {
  return RenderUser.renderUser(req, res, "contact");
});

router.get('/layout', function (req, res) {
  return RenderUser.renderUser(req, res, "layout");
});

router.get('/faqs', function (req, res) {
  return RenderUser.renderUser(req, res, "faqs");
});

router.get('/feed', function (req, res) {
  return RenderUser.renderUser(req, res, "feed");
});

// router.get('/products', function(req, res) {
// return     RenderUser.renderUser(req, res, "products");
// });

router.get('/subscription', function (req, res) {
  return RenderUser.renderUser(req, res, "subscription");
});

module.exports = router;
