// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import './Profile.css';

function ProfilePage() {
    const { currentUser, accessToken, loading: authLoading, fetchCurrentUser } = useAuth();
    const { showNotification } = useNotification();

    // --- States for textual profile info ---
    const [firstName, setFirstName] = useState('');
    const [surname, setSurname] = useState('');
    const [birthday, setBirthday] = useState('');
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    // --- End States ---

    useEffect(() => {
        // This useEffect runs when the component mounts or currentUser changes
        if (currentUser) {
            setFirstName(currentUser.first_name || '');
            setSurname(currentUser.surname || '');
            setBirthday(currentUser.birthday ? new Date(currentUser.birthday).toISOString().split('T')[0] : '');
        }
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingUpdate(true);

        const updateData = {
            first_name: firstName.trim() === '' ? null : firstName.trim(),
            surname: surname.trim() === '' ? null : surname.trim(),
            birthday: birthday.trim() === '' ? null : birthday.trim(),
        };

        try {
            await authApi.updateUserMe(updateData, accessToken);
            showNotification('Profile updated successfully!', 'success');
            await fetchCurrentUser(accessToken);
        } catch (err) {
            showNotification(err.message || 'Failed to update profile.', 'error');
            console.error('Profile update error:', err);
        } finally {
            setLoadingUpdate(false);
        }
    };

    if (authLoading || !currentUser) {
        return <div className="loading-spinner">Loading profile...</div>;
    }

    return (
        <div className="profile-container">
            <h1>My Profile</h1>
            <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={currentUser.email}
                        disabled
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="firstName">First Name:</label>
                    <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="surname">Surname:</label>
                    <input
                        type="text"
                        id="surname"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="birthday">Birthday:</label>
                    <input
                        type="date"
                        id="birthday"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                    />
                </div>
                <button type="submit" disabled={loadingUpdate}>
                    {loadingUpdate ? 'Updating...' : 'Update Profile'}
                </button>
            </form>
        </div>
    );
}

export default ProfilePage;