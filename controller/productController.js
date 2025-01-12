const Product = require('../model/products');  // Import the Product model

// API to create a new product
const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock, imageUrl, discount } = req.body;

        // Create a new product using the provided data
        const newProduct = new Product({
            name,
            description,
            price,
            category,
            stock,
            imageUrl,
            discount,
        });

        // Save the new product to the database
        await newProduct.save();
        res.status(201).json({
            message: 'Product created successfully!',
            product: newProduct,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
};

// API to get all products
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({_id: -1});
        res.status(200).json({
            message: 'Products fetched successfully!',
            products,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

// Export the controller functions
module.exports = {
    createProduct,
    getAllProducts,
};
