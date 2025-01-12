const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
// Generate a new ObjectId
const Cart = require('../model/cart');
const users = require('../model/users');

router.get('/', async function (req, res) {
    const cartDetails = await Cart.aggregate([
        // Match the cart with the specific userId
        {
            $match: {
                userId: new mongoose.Types.ObjectId(req.user.id),  // Replace 'userId' with the actual userId variable,
                isDeleted : false
            }
        },
        // Unwind the cart items (if the cart has an array of products)
        {
            $unwind: "$products"  // Assuming the cart contains an array of cartItems
        },
        // Lookup product details by productId from the Product collection
        {
            $lookup: {
                from: "products",  // Assuming the products are stored in the "products" collection
                localField: "products.productId",  // The productId in the cart
                foreignField: "_id",  // The product's _id in the products collection
                as: "productDetails"  // Alias for the product details in the result
            }
        },
        // Optionally project the fields you need (e.g., product details and quantity)
        {
            $project: {
                _id: 0,
                userId: 1,
                productId: "$products.productId",  // Include productId from cartItems
                quantity: "$products.quantity",  // Assuming cartItems has a quantity field
                productDetails: { $arrayElemAt: ["$productDetails", 0] }  // Take the first (and only) match from the $lookup
            }
        }
    ]);
    // Calculate total price for each item
    cartDetails.forEach(item => {
        item.totalPrice = (item.productDetails.price * item.quantity).toFixed(2); // Calculating total price
    });
    const user = await users.findOne({ _id: req.user.id });
    return res.render("cart", {
        layout: 'dashboard',  // Use the dashboard layout
        isAuthenticated: true,
        user: req.user,  // Pass user data to the view
        title: 'Dashboard',  // Title for the page,,
        items: cartDetails,
        profile:user
    });
});

// Add to Cart
router.post('/add', async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id
    if (!productId || !quantity) {
        return res.status(400).json({ error: 'productId, and quantity are required.' });
    }

    try {
        let cart = await Cart.findOne({ userId });
        if (cart) {
            // Check if the product already exists in the cart
            const productIndex = cart.products.findIndex(
                (item) => item.productId.toString() === productId
            );
            if (productIndex > -1) {
                // Product exists, update the quantity
                cart.products[productIndex].quantity += quantity;
            } else {
                // Product does not exist, add it to the cart
                cart.products.push({ productId, quantity });
            }
        } else {
            // Create a new cart for the user
            cart = new Cart({
                userId,
                products: [{ productId, quantity }],
            });
        }
        await cart.save();
        res.status(200).json({ message: 'Product added to cart successfully!', cart });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: 'An error occurred while adding to the cart.' });
    }
});

// API to get the total count of products in the cart for a specific user
router.get('/count', async (req, res) => {
    try {
        // Aggregate the total number of products in the cart for the user
        const cartItems = await Cart.findOne({
            userId: req.user.id,
            isDeleted:  false
        });
        if (cartItems) {
            return res.json({ items: cartItems.products.length });
        } else {
            return res.json({ items: 0 });
        }
        // Send the total item count to the client
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
});


router.put('/update/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { action } = req.body;

        // Get cart from the database (this is just a placeholder)
        const cart = await Cart.findOne({
            userId: new mongoose.Types.ObjectId(req.user.id),
            'products.productId': new mongoose.Types.ObjectId(productId)
        });

        // Find the item in the cart
        const productIdObject = new mongoose.Types.ObjectId(productId);

        // Find the product in the cart
        const foundProduct = cart.products.find(product =>
            product.productId.equals(productIdObject)
        );

        if (!foundProduct) {
            return res.status(404).json({ success: false, message: 'Item not found in the cart' });
        }

        // Update quantity based on the action
        if (action === 'increase') {
            foundProduct.quantity += 1;
        } else if (action === 'decrease') {
            if (foundProduct.quantity > 1) {
                foundProduct.quantity -= 1;
            } else {
                return res.status(400).json({ success: false, message: 'Quantity cannot be less than 1' });
            }
        }
        await Cart.updateOne(
            {
                userId: new mongoose.Types.ObjectId(req.user.id),
                'products.productId': new mongoose.Types.ObjectId(productId) // Locate the product in the array
            },
            {
                $set: { 'products.$.quantity': foundProduct.quantity } // Update the correct field
            }
        );

        return res.status(200).send('Cart updated successfully');
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});


// DELETE /cart/product
router.delete('/product/:id', async (req, res) => {
    try {
        // Remove the product from the cart
        const result = await Cart.updateOne(
            { userId: new mongoose.Types.ObjectId(req.user.id) },
            { $pull: { products: { productId: new mongoose.Types.ObjectId(req.params.id) } } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "Product not found in cart or already removed" });
        }

        res.status(200).json({ message: "Product removed from cart successfully" });
    } catch (err) {
        console.error("Error deleting product from cart:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
module.exports = router;
