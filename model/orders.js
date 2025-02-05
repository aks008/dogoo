const mongoose = require('mongoose');
const autoIncrement = require('mongoose-sequence')(mongoose);


// Define the Order Schema
const orderSchema = new mongoose.Schema({
    orderNumber: { type: Number, unique: true },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'address',
        required: true,
    },
    instructions: { type: String, default: '' }, // Additional delivery instructions
    timeSlot: { // Delivery time slot
        type: String,
        required: true
    },
    orderDate: {
        type: Date,
        default: new Date()
    }, // Order creation date
    status: { // Order status
        type: String,
        enum: ['Created', 'pending-payment', 'payment-confirmed', 'pending', 'dispatched', 'payment-faild', 'confirmed', 'delivered', 'cancelled', 'completed'],
        default: 'Created'
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
