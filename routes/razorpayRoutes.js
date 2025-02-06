const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Razorpay API secret key from .env file
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Initialize Razorpay instance with API credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order API
router.post('/create-order', async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;

  const options = {
    amount: amount * 100, // Amount in paise (Razorpay expects the amount in paise)
    currency: currency,
    receipt: receipt || `receipt_${Math.random()}`,
  };
  try {
    // Create an order on Razorpay
    const order = await razorpay.orders.create(options);
    res.json({
      id: order.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating order' });
  }
  });

// POST endpoint to verify the payment
router.post('/verify-payment', (req, res) => {
  const { paymentId, orderId, signature } = req.body;

  // Generate the signature using the order ID, payment ID, and secret key
  const generatedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(orderId + '|' + paymentId)  // Concatenate order ID and payment ID
    .digest('hex');

  // Compare generated signature with the Razorpay signature
  if (generatedSignature === signature) {
    // Payment is verified
    res.json({ success: 'Payment verified successfully' });
  } else {
    // Payment verification failed
    res.status(400).json({ error: 'Payment verification failed' });
  }
});


module.exports = router;
