import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';

const RegisterForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    uniqueKey: '',
    password: '',
    pin: '',
  });
  const [securityConsent, setSecurityConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Generate unique key
  const generateUniqueKey = () => {
    setIsGenerating(true);
    
    // Animation delay to show generation effect
    setTimeout(() => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let key = '';
      for (let i = 0; i < 8; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      setFormData({ ...formData, uniqueKey: key });
      setIsGenerating(false);
      
      // Clear error for unique key
      setErrors({ ...errors, uniqueKey: '' });
    }, 800);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Enter valid 10-digit mobile number';
    }

    if (!formData.uniqueKey) {
      newErrors.uniqueKey = 'Please generate unique key';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be 8 characters';
    }

    if (!formData.pin) {
      newErrors.pin = 'PIN is required';
    } else if (!/^\d{4}$/.test(formData.pin)) {
      newErrors.pin = 'PIN must be 4 digits';
    }

    if (!securityConsent) {
      newErrors.securityConsent = 'You must accept the security terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Call success callback with form data
      onSuccess && onSuccess(formData);
      navigate('/dashboard');
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
    return (
      formData.fullName.trim() &&
      formData.mobileNumber.trim() &&
      formData.uniqueKey &&
      formData.password &&
      formData.pin &&
      securityConsent
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Full Name */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            👤
          </span>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
            className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              errors.fullName
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 focus:ring-violet-500 focus:border-violet-500'
            }`}
          />
          {formData.fullName && !errors.fullName && (
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">
              ✓
            </span>
          )}
        </div>
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-500 flex items-center space-x-1">
            <span>⚠️</span>
            <span>{errors.fullName}</span>
          </p>
        )}
      </div>

      {/* Mobile Number */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Mobile Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            📱
          </span>
          <input
            type="tel"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleChange}
            placeholder="Enter 10-digit mobile number"
            maxLength="10"
            className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              errors.mobileNumber
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 focus:ring-violet-500 focus:border-violet-500'
            }`}
          />
          {formData.mobileNumber && !errors.mobileNumber && (
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">
              ✓
            </span>
          )}
        </div>
        {errors.mobileNumber && (
          <p className="mt-1 text-sm text-red-500 flex items-center space-x-1">
            <span>⚠️</span>
            <span>{errors.mobileNumber}</span>
          </p>
        )}
      </div>

      {/* Unique Key */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Unique Key (Auto-Generated) <span className="text-red-500">*</span>
        </label>
        <div className="flex space-x-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔑
            </span>
            <input
              type="text"
              name="uniqueKey"
              value={formData.uniqueKey}
              readOnly
              placeholder="Click generate to create unique key"
              className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-gray-50 transition-all duration-300 focus:outline-none ${
                errors.uniqueKey
                  ? 'border-red-300'
                  : formData.uniqueKey
                  ? 'border-green-300'
                  : 'border-gray-200'
              } ${isGenerating ? 'animate-pulse' : ''}`}
            />
            {formData.uniqueKey && !errors.uniqueKey && (
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">
                ✓
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={generateUniqueKey}
            disabled={isGenerating}
            className="px-6 py-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Generate</span>
              </>
            )}
          </button>
        </div>
        {errors.uniqueKey && (
          <p className="mt-1 text-sm text-red-500 flex items-center space-x-1">
            <span>⚠️</span>
            <span>{errors.uniqueKey}</span>
          </p>
        )}
        {formData.uniqueKey && (
          <p className="mt-2 text-xs text-violet-600 flex items-center space-x-1">
            <span>🔒</span>
            <span>Save this key securely - it cannot be recovered!</span>
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Password (8-digit) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔒
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create 8-digit password"
            maxLength="8"
            className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              errors.password
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 focus:ring-violet-500 focus:border-violet-500'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
          Security PIN (4-digit) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔢
          </span>
          <input
            type="password"
            name="pin"
            value={formData.pin}
            onChange={handleChange}
            placeholder="Set 4-digit PIN"
            maxLength="4"
            className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              errors.pin
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 focus:ring-violet-500 focus:border-violet-500'
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

      {/* Security Consent */}
      <div className="bg-gradient-to-r from-violet-50 to-blue-50 rounded-2xl p-4 border border-violet-200">
        <label className="flex items-start space-x-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={securityConsent}
            onChange={(e) => {
              setSecurityConsent(e.target.checked);
              if (errors.securityConsent) {
                setErrors({ ...errors, securityConsent: '' });
              }
            }}
            className="mt-1 w-5 h-5 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
          />
          <div className="flex-1">
            <span className="text-sm text-gray-700 group-hover:text-violet-700 transition-colors">
              I understand that my data will be protected with <span className="font-bold text-violet-600">Z+ End-to-End Encryption</span>. 
              I agree to the terms and conditions of Tar-Fence security protocol. 
              <span className="text-red-500"> *</span>
            </span>
            {errors.securityConsent && (
              <p className="mt-1 text-sm text-red-500 flex items-center space-x-1">
                <span>⚠️</span>
                <span>{errors.securityConsent}</span>
              </p>
            )}
          </div>
        </label>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant={isFormValid() ? 'primary' : 'secondary'}
        size="lg"
        disabled={!isFormValid()}
        className={`w-full ${
          !isFormValid()
            ? 'opacity-40 cursor-not-allowed bg-gray-300 text-gray-500'
            : 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-xl hover:shadow-2xl hover:shadow-violet-500/50'
        }`}
        icon="🚀"
      >
        {isFormValid() ? 'Create Secure Account' : 'Complete All Fields to Register'}
      </Button>

      {/* Security Note */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <p>🔐 Your data is encrypted with Z+ security protocol</p>
        <p>🛡️ No one, including Tar-Fence, can access your information</p>
      </div>
    </form>
  );
};

export default RegisterForm;