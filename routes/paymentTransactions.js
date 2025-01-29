const express = require('express');
const Payment = require('../model/paymentTransaction');  // Assuming the Payment model is in the "models" folder

const router = express.Router();

// Route to save payment details
router.put('/:id', async (req, res) => {
  try {
    await Payment.updateOne({
      _id: req.params.id
    }, {
      $set: req.body
    });
    return res.status(200).json({ message: 'Payment updated successfully'});
  } catch (error) {
    res.status(500).json({ message: 'Error udpate payment status', error });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log(req.body);
	  const payment  = await Payment.create(req.body);
    return res.status(200).json({ message: 'Payment Created successfully', payment });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error udpate payment status', error });
  }
});

module.exports = router;
