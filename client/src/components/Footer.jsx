import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="relative mt-auto border-t border-white/[0.05]"
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          
          {/* Copyright */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-white/30">©</span>
            <span className="text-white/50 font-medium">{currentYear} JAY</span>
            <span className="text-white/20">·</span>
            <span className="text-white/30">All rights reserved</span>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6">
            {[
              { to: "/login", label: "Login" },
              { to: "/register", label: "Register" },
              { to: "/delete", label: "Delete" }
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-white/30 hover:text-white/60 text-sm transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Premium Badge */}
          <div className="premium-badge px-3 py-1.5 rounded-full text-xs font-medium">
            Premium
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;