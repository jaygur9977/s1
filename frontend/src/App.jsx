import React, { useState } from 'react';
import Registration from './components/Registration';
import Login from './components/Login';
import DeleteAccount from './components/DeleteAccount';
import './components/Auth.css';

function App() {
    const [page, setPage] = useState('menu');

    return (
        <>
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
            <div className="grid-pattern"></div>

            {page !== 'menu' && (
                <span className="back-link" onClick={() => setPage('menu')} style={{position: 'fixed', top: 30, left: 30, zIndex: 10}}>
                    ← Back
                </span>
            )}

            {page === 'menu' && (
                <div className="auth-container">
                    <div className="auth-card">
                        <h1 className="auth-title">Cloude</h1>
                        <p className="auth-subtitle">Secure Profile Manager</p>
                        <div className="menu-grid">
                            <div className="menu-btn" onClick={() => setPage('register')}>
                                <span className="menu-icon">📝</span> Create Account
                            </div>
                            <div className="menu-btn" onClick={() => setPage('login')}>
                                <span className="menu-icon">🔐</span> Sign In
                            </div>
                            <div className="menu-btn" onClick={() => setPage('delete')}>
                                <span className="menu-icon">🗑️</span> Delete Account
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {page === 'register' && <Registration onRegister={() => setPage('login')} />}
            {page === 'login' && <Login />}
            {page === 'delete' && <DeleteAccount />}
        </>
    );
}

export default App;