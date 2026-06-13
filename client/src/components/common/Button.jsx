import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon = null
}) => {
  
  const baseStyles = 'font-bold rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center space-x-2';
  
  const variants = {
    primary: 'bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 text-white shadow-lg hover:shadow-2xl hover:shadow-violet-500/50 focus:ring-violet-500',
    secondary: 'bg-white text-violet-600 border-2 border-violet-300 hover:border-violet-500 hover:shadow-lg focus:ring-violet-500',
    outline: 'bg-transparent text-gray-700 border-2 border-gray-300 hover:border-violet-400 hover:text-violet-600 focus:ring-violet-500',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-2xl hover:shadow-red-500/50 focus:ring-red-500',
    success: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg hover:shadow-2xl hover:shadow-emerald-500/50 focus:ring-emerald-500',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed transform-none hover:shadow-none hover:-translate-y-0';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${(disabled || loading) ? disabledStyles : 'hover:scale-105'}
        ${className}
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="text-xl">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;