const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Removed deprecated options - Mongoose 6+ uses these by default
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes for better performance
    const User = require('../models/User');
    await User.createIndexes();
    console.log('✅ Database indexes created');
    
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;