import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import DetailCard from '../components/DetailCard';

const Congratulations = () => {
  const location = useLocation();
  const userData = location.state;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="max-w-4xl w-full"
      >
        <motion.div
          animate={{ 
            boxShadow: ['0 0 20px #FFB6C1', '0 0 40px #E6E6FA', '0 0 20px #98FB98', '0 0 20px #FFB6C1']
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="glass-morphism rounded-3xl p-8 text-center mb-8"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            🎉
          </motion.div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
            Congratulations!
          </h1>
          <p className="text-gray-600 text-lg">Your account has been created successfully</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <DetailCard title="Personal Info" icon="👤">
            <p><strong>Name:</strong> {userData.name}</p>
            <p><strong>Mobile:</strong> {userData.mobile}</p>
          </DetailCard>
          
          <DetailCard title="Security Keys" icon="🔐">
            <p><strong>Unique Key:</strong> {userData.uniqueKey}</p>
            <p><strong>4-Digit Key:</strong> {userData.fourDigitKey}</p>
          </DetailCard>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-red-50 border-l-4 border-red-400 p-6 rounded-xl mb-8"
        >
          <h3 className="text-red-800 font-bold text-lg mb-2">⚠️ CRITICAL: Save These 3 Items!</h3>
          <p className="text-red-700">
            You <strong>MUST</strong> save these 3 important items to login and delete your account:
          </p>
          <ul className="list-disc list-inside mt-2 text-red-600">
            <li>Password</li>
            <li>Unique Key (8-digit)</li>
            <li>4-Digit Key</li>
          </ul>
          <p className="text-red-500 mt-2 text-sm">
            These cannot be recovered if lost. Store them securely!
          </p>
        </motion.div>

        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.print()}
            className="btn-premium text-white font-bold py-4 px-8 rounded-xl text-lg"
          >
            Save / Print Details
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Congratulations;