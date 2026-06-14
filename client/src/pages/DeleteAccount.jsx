import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { deleteAccount } from '../services/api';

const DeleteAccount = () => {
  const [formData, setFormData] = useState({
    mobile: '',
    password: '',
    uniqueKey: '',
    fourDigitKey: '',
    otp: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    toast.promise(
      deleteAccount(formData),
      {
        loading: 'Verifying and deleting account...',
        success: 'Account deleted successfully!',
        error: 'Verification failed. Please check all details.',
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <Toaster position="top-center" />
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="glass-morphism rounded-3xl p-8 max-w-md w-full card-hover border-2 border-red-200"
      >
        <motion.h2 
          animate={{ scale: [1, 1.02, 1] }}
          className="text-3xl font-bold text-center mb-8 text-red-500"
        >
          Delete Account
        </motion.h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-gray-700 font-semibold mb-2">Registered Mobile Number</label>
            <input
              type="tel"
              required
              className="input-premium w-full px-4 py-3 rounded-xl"
              value={formData.mobile}
              onChange={(e) => setFormData({...formData, mobile: e.target.value})}
            />
          </motion.div>

          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-gray-700 font-semibold mb-2">Password</label>
            <input
              type="password"
              required
              className="input-premium w-full px-4 py-3 rounded-xl"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </motion.div>

          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-gray-700 font-semibold mb-2">Unique Key</label>
            <input
              type="text"
              required
              className="input-premium w-full px-4 py-3 rounded-xl"
              value={formData.uniqueKey}
              onChange={(e) => setFormData({...formData, uniqueKey: e.target.value})}
            />
          </motion.div>

          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-gray-700 font-semibold mb-2">4-Digit Key</label>
            <input
              type="text"
              required
              maxLength="4"
              className="input-premium w-full px-4 py-3 rounded-xl"
              value={formData.fourDigitKey}
              onChange={(e) => setFormData({...formData, fourDigitKey: e.target.value})}
            />
          </motion.div>

          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block text-gray-700 font-semibold mb-2">OTP (Dummy: 12345)</label>
            <input
              type="text"
              required
              className="input-premium w-full px-4 py-3 rounded-xl"
              value={formData.otp}
              onChange={(e) => setFormData({...formData, otp: e.target.value})}
            />
          </motion.div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-gradient-to-r from-red-400 to-pink-400 text-white font-bold py-4 rounded-xl text-lg"
          >
            Delete My Account
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default DeleteAccount;