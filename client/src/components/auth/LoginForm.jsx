import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    uniqueKey: '',
    password: '',
    pin: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.uniqueKey.trim()) {
      newErrors.uniqueKey = 'Unique key is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (!formData.pin) {
      newErrors.pin = 'PIN is required';
    } else if (!/^\d{4}$/.test(formData.pin)) {
      newErrors.pin = 'PIN must be 4 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        navigate('/dashboard');
      }, 1500);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for specific field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const isFormValid = () => {
    return formData.uniqueKey.trim() && formData.password && formData.pin;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Brand Icon */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-500 to-blue-500 rounded-2xl shadow-xl mb-4">
          <span className="text-4xl">🔐</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Welcome Back!</h2>
        <p className="text-gray-500">Login to access your secure sandbox</p>
      </div>

      {/* Unique Key */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Unique Key <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-violet-500 transition-colors">
            🔑
          </span>
          <input
            type="text"
            name="uniqueKey"
            value={formData.uniqueKey}
            onChange={handleChange}
            placeholder="Enter your unique key"
            className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              errors.uniqueKey
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 focus:ring-violet-500 focus:border-violet-500 hover:border-violet-300'
            }`}
          />
          {formData.uniqueKey && !errors.uniqueKey && (
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">
              ✓
            </span>
          )}
        </div>
        {errors.uniqueKey && (
          <p className="mt-1 text-sm text-red-500 flex items-center space-x-1">
            <span>⚠️</span>
            <span>{errors.uniqueKey}</span>
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-violet-500 transition-colors">
            🔒
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              errors.password
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 focus:ring-violet-500 focus:border-violet-500 hover:border-violet-300'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-500 flex items-center space-x-1">
            <span>⚠️</span>
            <span>{errors.password}</span>
          </p>
        )}
      </div>

      {/* PIN */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Security PIN <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-violet-500 transition-colors">
            🔢
          </span>
          <input
            type="password"
            name="pin"
            value={formData.pin}
            onChange={handleChange}
            placeholder="Enter 4-digit PIN"
            maxLength="4"
            className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              errors.pin
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 focus:ring-violet-500 focus:border-violet-500 hover:border-violet-300'
            }`}
          />
          {formData.pin && !errors.pin && (
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">
              ✓
            </span>
          )}
        </div>
        {errors.pin && (
          <p className="mt-1 text-sm text-red-500 flex items-center space-x-1">
            <span>⚠️</span>
            <span>{errors.pin}</span>
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={!isFormValid() || isLoading}
        loading={isLoading}
        className={`w-full ${
          !isFormValid()
            ? 'opacity-40 cursor-not-allowed bg-gray-300 text-gray-500'
            : 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-xl hover:shadow-2xl hover:shadow-violet-500/50'
        }`}
        icon="🚀"
      >
        {isLoading ? 'Logging in...' : 'Login to Sandbox'}
      </Button>

      {/* Additional Info */}
      <div className="text-center space-y-4 pt-4">
        <p className="text-sm text-gray-500">
          <span className="text-violet-600 font-semibold">🔐 Secure Login:</span> Only Unique Key, Password & PIN required
        </p>
        <p className="text-xs text-gray-400">
          No email • No phone verification • Access from anywhere
        </p>
      </div>

      {/* Loading Animation */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">
            <div className="animate-spin text-6xl mb-4">⚡</div>
            <p className="text-lg font-bold text-gray-800">Accessing Your Sandbox...</p>
            <p className="text-sm text-gray-500 mt-2">Verifying credentials securely</p>
          </div>
        </div>
      )}
    </form>
  );
};

export default LoginForm;