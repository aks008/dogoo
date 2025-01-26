const mongoose = require('mongoose');

// Replace with your actual database name
const MONGO_URI = 'mongodb+srv://dogobuscuits:hujp9F2D6YXKG85Y@cluster0.tdhw5.mongodb.net/Dogo';

const connectDB = async () => {
    try {
        mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1); // Exit the process with failure
    }
};

module.exports = connectDB;

