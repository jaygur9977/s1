import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';
import CongratulationsModal from '../components/auth/CongratulationsModal';

const RegisterPage = () => {
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleRegistrationSuccess = (data) => {
    setUserData(data);
    setShowCongratulations(true);
  };

  const handleCloseModal = () => {
    setShowCongratulations(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-5 py-1.5 mb-4 shadow-sm">
            <span className="text-xl">🚀</span>
            <span className="text-sm font-semibold text-blue-700">Get Started</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-3">
            Create Your <span className="text-blue-600">Secure Account</span>
          </h1>
          <p className="text-slate-505 text-base">
            Set up your personal sandbox in less than 2 minutes
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100/80 p-8 md:p-10 relative overflow-hidden">
          
          {/* Decorative Background */}
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-100/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-100/10 rounded-full blur-2xl"></div>

          {/* Security Badge */}
          <div className="relative flex items-center justify-center space-x-2 mb-8">
            <div className="px-4 py-2 bg-blue-50/50 rounded-full border border-blue-100 flex items-center space-x-2">
              <span className="text-emerald-500">🔒</span>
              <span className="text-xs font-semibold text-blue-700">Z+ End-to-End Encrypted Registration</span>
            </div>
          </div>

          {/* Registration Form */}
          <RegisterForm onSuccess={handleRegistrationSuccess} />

          {/* Login Link */}
          <div className="relative mt-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm text-slate-400">
                Already have an account?
              </span>
            </div>
          </div>
          
          <div className="text-center mt-4">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors duration-200"
            >
              <span>Login to your sandbox</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Security Features */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {[
            { icon: '🔐', title: 'Z+ Encrypted', desc: 'Military-grade security' },
            { icon: '⚡', title: 'Instant Setup', desc: 'Ready in seconds' },
            { icon: '🛡️', title: 'Zero Knowledge', desc: 'We can\'t access your data' },
          ].map((feature, index) => (
            <div key={index} className="bg-white/80 border border-slate-100/60 backdrop-blur-sm rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-all duration-300">
              <span className="text-2xl mb-2 block">{feature.icon}</span>
              <h3 className="font-bold text-slate-800 text-sm">{feature.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Creator Credit */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-450">
            Created by <span className="font-bold text-slate-600">JAY</span> © 2026
          </p>
        </div>
      </div>

      {/* Congratulations Modal */}
      {showCongratulations && (
        <CongratulationsModal 
          userData={userData} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default RegisterPage;