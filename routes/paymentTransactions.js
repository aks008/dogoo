const express = require('express');
const Payment = require('../model/paymentTransaction');  // Assuming the Payment model is in the "models" folder

const router = express.Router();

// Route to save payment details
router.put('/:id', async (req, res) => {
  try {
    const payment = new Payment({
      orderId,
      amount,
      paymentType,
      paymentStatus: 'Completed'  // Assuming the payment is successful
    });

	await payment.updateOne({
		  _id: orderId
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

module.exports = router;
