const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Orders',
    required: true,
  },
  amount: {
    type: Number, required: true
  },
  paymentType: {
    type: String, enum: ['Cash', 'UPI', 'none', 'Online'], default: 'none'
  },
  paymentStatus: {
    type: String, enum: ['pending', 'completed', 'failed', 'success', 'Pay-On-Delivery'], default: 'pending'
  },
  transaction: {
    type: Object
  },
  createdAt: {
    type: Date, default: Date.now
  }
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
