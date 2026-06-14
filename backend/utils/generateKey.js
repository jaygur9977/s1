// ==================== UNIQUE KEY GENERATOR ====================

/**
 * Generates a cryptographically secure random key
 * Format: 8 characters with uppercase, lowercase, numbers, and special characters
 * 
 * @returns {string} 8-character unique key
 */

// Method 1: Using crypto (More secure - recommended for production)
const generateUniqueKey = () => {
  const crypto = require('crypto');
  
  const length = 8;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least one of each type
  let key = '';
  
  // Add one uppercase
  key += uppercase[crypto.randomInt(0, uppercase.length)];
  
  // Add one lowercase
  key += lowercase[crypto.randomInt(0, lowercase.length)];
  
  // Add one number
  key += numbers[crypto.randomInt(0, numbers.length)];
  
  // Add one special character
  key += special[crypto.randomInt(0, special.length)];
  
  // Fill remaining with truly random characters
  for (let i = 4; i < length; i++) {
    const randomBytes = crypto.randomBytes(1);
    const randomIndex = randomBytes[0] % allChars.length;
    key += allChars[randomIndex];
  }
  
  // Fisher-Yates shuffle for randomness
  const shuffleArray = (str) => {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  };
  
  return shuffleArray(key);
};

// Method 2: Simple version (Less secure, but works)
const generateSimpleKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let key = '';
  
  for (let i = 0; i < 8; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return key;
};

// Method 3: Key with specific format (e.g., Ab1#Xy2$)
const generateFormattedKey = () => {
  const patterns = [
    () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)], // Uppercase
    () => 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)], // Lowercase
    () => '0123456789'[Math.floor(Math.random() * 10)],                  // Number
    () => '!@#$%^&*'[Math.floor(Math.random() * 8)],                     // Special
    () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'[Math.floor(Math.random() * 70)], // Any
    () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'[Math.floor(Math.random() * 70)], // Any
    () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'[Math.floor(Math.random() * 70)], // Any
    () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'[Math.floor(Math.random() * 70)], // Any
  ];
  
  // Shuffle patterns
  const shuffled = patterns.sort(() => Math.random() - 0.5);
  
  // Generate key
  return shuffled.map(fn => fn()).join('');
};

// ==================== KEY VALIDATOR ====================

/**
 * Validates if a key meets the requirements
 * 
 * @param {string} key - The key to validate
 * @returns {boolean} Whether the key is valid
 */
const validateKey = (key) => {
  if (!key || key.length !== 8) {
    return false;
  }
  
  const hasUppercase = /[A-Z]/.test(key);
  const hasLowercase = /[a-z]/.test(key);
  const hasNumber = /[0-9]/.test(key);
  const hasSpecial = /[!@#$%^&*]/.test(key);
  
  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
};

// ==================== KEY GENERATOR WITH OPTIONS ====================

/**
 * Generates a key with custom options
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.length - Length of key (default: 8)
 * @param {boolean} options.uppercase - Include uppercase (default: true)
 * @param {boolean} options.lowercase - Include lowercase (default: true)
 * @param {boolean} options.numbers - Include numbers (default: true)
 * @param {boolean} options.special - Include special chars (default: true)
 * @returns {string} Generated key
 */
const generateCustomKey = (options = {}) => {
  const {
    length = 8,
    uppercase = true,
    lowercase = true,
    numbers = true,
    special = true
  } = options;

  let chars = '';
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) chars += '0123456789';
  if (special) chars += '!@#$%^&*';

  if (!chars) {
    throw new Error('At least one character set must be enabled');
  }

  const crypto = require('crypto');
  let key = '';

  for (let i = 0; i < length; i++) {
    const randomBytes = crypto.randomBytes(1);
    const randomIndex = randomBytes[0] % chars.length;
    key += chars[randomIndex];
  }

  return key;
};

// ==================== EXPORT ====================

module.exports = generateUniqueKey;
module.exports.generateSimpleKey = generateSimpleKey;
module.exports.generateFormattedKey = generateFormattedKey;
module.exports.validateKey = validateKey;
module.exports.generateCustomKey = generateCustomKey;