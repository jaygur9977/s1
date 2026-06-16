import React, { useState, useEffect } from 'react';
import './Auth.css';

const DeleteAccount = () => {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ 
        uniqueKey: '', 
        password: '', 
        pin: '', 
        otp: '' 
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [otpReceived, setOtpReceived] = useState('');
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [canResend, setCanResend] = useState(true);

    // Timer for OTP expiration
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setCanResend(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Only allow digits for PIN and OTP
        if ((name === 'pin' || name === 'otp') && value && !/^\d*$/.test(value)) {
            return;
        }
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // Step 1: Verify identity and get OTP
    const handleVerify = async () => {
        // Validate all fields
        if (!form.uniqueKey.trim()) {
            setError('Please enter your unique key');
            return;
        }
        if (!form.password) {
            setError('Please enter your password');
            return;
        }
        if (!form.pin || form.pin.length !== 4) {
            setError('Please enter a valid 4-digit PIN');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('http://localhost:5000/api/delete/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    uniqueKey: form.uniqueKey.trim(), 
                    password: form.password, 
                    pin: form.pin 
                })
            });
            
            const data = await res.json();
            console.log('Verify response:', data);
            
            if (data.success) {
                setOtpReceived(data.otp);
                setSuccess('OTP sent to your registered mobile number! Valid for 5 minutes.');
                setStep(2);
                setTimer(300); // 5 minutes
                setCanResend(false);
                setForm(prev => ({ ...prev, otp: '' })); // Clear OTP field
            } else {
                setError(data.message || 'Verification failed');
            }
        } catch (err) {
            console.error('Verify error:', err);
            setError('Connection failed. Please check if server is running.');
        }
        
        setLoading(false);
    };

    // Step 2: Confirm with OTP
    const handleConfirm = async () => {
        if (!form.otp || form.otp.length < 5) {
            setError('Please enter the complete 5-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:5000/api/delete/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    uniqueKey: form.uniqueKey.trim(), 
                    otp: form.otp.trim() 
                })
            });
            
            const data = await res.json();
            console.log('Confirm response:', data);
            
            if (data.success) {
                setDone(true);
                setStep(3);
                setSuccess(data.message);
            } else {
                setError(data.message || 'OTP verification failed');
            }
        } catch (err) {
            console.error('Confirm error:', err);
            setError('Connection failed. Please try again.');
        }
        
        setLoading(false);
    };

    // Resend OTP
    const handleResendOTP = async () => {
        if (!canResend) return;
        
        setLoading(true);
        setError('');
        
        try {
            const res = await fetch('http://localhost:5000/api/delete/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uniqueKey: form.uniqueKey.trim() })
            });
            
            const data = await res.json();
            
            if (data.success) {
                setOtpReceived(data.otp);
                setSuccess('New OTP sent successfully!');
                setTimer(300);
                setCanResend(false);
                setForm(prev => ({ ...prev, otp: '' }));
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to resend OTP');
        }
        
        setLoading(false);
    };

    // Go back to step 1
    const handleBack = () => {
        setStep(1);
        setError('');
        setSuccess('');
        setForm(prev => ({ ...prev, otp: '' }));
        setTimer(0);
        setCanResend(true);
    };

    // Success view after deletion request
    if (done) {
        return (
            <div className="auth-container">
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <div className="success-animation">
                        <div className="success-circle">
                            <span className="success-checkmark">✓</span>
                        </div>
                    </div>
                    
                    <h1 className="auth-title" style={{ color: '#10B981' }}>
                        Request Submitted
                    </h1>
                    
                    <div className="deletion-success-message">
                        <p className="main-message">
                            Your account deletion request has been submitted successfully.
                        </p>
                        <p className="sub-message">
                            Our admin team will review your request within 24 hours. 
                            After verification, your account and all associated data will be permanently deleted.
                        </p>
                    </div>

                    <div className="deletion-details-card">
                        <h3>Request Summary</h3>
                        <div className="detail-row">
                            <span className="detail-label">Status</span>
                            <span className="detail-value status-pending">⏳ Pending Review</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Submitted</span>
                            <span className="detail-value">
                                {new Date().toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>

                    <div className="info-note">
                        <span>💡</span>
                        <p>
                            If you change your mind, please contact our support team within 24 hours 
                            to cancel the deletion request.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Header */}
                <div className="delete-header">
                    <div className="delete-icon-circle">
                        <span>⚠️</span>
                    </div>
                    <h1 className="auth-title" style={{ color: '#EF4444' }}>
                        Delete Account
                    </h1>
                    <p className="auth-subtitle">
                        {step === 1 ? 'Step 1: Verify Your Identity' : 'Step 2: Confirm with OTP'}
                    </p>
                    
                    {/* Step Indicators */}
                    <div className="step-indicators">
                        <div className={`step-dot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                            {step > 1 ? '✓' : '1'}
                        </div>
                        <div className={`step-line ${step > 1 ? 'active' : ''}`}></div>
                        <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                        <div className={`step-line ${step > 2 ? 'active' : ''}`}></div>
                        <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>✓</div>
                    </div>
                </div>

                {/* Warning Box */}
                <div className="warning-box">
                    <span className="warning-icon">⚠️</span>
                    <p>This action is permanent. All your data including chest items, profile information, and Chrome data will be deleted after 24-hour verification period.</p>
                </div>

                {/* Error/Success Alerts */}
                {error && (
                    <div className="alert alert-error">
                        <span>⚠️</span> {error}
                        <button onClick={() => setError('')} className="alert-close">✕</button>
                    </div>
                )}
                
                {success && (
                    <div className="alert alert-success">
                        <span>✅</span> {success}
                        <button onClick={() => setSuccess('')} className="alert-close">✕</button>
                    </div>
                )}

                {/* Step 1: Identity Verification */}
                {step === 1 && (
                    <div className="verify-form">
                        <div className="form-group">
                            <label className="form-label">
                                <span>🔑</span> 8-Digit Unique Key
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
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <span>🔒</span> Password
                            </label>
                            <input
                                className="form-input"
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                autoComplete="off"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <span>📌</span> 4-Digit PIN
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
                            />
                        </div>

                        <button 
                            className="btn btn-danger verify-btn" 
                            onClick={handleVerify} 
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <span>📱</span> Verify & Send OTP
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                    <div className="otp-form">
                        <div className="otp-info-card">
                            <div className="otp-sent-icon">📨</div>
                            <p className="otp-sent-text">
                                OTP has been sent to your registered mobile number
                            </p>
                            
                            {/* OTP Display (for testing) */}
                            <div className="otp-display-box">
                                <span className="otp-label">Your OTP:</span>
                                <span className="otp-value-display">{otpReceived}</span>
                            </div>
                            
                            {/* Timer */}
                            {timer > 0 && (
                                <div className="otp-timer">
                                    <span>⏱️ Expires in: </span>
                                    <span className="timer-value">{formatTime(timer)}</span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <span>🔢</span> Enter 5-Digit OTP
                            </label>
                            <input
                                className="form-input otp-input"
                                type="text"
                                name="otp"
                                value={form.otp}
                                onChange={handleChange}
                                placeholder="12345"
                                maxLength="5"
                                autoComplete="off"
                                autoFocus
                            />
                        </div>

                        <div className="otp-actions">
                            <button 
                                className="btn btn-danger confirm-btn" 
                                onClick={handleConfirm} 
                                disabled={loading || form.otp.length < 5}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Confirming...
                                    </>
                                ) : (
                                    '🗑️ Confirm Deletion'
                                )}
                            </button>
                            
                            <button 
                                className="btn btn-outline back-btn-otp" 
                                onClick={handleBack}
                                disabled={loading}
                            >
                                ← Back
                            </button>
                        </div>

                        {/* Resend OTP */}
                        <div className="resend-section">
                            <p>Didn't receive OTP?</p>
                            <button 
                                className={`resend-btn ${canResend ? 'active' : 'disabled'}`}
                                onClick={handleResendOTP}
                                disabled={!canResend || loading}
                            >
                                {canResend ? '📤 Resend OTP' : `Resend in ${formatTime(timer)}`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeleteAccount;