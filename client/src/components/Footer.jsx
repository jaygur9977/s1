import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="glass-morphism mt-auto"
    >
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="flex justify-between items-center">
          <motion.p 
            whileHover={{ scale: 1.05 }}
            className="text-gray-600 font-semibold"
          >
            © 2026 JAY. All rights reserved.
          </motion.p>
          <motion.div 
            animate={{ 
              background: ['#FFB6C1', '#E6E6FA', '#98FB98', '#FFB6C1'],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="px-4 py-2 rounded-full"
          >
            <span className="text-white font-bold">Premium ✨</span>
          </motion.div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
