const mongoose = require('mongoose');

// Replace with your actual database name
const MONGO_URI = 'mongodb+srv://aksbloggeracc:Akash1060@dogo.r9qs1.mongodb.net/?retryWrites=true&w=majority&appName=dogo';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1); // Exit the process with failure
    }
};

module.exports = connectDB;
