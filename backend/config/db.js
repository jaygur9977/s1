const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    });

    console.log(`✅ MongoDB Connected Successfully`);
    console.log(`📦 Host: ${conn.connection.host}`);
    console.log(`🗄️  Database: ${conn.connection.name}`);
    console.log(`📊 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);

    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('🟢 Mongoose connection established');
    });

    mongoose.connection.on('error', (err) => {
      console.error('🔴 Mongoose connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('🟡 Mongoose connection disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('👋 Mongoose connection closed due to app termination');
      process.exit(0);
    });

    return conn;

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Name: ${error.name}`);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('   💡 Tip: Check your MongoDB Atlas connection string and IP whitelist');
    }
    
    // Retry connection after 5 seconds
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

// Export the connection function
module.exports = connectDB;

// Also export mongoose for use in other files if needed
module.exports.mongoose = mongoose;