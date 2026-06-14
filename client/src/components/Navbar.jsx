import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = () => {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="glass-morphism sticky top-0 z-50 backdrop-blur-lg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0"
          >
            <Link to="/" className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-green-300 bg-clip-text text-transparent">
              T<span role="img" aria-label="smile">😊</span>r-Fance
            </Link>
          </motion.div>
          
          <div className="flex space-x-6">
            {[
              { to: "/login", label: "Login" },
              { to: "/register", label: "Register" },
              { to: "/delete", label: "Delete Account" }
            ].map((item, index) => (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ scale: 1.1 }}
              >
                <Link
                  to={item.to}
                  className="relative px-4 py-2 text-gray-700 font-semibold hover:text-pink-500 transition-colors duration-300 group"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-400 to-purple-400 group-hover:w-full transition-all duration-300" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;