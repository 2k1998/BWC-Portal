// src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { authApi } from '../api/apiService';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import './Auth.css'; // Reuse existing Auth styling

function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Call the backend endpoint to request password reset
            const response = await authApi.requestPasswordReset({ email });
            showNotification(response.message, 'success'); // Display the backend's success message
            setEmail(''); // Clear email field
        } catch (err) {
            showNotification(err.message || 'Failed to request password reset. Please try again.', 'error');
            console.error('Forgot password error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Forgot Password?</h2>
            <p>Enter your email address below and we'll send you a link to reset your password.</p>
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
                <button type="submit" disabled={loading}>
                    {loading ? 'Sending Link...' : 'Send Reset Link'}
                </button>
            </form>
            <p><button onClick={() => navigate('/login')} className="link-button">Back to Login</button></p>
        </div>
    );
}

export default ForgotPasswordPage;