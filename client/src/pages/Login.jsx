import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { loginUser } from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({
    mobile: '',
    password: '',
    uniqueKey: '',
    fourDigitKey: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const loadingToast = toast.loading('Verifying credentials...');
    
    try {
      const userData = await loginUser(formData);
      toast.dismiss(loadingToast);
      toast.success('Login successful!');
      navigate('/congratulations', { state: userData });
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Invalid credentials. Please check your keys and password.');
    }
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
        className="glass-morphism rounded-3xl p-8 max-w-md w-full card-hover"
      >
        <motion.h2 
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent"
        >
          Welcome Back
        </motion.h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-gray-700 font-semibold mb-2">Mobile Number</label>
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
            <label className="block text-gray-700 font-semibold mb-2">Unique Key (8-digit)</label>
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

          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-premium w-full text-white font-bold py-4 rounded-xl text-lg"
          >
            Sign In
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Login;