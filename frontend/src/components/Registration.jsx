import React, { useState } from 'react';
import './Auth.css';

const Registration = ({ onRegister }) => {
    const [form, setForm] = useState({ fullName: '', phoneNo: '', uniqueKey: '', password: '', pin: '' });
    const [generating, setGenerating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        
        if (name === 'password') {
            let strength = 0;
            if (value.length >= 8) strength++;
            if (/[A-Z]/.test(value)) strength++;
            if (/[a-z]/.test(value)) strength++;
            if (/[0-9]/.test(value)) strength++;
            if (/[^A-Za-z0-9]/.test(value)) strength++;
            setPasswordStrength(strength);
        }
    };

    const generateKey = async () => {
        setGenerating(true);
        try {
            const res = await fetch('http://localhost:5000/api/generate-key', { method: 'POST' });
            const data = await res.json();
            if (data.success) setForm(prev => ({ ...prev, uniqueKey: data.uniqueKey }));
            else setError(data.message);
        } catch { setError('Server error'); }
        setGenerating(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('🎉 Registration successful! Redirecting...');
                setTimeout(() => onRegister?.(data), 1500);
            } else setError(data.message);
        } catch { setError('Connection failed'); }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join Cloude • Your Digital Identity</p>
                
                {error && <div className="alert alert-error">⚠️ {error}</div>}
                {success && <div className="alert alert-success">✅ {success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input className="form-input" name="fullName" value={form.fullName} onChange={handleChange} placeholder="John Doe" required />
                    </div>

                    <div className="form-group">
                        <label>Phone Number (10 digits)</label>
                        <input className="form-input" name="phoneNo" value={form.phoneNo} onChange={handleChange} placeholder="9876543210" maxLength="10" required />
                    </div>

                    <button type="button" className="btn btn-generate" onClick={generateKey} disabled={generating}>
                        {generating ? '⏳ Generating...' : '🎲 Generate Unique Key'}
                    </button>

                    <div className="form-group">
                        <label>Unique Key</label>
                        <input className="form-input readonly" name="uniqueKey" value={form.uniqueKey} readOnly placeholder="Click generate" />
                    </div>

                    <div className="form-group">
                        <label>Create Password</label>
                        <input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min 8 chars, A-Z, a-z, 0-9, special" required />
                        {form.password && <div className={`strength-meter strength-${['weak','medium','strong','very-strong'][Math.min(passwordStrength-1, 3)]}`} />}
                    </div>

                    <div className="form-group">
                        <label>4-Digit PIN</label>
                        <input className="form-input" type="password" name="pin" value={form.pin} onChange={handleChange} placeholder="••••" maxLength="4" required />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Creating...' : '✨ Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Registration;