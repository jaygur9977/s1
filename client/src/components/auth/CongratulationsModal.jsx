import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CongratulationsModal = ({ userData, onClose }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 100);
    
    // Generate confetti particles
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: Math.random() * 3 + 2,
      animationDelay: Math.random() * 2,
      emoji: ['🎉', '✨', '🎊', '🌟', '💎', '🔐', '🛡️', '⚡'][Math.floor(Math.random() * 8)],
    }));
    setParticles(newParticles);

    // Show details after animation
    setTimeout(() => setShowDetails(true), 1500);
  }, []);

  const handleContinue = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose && onClose();
      navigate('/dashboard');
    }, 500);
  };

  // Mask sensitive data
  const maskData = (data) => {
    if (!data) return '';
    return data.slice(0, 2) + '••••' + data.slice(-2);
  };

  return (
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      
      {/* Confetti Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute text-2xl animate-confetti pointer-events-none"
          style={{
            left: `${particle.left}%`,
            animationDuration: `${particle.animationDuration}s`,
            animationDelay: `${particle.animationDelay}s`,
          }}
        >
          {particle.emoji}
        </div>
      ))}

      {/* Modal Card */}
      <div className={`relative bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all duration-700 ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-0 translate-y-20'
      }`}>
        
        {/* Top Decoration */}
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
          <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
            <span className="text-5xl">🏆</span>
          </div>
        </div>

        {/* Success Icon */}
        <div className="text-center mt-8 mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Congratulations Text */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Congratulations! 🎉
          </h2>
          <p className="text-gray-600 text-lg">
            Your secure sandbox has been created successfully
          </p>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <span className="text-sm text-green-600 font-semibold">✓ Account Created</span>
            <span className="text-sm text-green-600 font-semibold">✓ Sandbox Ready</span>
            <span className="text-sm text-green-600 font-semibold">✓ Z+ Encrypted</span>
          </div>
        </div>

        {/* User Details Card */}
        <div className={`bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl p-6 border border-violet-200 transform transition-all duration-500 ${
          showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span>🔐</span>
            <span>Your Secure Credentials</span>
          </h3>
          
          <div className="space-y-3">
            {/* Full Name */}
            <div className="flex items-center justify-between bg-white/80 rounded-xl p-3">
              <span className="text-gray-600 flex items-center space-x-2">
                <span>👤</span>
                <span>Name:</span>
              </span>
              <span className="font-semibold text-gray-800">
                {userData?.fullName || 'User'}
              </span>
            </div>

            {/* Mobile */}
            <div className="flex items-center justify-between bg-white/80 rounded-xl p-3">
              <span className="text-gray-600 flex items-center space-x-2">
                <span>📱</span>
                <span>Mobile:</span>
              </span>
              <span className="font-semibold text-gray-800">
                {maskData(userData?.mobileNumber)}
              </span>
            </div>

            {/* Unique Key */}
            <div className="flex items-center justify-between bg-white/80 rounded-xl p-3">
              <span className="text-gray-600 flex items-center space-x-2">
                <span>🔑</span>
                <span>Unique Key:</span>
              </span>
              <span className="font-mono font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-lg">
                {userData?.uniqueKey || '••••••••'}
              </span>
            </div>

            {/* Password */}
            <div className="flex items-center justify-between bg-white/80 rounded-xl p-3">
              <span className="text-gray-600 flex items-center space-x-2">
                <span>🔒</span>
                <span>Password:</span>
              </span>
              <span className="font-mono font-bold text-gray-800">
                {maskData(userData?.password)}
              </span>
            </div>

            {/* PIN */}
            <div className="flex items-center justify-between bg-white/80 rounded-xl p-3">
              <span className="text-gray-600 flex items-center space-x-2">
                <span>🔢</span>
                <span>PIN:</span>
              </span>
              <span className="font-mono font-bold text-gray-800">
                ••••
              </span>
            </div>
          </div>

          {/* Security Warning */}
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start space-x-2">
            <span className="text-yellow-600 text-xl">⚠️</span>
            <div>
              <p className="text-sm font-bold text-yellow-800">Important Security Notice</p>
              <p className="text-xs text-yellow-700">
                Save these credentials securely. They cannot be recovered if lost. 
                Your data is protected with Z+ encryption.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleContinue}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:shadow-violet-500/50 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <span>Access Your Sandbox</span>
            <span>🚀</span>
          </button>
          
          <button
            onClick={() => {
              // Download credentials as text
              const credentials = `
Tar-Fence Credentials
━━━━━━━━━━━━━━━━━━
Name: ${userData?.fullName}
Mobile: ${userData?.mobileNumber}
Unique Key: ${userData?.uniqueKey}
Password: ${userData?.password}
PIN: ${userData?.pin}
━━━━━━━━━━━━━━━━━━
⚠️ Keep this information secure!
              `.trim();
              
              const blob = new Blob([credentials], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'tar-fence-credentials.txt';
              a.click();
            }}
            className="w-full py-3 border-2 border-violet-300 text-violet-700 font-semibold rounded-xl hover:bg-violet-50 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <span>💾</span>
            <span>Download Credentials</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear infinite;
        }
      `}</style>
    </div>
  );
};

export default CongratulationsModal;