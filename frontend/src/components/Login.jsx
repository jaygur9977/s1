import React, { useState } from 'react';
import './Auth.css';

const Login = ({ onLogin }) => {
    const [form, setForm] = useState({ uniqueKey: '', password: '', pin: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [browserLoading, setBrowserLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (data.success) setUser(data.user);
            else setError(data.message);
        } catch { setError('Connection failed'); }
        setLoading(false);
    };

    const launchBrowser = async () => {
        setBrowserLoading(true);
        try {
            await fetch('http://localhost:5000/api/launch-browser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uniqueKey: user.uniqueKey })
            });
        } catch {}
        setBrowserLoading(false);
    };

    if (user) {
        return (
            <div className="auth-container">
                <div className="congrats-card">
                    <div className="avatar-circle">👤</div>
                    <h1 className="auth-title">Welcome, {user.fullName}!</h1>
                    <p className="auth-subtitle">Your account is ready</p>
                    
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Full Name</span>
                            <span className="info-value">{user.fullName}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Phone</span>
                            <span className="info-value">{user.phoneNo}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Key</span>
                            <span className="info-value" style={{fontFamily: 'monospace'}}>{user.uniqueKey}</span>
                        </div>
                        {user.chromeData?.executablePath && (
                            <div className="info-item">
                                <span className="info-label">Chrome</span>
                                <span className="info-value" style={{fontSize: 11}}>{user.chromeData.executablePath}</span>
                            </div>
                        )}
                    </div>

                    <button className="btn btn-browser" onClick={launchBrowser} disabled={browserLoading}>
                        {browserLoading ? '⏳ Launching...' : '🚀 Launch Browser'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Sign in to your Cloude account</p>
                
                {error && <div className="alert alert-error">⚠️ {error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>8-Digit Unique Key</label>
                        <input className="form-input" name="uniqueKey" value={form.uniqueKey} onChange={(e) => setForm(p => ({...p, uniqueKey: e.target.value}))} placeholder="Enter your key" maxLength="8" required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input className="form-input" type="password" name="password" value={form.password} onChange={(e) => setForm(p => ({...p, password: e.target.value}))} placeholder="Enter password" required />
                    </div>
                    <div className="form-group">
                        <label>4-Digit PIN</label>
                        <input className="form-input" type="password" name="pin" value={form.pin} onChange={(e) => setForm(p => ({...p, pin: e.target.value}))} placeholder="••••" maxLength="4" required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Signing in...' : '🔐 Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;