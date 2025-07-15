// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { authApi } from '../api/apiService';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext'; // <--- NEW IMPORT
import './Auth.css'; // Reuse the same CSS file

function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [birthday, setBirthday] = useState(''); // Format: YYYY-MM-DD
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification(); // <--- USE NOTIFICATION HOOK
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Basic validation for birthday format if present
        let parsedBirthday = null;
        if (birthday) {
            try {
                const dateObj = new Date(birthday + 'T00:00:00'); // Add T00:00:00 for correct UTC interpretation
                if (isNaN(dateObj.getTime())) {
                    throw new Error("Invalid birthday format. Use YYYY-MM-DD.");
                }
                parsedBirthday = birthday; // Backend expects YYYY-MM-DD string
            } catch (bdayError) {
                showNotification(bdayError.message, 'error'); // <--- SHOW ERROR TOAST
                setLoading(false);
                return;
            }
        }

        try {
            await authApi.register({
                email,
                password,
                full_name: fullName || null, // Send null if empty
                birthday: parsedBirthday, // Send parsedBirthday (string or null)
            });
            showNotification('Registration successful! You can now log in.', 'success'); // <--- SHOW SUCCESS TOAST
            setEmail('');
            setPassword('');
            setFullName('');
            setBirthday('');
            // Optionally redirect to login after a short delay
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            showNotification(err.message || 'Registration failed. Please try again.', 'error'); // <--- SHOW ERROR TOAST
            console.error('Registration error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Register</h2>
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="reg-email">Email:</label>
                    <input
                        type="email"
                        id="reg-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="reg-password">Password:</label>
                    <input
                        type="password"
                        id="reg-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="full-name">Full Name (Optional):</label>
                    <input
                        type="text"
                        id="full-name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="birthday">Birthday (Optional - YYYY-MM-DD):</label>
                    <input
                        type="date" // Use type="date" for a date picker
                        id="birthday"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
            <p>Already have an account? <button onClick={() => navigate('/login')} className="link-button">Login here</button></p>
        </div>
    );
}

export default RegisterPage;