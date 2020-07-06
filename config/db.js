const mongoose = require('mongoose');
const config = require('config');

const connectDB = async () => {
    try {
        await mongoose.connect(config.get('mongoURI'), {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`[DATABASE CONNECTED]`);
    } catch (error) {
        console.log(error.message);
    }
};

module.exports = connectDB;
