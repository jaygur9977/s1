import React, { useState } from 'react';
import './Auth.css';

const DeleteAccount = () => {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ fullName: '', mobileNo: '', otp: '', pin: '' });
    const [error, setError] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [done, setDone] = useState(false);

    const sendOTP = async () => {
        if (!form.fullName || !form.mobileNo) return setError('Fill all fields');
        try {
            const res = await fetch('http://localhost:5000/api/send-delete-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName: form.fullName, mobileNo: form.mobileNo })
            });
            const data = await res.json();
            if (data.success) { setOtpSent(true); setOtpValue(data.otp); setStep(2); }
            else setError(data.message);
        } catch { setError('Server error'); }
    };

    const verifyAndDelete = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/verify-delete-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, otp: form.otp })
            });
            const data = await res.json();
            if (data.success) { setDone(true); setStep(3); }
            else setError(data.message);
        } catch { setError('Server error'); }
    };

    if (done) {
        return (
            <div className="auth-container">
                <div className="auth-card" style={{textAlign: 'center'}}>
                    <div style={{fontSize: 64, marginBottom: 20}}>📨</div>
                    <h1 className="auth-title">Request Submitted</h1>
                    <p style={{color: '#6B7280', margin: '15px 0', lineHeight: 1.6}}>
                        Your deletion request is being processed. Admin will verify within 24 hours.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Delete Account</h1>
                <p className="auth-subtitle">Step {step} of 3</p>

                {error && <div className="alert alert-error">⚠️ {error}</div>}

                {step === 1 && (
                    <>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input className="form-input" value={form.fullName} onChange={e => setForm(p => ({...p, fullName: e.target.value}))} placeholder="John Doe" />
                        </div>
                        <div className="form-group">
                            <label>Mobile Number</label>
                            <input className="form-input" value={form.mobileNo} onChange={e => setForm(p => ({...p, mobileNo: e.target.value}))} placeholder="9876543210" maxLength="10" />
                        </div>
                        <button className="btn btn-otp" onClick={sendOTP}>📱 Send OTP</button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="otp-section">
                            <p style={{fontWeight: 600, color: '#92400E'}}>OTP sent to your mobile</p>
                            <div className="otp-display">{otpValue}</div>
                            <p style={{fontSize: 12, color: '#92400E'}}>Use this OTP for verification</p>
                        </div>
                        <div className="form-group">
                            <label>Enter OTP</label>
                            <input className="form-input" value={form.otp} onChange={e => setForm(p => ({...p, otp: e.target.value}))} placeholder="12345" maxLength="5" />
                        </div>
                        <div className="form-group">
                            <label>4-Digit PIN</label>
                            <input className="form-input" type="password" value={form.pin} onChange={e => setForm(p => ({...p, pin: e.target.value}))} placeholder="••••" maxLength="4" />
                        </div>
                        <button className="btn btn-danger" onClick={verifyAndDelete}>🗑️ Confirm Deletion</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default DeleteAccount;