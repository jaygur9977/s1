import axios from 'axios';
import CryptoJS from 'crypto-js';

const API_BASE = 'YOUR_MONGODB_ATLAS_API_ENDPOINT';
const ENCRYPTION_KEY = 'your-secret-encryption-key';

const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
};

const decryptData = (encryptedData) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

const generateUniqueKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const specials = '!@#$%^&*';
  let key = '';
  key += chars[Math.floor(Math.random() * chars.length)];
  key += chars[Math.floor(Math.random() * chars.length)];
  key += specials[Math.floor(Math.random() * specials.length)];
  key += Math.floor(Math.random() * 10);
  key += chars[Math.floor(Math.random() * chars.length)];
  key += specials[Math.floor(Math.random() * specials.length)];
  key += Math.floor(Math.random() * 10);
  key += chars[Math.floor(Math.random() * chars.length)];
  return key;
};

const generateFourDigitKey = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const registerUser = async (userData) => {
  const uniqueKey = generateUniqueKey();
  const fourDigitKey = generateFourDigitKey();
  
  const encryptedData = {
    name: userData.name,
    mobile: userData.mobile,
    password: encryptData(userData.password),
    uniqueKey: encryptData(uniqueKey),
    fourDigitKey: encryptData(fourDigitKey),
    createdAt: new Date().toISOString()
  };
  
  // Store encrypted data to MongoDB Atlas
  const response = await axios.post(`${API_BASE}/users`, encryptedData);
  
  // Return unencrypted keys to show user
  return {
    ...response.data,
    uniqueKey,
    fourDigitKey
  };
};

export const loginUser = async (credentials) => {
  const response = await axios.get(`${API_BASE}/users`, {
    params: { mobile: credentials.mobile }
  });
  
  const user = response.data[0];
  if (user) {
    const decryptedPassword = decryptData(user.password);
    const decryptedUniqueKey = decryptData(user.uniqueKey);
    const decryptedFourDigitKey = decryptData(user.fourDigitKey);
    
    if (decryptedPassword === credentials.password && 
        decryptedUniqueKey === credentials.uniqueKey && 
        decryptedFourDigitKey === credentials.fourDigitKey) {
      return { ...user, decryptedData: { uniqueKey: decryptedUniqueKey, fourDigitKey: decryptedFourDigitKey } };
    }
  }
  throw new Error('Invalid credentials');
};

export const deleteAccount = async (deleteData) => {
  const response = await axios.get(`${API_BASE}/users`, {
    params: { mobile: deleteData.mobile }
  });
  
  const user = response.data[0];
  if (user) {
    // Verify OTP with dummy service 12345
    if (deleteData.otp === '12345') {
      const decryptedPassword = decryptData(user.password);
      const decryptedUniqueKey = decryptData(user.uniqueKey);
      const decryptedFourDigitKey = decryptData(user.fourDigitKey);
      
      if (decryptedPassword === deleteData.password && 
          decryptedUniqueKey === deleteData.uniqueKey && 
          decryptedFourDigitKey === deleteData.fourDigitKey) {
        await axios.delete(`${API_BASE}/users/${user._id}`);
        return { success: true };
      }
    }
  }
  throw new Error('Verification failed');
};