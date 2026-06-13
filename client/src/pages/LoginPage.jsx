import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-5 py-1.5 mb-4 shadow-sm">
            <span className="text-xl">🔑</span>
            <span className="text-sm font-semibold text-blue-700">Welcome Back</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-3">
            Login to Your <span className="text-blue-600">Sandbox</span>
          </h1>
          <p className="text-slate-500 text-base">
            Access your secure environment with just three credentials
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100/80 p-8 md:p-10 relative overflow-hidden">
          
          {/* Decorative Background */}
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-amber-100/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-100/10 rounded-full blur-2xl"></div>

          {/* Login Form */}
          <LoginForm />

          {/* Divider */}
          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm text-slate-400">
                New to Tar-Fence?
              </span>
            </div>
          </div>
          
          {/* Register Link */}
          <div className="text-center mt-6">
            <Link
              to="/register"
              className="inline-flex items-center space-x-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors duration-200 group"
            >
              <span>Create your secure account</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {/* Quick Tips - Skin Accent Styling */}
          <div className="mt-6 bg-amber-50/40 rounded-xl p-4 border border-amber-100/80">
            <h3 className="font-bold text-amber-900 mb-2 flex items-center space-x-2">
              <span>💡</span>
              <span>Login Tips</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-650">
              <li className="flex items-start space-x-2">
                <span className="text-amber-600">•</span>
                <span>Use the unique key generated during registration</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-600">•</span>
                <span>No email or phone verification needed</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-600">•</span>
                <span>Login from any device, anywhere in the world</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Security Info Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {[
            { icon: '🌍', title: 'Access Anywhere', desc: 'Login from any device' },
            { icon: '🔒', title: 'Z+ Encrypted', desc: 'Your data is always secure' },
            { icon: '⚡', title: 'Instant Access', desc: 'No waiting, no verification' },
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
    </div>
  );
};

export default LoginPage;