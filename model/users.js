const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
	firstName: {
		type: String,
	},
	lastName: {
		type: String,
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	password: {
		type: String,
		required: true,
	},
	gender: {
		type: String
	},
	birthdate: {
		type: Date
	},
	phone: {
		type: String,
		required: true,
	},
	isVerifiedStatus: {
		type: String,
		enum: ["pending", "in-process", "verified"],
		default: "pending",
	},
	address: [ // Address details (stored as an array to allow multiple addresses if needed)
		{
			customerName: { type: String, required: true },
			customerPhone: { type: String, required: true },
			phone: { type: String, required: true },
			line1: { type: String, required: true }, // Address Line 1
			line2: { type: String, required: false }, // Address Line 2 (Optional)
			city: { type: String, required: true }, // City
			state: { type: String, required: true }, // State
			zip: { type: String, required: true }, // ZIP Code
			country: { type: String, required: true }, // Country
			addressType: { type: String, enum: ['home', 'other'], required: true }, // Address Type (Home or Other)
			isDefault: { type: Boolean }
		}
	],
	attachment: {
		fieldname: {
			type: String
		},
		originalname: {
			type: String
		},
		mimetype: {
			type: String
		},
		path: {
			type: String
		}
	},
	role: {
		type: String,
		enum: ["admin", "customer"],
		default: "customer"
	}
});

userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save hook to check if new address data is the same as existing addresses
userSchema.pre('save', async function (next) {
	const user = this;

	// Only run this if the `address` field is modified
	if (user.isModified('address')) {
		const existingAddresses = user.address || [];

		// Check if any of the new addresses match an existing address
		const isDuplicate = user.address.some(newAddress => {
			return existingAddresses.some(existingAddress => {
				return (
					existingAddress.line1 === newAddress.line1 &&
					existingAddress.line2 === newAddress.line2 &&
					existingAddress.city === newAddress.city &&
					existingAddress.state === newAddress.state &&
					existingAddress.zip === newAddress.zip &&
					existingAddress.country === newAddress.country &&
					existingAddress.addressType === newAddress.addressType
				);
			});
		});

		// If duplicate, stop save operation
		if (isDuplicate) {
			const error = new Error('Duplicate address detected. Address already exists.');
			return next(error);
		}
	}

	next();
});

module.exports = mongoose.model('User', userSchema);
