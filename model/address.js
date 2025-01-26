const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true }, // Address Line 1
    line2: { type: String, required: false }, // Address Line 2 (Optional)
    city: { type: String, required: true }, // City
    state: { type: String, required: true }, // State
    zip: { type: String, required: true }, // ZIP Code
    addressType: { type: String, enum: ['Home', 'Other', "Office"], required: true }, // Address Type (Home or Other)
    isDefault: { type: Boolean }
});

module.exports = mongoose.model('Address', userSchema);
