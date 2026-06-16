const express = require('express');
const router = express.Router();
const User = require('../models/User');
const EncryptionService = require('../utils/encryption');
const { authRateLimiter, generalRateLimiter } = require('../middleware/auth');

// Validation helper
const validateInput = (data, fields) => {
  const errors = [];
  fields.forEach(field => {
    if (!data[field]) {
      errors.push(`${field} is required`);
    }
  });
  return errors;
};

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', authRateLimiter, async (req, res) => {
  try {
    const { name, mobile, password } = req.body;

    // Validate input
    const errors = validateInput(req.body, ['name', 'mobile', 'password']);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Check password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number already registered'
      });
    }

    // Generate unique keys
    let uniqueKey;
    let isUnique = false;
    let attempts = 0;
    
    // Ensure unique key is actually unique
    while (!isUnique && attempts < 10) {
      uniqueKey = EncryptionService.generateUniqueKey();
      const keyExists = await User.findOne({ uniqueKey: EncryptionService.encrypt(uniqueKey) });
      if (!keyExists) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: 'Could not generate unique key. Please try again.'
      });
    }

    const fourDigitKey = EncryptionService.generateFourDigitKey();

    // Encrypt sensitive data
    const encryptedPassword = EncryptionService.encrypt(password);
    const encryptedUniqueKey = EncryptionService.encrypt(uniqueKey);
    const encryptedFourDigitKey = EncryptionService.encrypt(fourDigitKey);

    // Create user
    const user = new User({
      name,
      mobile,
      password: encryptedPassword,
      uniqueKey: encryptedUniqueKey,
      fourDigitKey: encryptedFourDigitKey
    });

    await user.save();

    console.log(`New user registered: ${mobile}`);

    // Return success with unencrypted keys (only time they're shown)
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        name,
        mobile,
        uniqueKey,        // Plain key - only shown once
        fourDigitKey,     // Plain key - only shown once
        _id: user._id,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { mobile, password, uniqueKey, fourDigitKey } = req.body;

    // Validate input
    const errors = validateInput(req.body, ['mobile', 'password', 'uniqueKey', 'fourDigitKey']);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        errors
      });
    }

    // Find user with encrypted fields
    const user = await User.findOne({ mobile }).select('+password +uniqueKey +fourDigitKey');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Decrypt and verify credentials
    try {
      const decryptedPassword = EncryptionService.decrypt(user.password);
      const decryptedUniqueKey = EncryptionService.decrypt(user.uniqueKey);
      const decryptedFourDigitKey = EncryptionService.decrypt(user.fourDigitKey);

      if (password !== decryptedPassword || 
          uniqueKey !== decryptedUniqueKey || 
          fourDigitKey !== decryptedFourDigitKey) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    } catch (decryptError) {
      console.error('Decryption error:', decryptError);
      return res.status(500).json({
        success: false,
        message: 'Error verifying credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    console.log(`User logged in: ${mobile}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   DELETE /api/users/delete
// @desc    Delete user account
// @access  Public
router.delete('/delete', authRateLimiter, async (req, res) => {
  try {
    const { mobile, password, uniqueKey, fourDigitKey, otp } = req.body;

    // Validate input
    const errors = validateInput(req.body, ['mobile', 'password', 'uniqueKey', 'fourDigitKey', 'otp']);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        errors
      });
    }

    // Verify OTP (dummy OTP: 12345)
    if (otp !== '12345') {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Find user
    const user = await User.findOne({ mobile }).select('+password +uniqueKey +fourDigitKey');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify credentials
    try {
      const decryptedPassword = EncryptionService.decrypt(user.password);
      const decryptedUniqueKey = EncryptionService.decrypt(user.uniqueKey);
      const decryptedFourDigitKey = EncryptionService.decrypt(user.fourDigitKey);

      if (password !== decryptedPassword || 
          uniqueKey !== decryptedUniqueKey || 
          fourDigitKey !== decryptedFourDigitKey) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    } catch (decryptError) {
      return res.status(500).json({
        success: false,
        message: 'Error verifying credentials'
      });
    }

    // Delete user
    await User.findByIdAndDelete(user._id);
    
    console.log(`User deleted: ${mobile}`);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during account deletion'
    });
  }
});

// @route   GET /api/users/health
// @desc    Health check endpoint
// @access  Public
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;