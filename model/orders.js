const mongoose = require('mongoose');
const autoIncrement = require('mongoose-sequence')(mongoose);


// Define the Order Schema
const orderSchema = new mongoose.Schema({
    orderNumber: { type: Number, unique: true },
    customerName: { type: String, required: true }, // Customer's full name
    customerPhone: { type: String, required: true }, // Customer's phone number
    address: [ // Address details (stored as an array to allow multiple addresses if needed)
        {
            line1: { type: String, required: true }, // Address Line 1
            line2: { type: String, required: false }, // Address Line 2 (Optional)
            city: { type: String, required: true }, // City
            state: { type: String, required: true }, // State
            zip: { type: String, required: true }, // ZIP Code
            addressType: { type: String, enum: ['home', 'other'], required: true } // Address Type (Home or Other)
        }
    ],
    instructions: { type: String, default: '' }, // Additional delivery instructions
    timeSlot: { // Delivery time slot
        type: String,
        enum: ['10am-6pm', '10am-9pm'], // Valid time slots
        required: true,
        default: new Date()
    },
    paymentMethod: { // Payment method
        type: String,
        default: 'Cash on Delivery'
    },
    orderDate: { type: Date, default: new Date() }, // Order creation date
    status: { // Order status
        type: String,
        enum: ['pending', 'confirmed', 'delivered', 'cancelled'],
        default: 'pending'
    },
    cancelReason: {
        type: String
    },
    orderBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
        },
        quantity: {
            type: Number
        },
        totalPrice: {
            type: Number
        }
    }]
});

orderSchema.plugin(autoIncrement, { inc_field: 'orderNumber', start_seq: 1001 });
// Create the Order model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
