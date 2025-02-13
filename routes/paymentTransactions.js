const express = require('express');
const Payment = require('../model/paymentTransaction');  // Assuming the Payment model is in the "models" folder

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
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
	  const payment  = await Payment.create(req.body);
    return res.status(200).json({ message: 'Payment Created successfully', payment });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error udpate payment status', error });
  }
});

router.get('/:id', async (req, res) => {
  try {
    let paymentDetails = await Payment.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.params.id) } // Find payment by ID
      },
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "orderDetails"
        }
      },
      { $unwind: "$orderDetails" }, // Flatten orderDetails
      {
        $lookup: {
          from: "addresses", // Collection for addresses
          localField: "orderDetails.address", // The address field in orderDetails
          foreignField: "_id", // Matching _id in addresses collection
          as: "addressDetails"
        }
      },
      { $unwind: { path: "$addressDetails", preserveNullAndEmptyArrays: true } } // Flatten addressDetails (keep nulls)
    ]);
    
    paymentDetails = paymentDetails[0];
    console.log(paymentDetails);
    if (!paymentDetails) {
      return res.render("error", {
        layout: 'blank'  // Use the dashboard layout
      });
    }
    return res.render("selectPaymentMethod", {
			layout: 'blank',  // Use the dashboard layout
			isAuthenticated: true,
			user: req.user,  // Pass user data to the view
			title: 'Dashboard',  // Title for the page,
      paymentDetails: paymentDetails
		});
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error udpate payment status', error });
  }
});

module.exports = router;
