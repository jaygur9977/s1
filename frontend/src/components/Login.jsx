import React, { useState } from 'react';
import Chest from './Chest';
import './Auth.css';

const Login = ({ onLogin }) => {
    const [form, setForm] = useState({ uniqueKey: '', password: '', pin: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [browserLoading, setBrowserLoading] = useState(false);
    const [browserMessage, setBrowserMessage] = useState('');
    const [showChest, setShowChest] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!form.uniqueKey || !form.password || !form.pin) {
            setError('All fields are required');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();

            if (data.success) {
                setUser(data.user);
                if (data.user.profilePhoto) {
                    setProfilePhoto(data.user.profilePhoto);
                }
                if (onLogin) onLogin(data.user);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Connection failed. Please check server.');
        }
        setLoading(false);
    };

    const launchBrowser = async () => {
        setBrowserLoading(true);
        setBrowserMessage('');
        try {
            const res = await fetch('http://localhost:5000/api/launch-browser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uniqueKey: user.uniqueKey })
            });
            const data = await res.json();
            if (data.success) {
                setBrowserMessage('Browser launched successfully! 🚀');
            } else {
                setBrowserMessage('Failed to launch browser');
            }
        } catch (err) {
            setBrowserMessage('Browser launch failed. Is Chrome installed?');
        }
        setBrowserLoading(false);
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size should be less than 5MB');
            return;
        }

        setPhotoUploading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const res = await fetch('http://localhost:5000/api/upload-photo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uniqueKey: user.uniqueKey,
                        photo: event.target.result
                    })
                });
                const data = await res.json();
                if (data.success) {
                    setProfilePhoto(event.target.result);
                }
            } catch (err) {
                setError('Failed to upload photo');
            }
            setPhotoUploading(false);
        };
        reader.readAsDataURL(file);
    };

    // ============================================================
    // CONGRATULATIONS VIEW (After successful login)
    // ============================================================
    if (user) {
        return (
            <>
                <div className="auth-container">
                    <div className="congrats-card">
                        {/* Animated border glow */}
                        <div className="congrats-glow"></div>

                        {/* Header Section */}
                        <div className="congrats-header">
                            <div className="avatar-section">
                                <div className="avatar-circle">
                                    {profilePhoto ? (
                                        <img src={profilePhoto} alt="Profile" className="avatar-image" />
                                    ) : (
                                        <span className="avatar-initials">
                                            {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </span>
                                    )}
                                </div>
                                <label className="photo-upload-label" title="Upload profile photo">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        style={{ display: 'none' }}
                                        disabled={photoUploading}
                                    />
                                    <span className="camera-icon">
                                        {photoUploading ? '⏳' : '📷'}
                                    </span>
                                </label>
                            </div>
                            
                            <h1 className="congrats-title">
                                Welcome, {user.fullName}!
                            </h1>
                            <p className="congrats-subtitle">Your account is ready and secure</p>
                            
                            {/* Status Badge */}
                            <div className="status-badge">
                                <span className="status-dot"></span>
                                Active Account
                            </div>
                        </div>

                        {/* User Details Grid */}
                        <div className="info-grid">
                            <div className="info-item">
                                <div className="info-icon-wrapper">
                                    <span>👤</span>
                                </div>
                                <div className="info-content">
                                    <span className="info-label">Full Name</span>
                                    <span className="info-value">{user.fullName}</span>
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="info-icon-wrapper">
                                    <span>📱</span>
                                </div>
                                <div className="info-content">
                                    <span className="info-label">Phone Number</span>
                                    <span className="info-value">{user.phoneNo}</span>
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="info-icon-wrapper">
                                    <span>🔑</span>
                                </div>
                                <div className="info-content">
                                    <span className="info-label">Unique Key</span>
                                    <span className="info-value key-value">{user.uniqueKey}</span>
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="info-icon-wrapper">
                                    <span>📅</span>
                                </div>
                                <div className="info-content">
                                    <span className="info-label">Member Since</span>
                                    <span className="info-value">
                                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>

                            {user.chromeData?.executablePath && (
                                <div className="info-item">
                                    <div className="info-icon-wrapper">
                                        <span>🌐</span>
                                    </div>
                                    <div className="info-content">
                                        <span className="info-label">Chrome Profile</span>
                                        <span className="info-value chrome-path">
                                            {user.chromeData.executablePath}
                                        </span>
                                        {user.chromeData.chromeProfiles?.length > 0 && (
                                            <span className="info-sub">
                                                {user.chromeData.chromeProfiles.length} profile(s) detected
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {user.chestItemCount > 0 && (
                                <div className="info-item">
                                    <div className="info-icon-wrapper">
                                        <span>📦</span>
                                    </div>
                                    <div className="info-content">
                                        <span className="info-label">Chest Items</span>
                                        <span className="info-value">{user.chestItemCount} secured item(s)</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="action-buttons">
                            <button
                                className="btn btn-browser"
                                onClick={launchBrowser}
                                disabled={browserLoading}
                            >
                                {browserLoading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Launching Browser...
                                    </>
                                ) : (
                                    <>
                                        <span>🚀</span>
                                        Launch Browser
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M5 12h14M12 5l7 7-7 7"/>
                                        </svg>
                                    </>
                                )}
                            </button>

                            {browserMessage && (
                                <div className={`browser-message ${browserMessage.includes('success') ? 'success' : 'error'}`}>
                                    {browserMessage}
                                </div>
                            )}

                            <button
                                className="btn btn-chest"
                                onClick={() => setShowChest(!showChest)}
                            >
                                <span>{showChest ? '🔒' : '📦'}</span>
                                {showChest ? 'Close Chest' : 'Open Secure Chest'}
                                <svg 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2"
                                    style={{ 
                                        transform: showChest ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    <path d="M6 9l6 6 6-6"/>
                                </svg>
                            </button>
                        </div>

                        {/* Chrome Profiles Info */}
                        {user.chromeData?.chromeProfiles?.length > 0 && (
                            <div className="chrome-profiles-section">
                                <h3 className="section-title">
                                    <span>🔍</span> Detected Chrome Profiles
                                </h3>
                                <div className="profiles-list">
                                    {user.chromeData.chromeProfiles.map((profile, index) => (
                                        <div key={index} className={`profile-chip ${profile.isDefault ? 'default' : ''}`}>
                                            <span className="profile-dot"></span>
                                            <span className="profile-name">{profile.name}</span>
                                            {profile.email && (
                                                <span className="profile-email">{profile.email}</span>
                                            )}
                                            {profile.isDefault && (
                                                <span className="default-badge">Default</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="quick-stats">
                            <div className="stat-item">
                                <span className="stat-value">
                                    {user.chestItemCount || 0}
                                </span>
                                <span className="stat-label">Chest Items</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">
                                    {user.chromeData?.chromeProfiles?.length || 0}
                                </span>
                                <span className="stat-label">Profiles</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">
                                    {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                                </span>
                                <span className="stat-label">Days Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chest Component (conditionally rendered) */}
                {showChest && (
                    <div className="chest-wrapper">
                        <Chest uniqueKey={user.uniqueKey} />
                    </div>
                )}
            </>
        );
    }

    // ============================================================
    // LOGIN FORM VIEW
    // ============================================================
    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Card top gradient line */}
                <div className="card-gradient-line"></div>

                {/* Header */}
                <div className="login-header">
                    <div className="login-icon-circle">
                        <span>🔐</span>
                    </div>
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Sign in to access your secure vault</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="alert alert-error">
                        <span className="alert-icon">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label className="form-label">
                            <span className="label-icon">🔑</span>
                            8-Digit Unique Key
                        </label>
                        <input
                            className="form-input"
                            type="text"
                            name="uniqueKey"
                            value={form.uniqueKey}
                            onChange={handleChange}
                            placeholder="Enter your unique key"
                            maxLength="8"
                            autoComplete="off"
                            required
                        />
                        <span className="input-hint">Your server-generated key</span>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <span className="label-icon">🔒</span>
                            Password
                        </label>
                        <input
                            className="form-input"
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            autoComplete="off"
                            required
                        />
                        <span className="input-hint">8+ characters with special chars</span>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <span className="label-icon">📌</span>
                            4-Digit PIN
                        </label>
                        <input
                            className="form-input pin-input"
                            type="password"
                            name="pin"
                            value={form.pin}
                            onChange={handleChange}
                            placeholder="••••"
                            maxLength="4"
                            autoComplete="off"
                            required
                        />
                        <span className="input-hint">Your secure PIN</span>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn btn-primary login-submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Authenticating...
                            </>
                        ) : (
                            <>
                                <span>🔓</span>
                                Unlock Account
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="login-footer">
                    <p className="footer-text">
                        <span className="footer-icon">🛡️</span>
                        Your data is encrypted & secure
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;