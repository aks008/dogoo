const mongoose = require('mongoose');

// Define the schema for a product
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,  // Name is required
        trim: true,      // Removes extra spaces from the beginning and end of the string
    },
    description: {
        type: String,
        required: true,  // Description is required
    },
    price: {
        type: Number,
        required: true,  // Price is required
        min: [0, 'Price must be a positive number'], // Ensure price is not negative
    },
    category: {
        type: String,
        required: true,  // Category is required
    },
    stock: {
        type: Number,
        required: true,  // Stock is required
        min: [0, 'Stock must be a positive number'], // Ensure stock isn't negative
    },
    imageUrl: {
        type: String,
        required: false, // Image is optional
    },
    discount: {
        type: Number,
        required: false,  // Discount is optional
        min: [0, 'Discount must be a positive number'],  // Ensure discount is non-negative
        max: [100, 'Discount cannot be more than 100%'], // Discount cannot exceed 100%
    },
    createdAt: {
        type: Date,
        default: Date.now,  // Automatically sets the current date and time when the product is created
    },
});

// Create the Product model
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
