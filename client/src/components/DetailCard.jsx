import React from 'react';
import { motion } from 'framer-motion';

const DetailCard = ({ title, icon, children }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="glass-morphism rounded-2xl p-6 card-hover"
    >
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-4 text-gray-800">{title}</h3>
      <div className="space-y-2 text-gray-600">
        {children}
      </div>
    </motion.div>
  );
};

export default DetailCard;