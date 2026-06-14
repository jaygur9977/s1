const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,  // This already creates an index
    trim: true,
    match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  uniqueKey: {
    type: String,
    required: [true, 'Unique key is required'],
    unique: true,  // This already creates an index
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be 8 characters']
  },
  pin: {
    type: String,
    required: [true, 'PIN is required'],
    validate: {
      validator: function(value) {
        // Allow if already hashed (starts with $2a$, $2b$, $2x$, $2y$)
        if (value && value.startsWith('$2')) {
          return true;
        }
        // Otherwise validate as 4 digits
        return /^\d{4}$/.test(value);
      },
      message: 'PIN must be 4 digits'
    }
  },
  securityConsent: {
    type: Boolean,
    required: [true, 'Security consent is required'],
    default: false
  },
  sandboxCreated: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// ❌ REMOVE THESE LINES - They create duplicate indexes
// userSchema.index({ mobileNumber: 1 });
// userSchema.index({ uniqueKey: 1 });

// ✅ Only keep this if you need it
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Hash PIN before saving
userSchema.pre('save', async function() {
  if (!this.isModified('pin')) {
    return;
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);
  } catch (error) {
    throw error;
  }
});

// Auto-set sandboxCreated flag
userSchema.pre('save', function() {
  if (this.isNew) {
    this.sandboxCreated = true;
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Compare PIN method
userSchema.methods.comparePin = async function(candidatePin) {
  try {
    return await bcrypt.compare(candidatePin, this.pin);
  } catch (error) {
    throw new Error('PIN comparison failed');
  }
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  this.loginAttempts += 1;
  
  if (this.loginAttempts >= 5) {
    this.isLocked = true;
  }
  
  await this.save();
  return this.loginAttempts;
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.isLocked = false;
  await this.save();
};

// Update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  await this.save();
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    fullName: this.fullName,
    mobileNumber: this.mobileNumber,
    uniqueKey: this.uniqueKey,
    sandboxCreated: this.sandboxCreated,
    lastLogin: this.lastLogin,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.pin;
  delete user.__v;
  delete user.loginAttempts;
  delete user.isLocked;
  
  user.id = user._id;
  delete user._id;
  
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;