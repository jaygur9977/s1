const CryptoJS = require('crypto-js');

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'default-secret-key';

class EncryptionService {
  // Encrypt data
  static encrypt(data) {
    try {
      if (typeof data === 'object') {
        data = JSON.stringify(data);
      }
      return CryptoJS.AES.encrypt(data, ENCRYPTION_SECRET).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  // Decrypt data
  static decrypt(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_SECRET);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      // Try to parse as JSON, if fails return as string
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }

  // Generate unique key (8 chars: char + number + special)
  static generateUniqueKey() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specials = '!@#$%^&*';
    
    const allChars = uppercase + lowercase + numbers + specials;
    let key = '';
    
    // Ensure at least one of each type
    key += uppercase[Math.floor(Math.random() * uppercase.length)];
    key += lowercase[Math.floor(Math.random() * lowercase.length)];
    key += numbers[Math.floor(Math.random() * numbers.length)];
    key += specials[Math.floor(Math.random() * specials.length)];
    
    // Fill remaining with random chars
    for (let i = 0; i < 4; i++) {
      key += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the key
    return key.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Generate 4-digit key
  static generateFourDigitKey() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Verify if key format is valid
  static isValidUniqueKey(key) {
    if (!key || key.length !== 8) return false;
    const hasUpper = /[A-Z]/.test(key);
    const hasLower = /[a-z]/.test(key);
    const hasNumber = /[0-9]/.test(key);
    const hasSpecial = /[!@#$%^&*]/.test(key);
    return hasUpper && hasLower && hasNumber && hasSpecial;
  }
}

module.exports = EncryptionService;