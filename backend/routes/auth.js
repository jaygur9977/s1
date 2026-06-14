const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getProfile } = require('../controllers/authController');

// ==================== VALIDATION RULES ====================

const registerValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Name must be between 3 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('mobileNumber')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^\d{10}$/)
    .withMessage('Please enter a valid 10-digit mobile number'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 8 })
    .withMessage('Password must be exactly 8 characters'),
  
  body('pin')
    .notEmpty()
    .withMessage('PIN is required')
    .matches(/^\d{4}$/)
    .withMessage('PIN must be exactly 4 digits'),
  
  body('securityConsent')
    .notEmpty()
    .withMessage('Security consent is required')
    .isBoolean()
    .withMessage('Security consent must be true or false')
    .custom((value) => {
      if (value !== true) {
        throw new Error('You must accept the security terms and conditions');
      }
      return true;
    })
];

const loginValidation = [
  body('uniqueKey')
    .trim()
    .notEmpty()
    .withMessage('Unique key is required')
    .isLength({ min: 8, max: 8 })
    .withMessage('Invalid unique key format'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('pin')
    .notEmpty()
    .withMessage('PIN is required')
    .matches(/^\d{4}$/)
    .withMessage('PIN must be 4 digits')
];

const profileValidation = [
  body('uniqueKey')
    .trim()
    .notEmpty()
    .withMessage('Unique key is required')
];

// ==================== ROUTES ====================

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, login);

// @route   GET /api/auth/profile/:uniqueKey
// @desc    Get user profile by unique key
// @access  Public
router.get('/profile/:uniqueKey', getProfile);

// @route   GET /api/auth/check-key/:uniqueKey
// @desc    Check if unique key exists
// @access  Public
router.get('/check-key/:uniqueKey', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findOne({ uniqueKey: req.params.uniqueKey });
    
    if (user) {
      return res.json({ exists: true });
    }
    
    res.json({ exists: false });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/check-mobile/:mobileNumber
// @desc    Check if mobile number exists
// @access  Public
router.get('/check-mobile/:mobileNumber', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findOne({ mobileNumber: req.params.mobileNumber });
    
    if (user) {
      return res.json({ exists: true });
    }
    
    res.json({ exists: false });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;