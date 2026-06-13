import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = 2026;

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-white tracking-tight">
                Tar-Fence<span className="text-violet-500">⚡</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your digital fortress. Create personalized sandboxes with military-grade Z+ encryption. Complete privacy, zero compromises.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {['Home', 'Features', 'How It Works', 'Security Protocol', 'Register', 'Login'].map((item) => (
                <li key={item}>
                  <Link
                    to={item === 'Home' ? '/' : `/${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Security Features */}
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Security
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              {[
                'End-to-End Encryption',
                'Z+ Security Protocol',
                'Zero-Knowledge Architecture',
                'Auto-Generated Keys',
                'No Data Collection',
                'Browser Isolation'
              ].map((item) => (
                <li key={item} className="flex items-center">
                  <span className="text-emerald-500 mr-2 text-xs">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Creator Info */}
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              About
            </h3>
            <div className="space-y-4 text-sm">
              <p>
                Built with passion for digital privacy and security.
              </p>
              <div className="text-xs text-slate-500 space-y-1">
                <p>© {currentYear} Tar-Fence. All rights reserved.</p>
                <p>Created by <span className="text-slate-300 font-medium">JAY</span> since 2026</p>
                <p>Privacy First • Security Always</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;