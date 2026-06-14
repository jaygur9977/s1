const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ==================== AUTH MIDDLEWARE ====================

// Verify JWT Token
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No authentication token provided.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by id from token
    const user = await User.findById(decoded.userId).select('-password -pin');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token is valid but user not found. Please login again.' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Account is deactivated. Please contact support.' 
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({ 
        success: false,
        message: 'Account is locked due to multiple failed attempts. Please try again later.' 
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user._id;
    req.uniqueKey = user.uniqueKey;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token. Please login again.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired. Please login again.' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Internal server error during authentication.' 
    });
  }
};

// ==================== OPTIONAL AUTH (For public/private routes) ====================

// Verify token but don't fail if not present
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password -pin');
      
      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    }
    
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

// ==================== ROLE-BASED MIDDLEWARE ====================

// Check if user is admin
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

// ==================== RATE LIMITER (Simple) ====================

// Simple in-memory rate limiter
const rateLimitStore = new Map();

const rateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 5) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, []);
    }
    
    const requests = rateLimitStore.get(ip);
    const windowStart = now - windowMs;
    
    // Remove old requests
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: `Too many requests. Please try again after ${Math.ceil(windowMs / 60000)} minutes.`
      });
    }
    
    recentRequests.push(now);
    rateLimitStore.set(ip, recentRequests);
    
    next();
  };
};

// ==================== TOKEN GENERATOR ====================

// Generate JWT Token
const generateToken = (userId, uniqueKey) => {
  return jwt.sign(
    { 
      userId: userId,
      uniqueKey: uniqueKey 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '7d' // Token expires in 7 days
    }
  );
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { 
      userId: userId,
      type: 'refresh'
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '30d' // Refresh token expires in 30 days
    }
  );
};

// ==================== SANDBOX ACCESS MIDDLEWARE ====================

// Verify user has access to sandbox
const sandboxAccess = (req, res, next) => {
  if (!req.user || !req.user.sandboxCreated) {
    return res.status(403).json({
      success: false,
      message: 'Sandbox not created. Please complete registration first.'
    });
  }
  next();
};

// ==================== LOGGER MIDDLEWARE ====================

// Log API requests
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`📝 ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// ==================== VALIDATION MIDDLEWARE ====================

// Check if unique key belongs to authenticated user
const verifyUniqueKeyOwnership = async (req, res, next) => {
  try {
    const { uniqueKey } = req.params;
    
    if (req.user.uniqueKey !== uniqueKey) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This unique key does not belong to your account.'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying unique key ownership.'
    });
  }
};

// ==================== EXPORT ALL MIDDLEWARE ====================

module.exports = {
  authMiddleware,
  optionalAuth,
  adminMiddleware,
  rateLimiter,
  generateToken,
  generateRefreshToken,
  sandboxAccess,
  requestLogger,
  verifyUniqueKeyOwnership
};