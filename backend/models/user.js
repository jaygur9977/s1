const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\+?[\d\s-]{10,15}$/.test(v);
      },
      message: 'Please enter a valid mobile number'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },
  uniqueKey: {
    type: String,
    required: true,
    select: false
  },
  fourDigitKey: {
    type: String,
    required: true,
    select: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes
userSchema.index({ mobile: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;