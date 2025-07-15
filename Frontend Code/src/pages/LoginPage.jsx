// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom'; // <--- NEW: Import Link
import { useNotification } from '../context/NotificationContext';
import './Auth.css';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const success = await login(email, password);
            if (success) {
                showNotification('Login successful!', 'success');
                navigate('/dashboard');
            }
        } catch (err) {
            showNotification(err.message || 'Login failed. Please try again.', 'error');
            console.error('Login error:', err);
        }
    };

    return (
        <div className="auth-container">
            <h2>Login</h2>
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            {/* --- NEW: Forgot Password Link --- */}
            <p className="forgot-password-link">
                <Link to="/forgot-password" className="link-button">Forgot password?</Link>
            </p>
            {/* --- END NEW --- */}
            <p>Don't have an account? <button onClick={() => navigate('/register')} className="link-button">Register here</button></p>
        </div>
    );
}

export default LoginPage;