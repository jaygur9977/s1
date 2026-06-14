const User = require('../models/User');
const { validationResult } = require('express-validator');
const generateUniqueKey = require('../utils/generateKey');

// ==================== REGISTER CONTROLLER ====================

const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }

    const { fullName, mobileNumber, password, pin, securityConsent } = req.body;

    // Double check security consent
    if (!securityConsent) {
      return res.status(400).json({
        success: false,
        message: 'You must accept the security terms and conditions'
      });
    }

    // Check if mobile number already exists
    const existingMobile = await User.findOne({ mobileNumber });
    if (existingMobile) {
      return res.status(409).json({
        success: false,
        message: 'An account with this mobile number already exists. Please use a different number.'
      });
    }

    // Generate truly unique key
    let uniqueKey;
    let keyExists = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (keyExists && attempts < maxAttempts) {
      uniqueKey = generateUniqueKey();
      const existingKey = await User.findOne({ uniqueKey });
      
      if (!existingKey) {
        keyExists = false;
      }
      attempts++;
    }

    if (keyExists) {
      return res.status(500).json({
        success: false,
        message: 'Unable to generate unique key. Please try again.'
      });
    }

    // Create new user
    const user = new User({
      fullName,
      mobileNumber,
      uniqueKey,
      password,
      pin,
      securityConsent,
      sandboxCreated: true,
      lastLogin: new Date()
    });

    // Save user to database
    await user.save();

    console.log(`✅ New user registered: ${user.fullName} (${user.uniqueKey})`);

    // Return success response with user details
    res.status(201).json({
      success: true,
      message: '🎉 Account created successfully! Your personal sandbox is ready.',
      data: {
        fullName: user.fullName,
        mobileNumber: user.mobileNumber,
        uniqueKey: user.uniqueKey,
        password: req.body.password, // Send back original password (only once)
        pin: req.body.pin, // Send back original PIN (only once)
        sandboxCreated: user.sandboxCreated,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const fieldNames = {
        mobileNumber: 'Mobile number',
        uniqueKey: 'Unique key'
      };
      
      return res.status(409).json({
        success: false,
        message: `${fieldNames[field] || field} already exists. Please try again.`
      });
    }

    // Handle validation errors from Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// ==================== LOGIN CONTROLLER ====================

const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }

    const { uniqueKey, password, pin } = req.body;

    // Find user by unique key
    const user = await User.findOne({ uniqueKey });

    // If user not found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your unique key, password, and PIN.'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTime = new Date(user.updatedAt).getTime() + (30 * 60 * 1000); // 30 min lock
      const now = Date.now();
      
      if (now < lockTime) {
        const remainingMinutes = Math.ceil((lockTime - now) / 60000);
        return res.status(403).json({
          success: false,
          message: `Account is locked due to multiple failed attempts. Please try again in ${remainingMinutes} minutes.`
        });
      } else {
        // Reset lock after 30 minutes
        await user.resetLoginAttempts();
      }
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support for assistance.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      
      const attemptsLeft = 5 - user.loginAttempts;
      const message = attemptsLeft > 0
        ? `Invalid password. ${attemptsLeft} attempts remaining before account lock.`
        : 'Account locked due to multiple failed attempts. Please try again after 30 minutes.';
      
      return res.status(401).json({
        success: false,
        message
      });
    }

    // Verify PIN
    const isPinValid = await user.comparePin(pin);
    if (!isPinValid) {
      await user.incrementLoginAttempts();
      
      const attemptsLeft = 5 - user.loginAttempts;
      const message = attemptsLeft > 0
        ? `Invalid PIN. ${attemptsLeft} attempts remaining before account lock.`
        : 'Account locked due to multiple failed attempts. Please try again after 30 minutes.';
      
      return res.status(401).json({
        success: false,
        message
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // Update last login timestamp
    await user.updateLastLogin();

    console.log(`✅ User logged in: ${user.fullName} (${user.uniqueKey})`);

    // Return success response
    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.fullName}! Your sandbox is ready.`,
      data: {
        fullName: user.fullName,
        mobileNumber: user.mobileNumber,
        uniqueKey: user.uniqueKey,
        sandboxCreated: user.sandboxCreated,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// ==================== GET PROFILE CONTROLLER ====================

const getProfile = async (req, res) => {
  try {
    const { uniqueKey } = req.params;

    // Find user by unique key
    const user = await User.findOne({ uniqueKey, isActive: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please check your unique key.'
      });
    }

    // Return public profile
    res.status(200).json({
      success: true,
      data: user.getPublicProfile()
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// ==================== CHECK USER EXISTS ====================

const checkUser = async (req, res) => {
  try {
    const { uniqueKey } = req.params;

    const user = await User.findOne({ uniqueKey });

    res.status(200).json({
      success: true,
      exists: !!user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== DELETE ACCOUNT ====================

const deleteAccount = async (req, res) => {
  try {
    const { uniqueKey } = req.params;

    const user = await User.findOneAndDelete({ uniqueKey });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`🗑️  Account deleted: ${user.fullName} (${user.uniqueKey})`);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully. Your data has been permanently removed.'
    });

  } catch (error) {
    console.error('❌ Delete account error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== EXPORT CONTROLLERS ====================

module.exports = {
  register,
  login,
  getProfile,
  checkUser,
  deleteAccount
};