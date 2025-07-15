// src/pages/UsersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import './Users.css';

function UsersPage() {
    const { accessToken, currentUser, loading: authLoading } = useAuth();
    const { showNotification } = useNotification();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(''); // State for the immediate search input value
    const [searchTrigger, setSearchTrigger] = useState(0); // State to trigger search on Enter

    const isAdmin = currentUser?.role === "admin";

    // fetchUsers now accepts a 'search' parameter and is NOT dependent on searchQuery in useCallback
    const fetchUsers = useCallback(async (search) => { // <--- ADD 'search' PARAMETER HERE
        if (!accessToken) return;
        setLoading(true);
        try {
            // Use the 'search' parameter passed to the function
            const fetchedUsers = await authApi.listAllUsers(accessToken, search);
            setUsers(fetchedUsers);
        } catch (err) {
            showNotification(err.message || 'Failed to fetch users.', 'error');
            console.error('Fetch users error:', err);
        } finally {
            setLoading(false);
        }
    }, [accessToken, showNotification]); // <--- IMPORTANT: REMOVE 'searchQuery' from here

    // This useEffect will now trigger fetching users ONLY when searchTrigger changes
    useEffect(() => {
        if (!authLoading && accessToken && isAdmin) {
            // Pass the current searchQuery state to fetchUsers
            fetchUsers(searchQuery); // <--- PASS searchQuery as ARGUMENT
        } else if (!authLoading && !isAdmin) {
            showNotification("You are not authorized to view this page.", "error");
            setLoading(false);
        }
    }, [accessToken, authLoading, isAdmin, fetchUsers, searchTrigger]); // <--- Dependency on searchTrigger

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value); // Update immediate search input value
        // No direct fetch call here
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setSearchTrigger(prev => prev + 1); // Increment trigger to force useEffect re-run
        }
    };

    const handleSearchButtonClick = () => {
        setSearchTrigger(prev => prev + 1); // Increment trigger to force useEffect re-run
    };

    if (authLoading || loading) {
        return <div className="loading-spinner">Loading users...</div>;
    }

    if (!isAdmin) {
        return <div className="error-message">Access Denied: You must be an administrator to view this page.</div>;
    }

    return (
        <div className="users-container">
            <h1>All Users</h1>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search by email or name..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                />
                <button onClick={handleSearchButtonClick} style={{ marginLeft: '10px', padding: '12px 20px', borderRadius: '25px', border: 'none', backgroundColor: '#007bff', color: 'white', cursor: 'pointer' }}>Search</button>
            </div>

            <div className="user-list">
                {users.length === 0 && searchQuery !== '' ? (
                    <p>No users found matching "{searchQuery}".</p>
                ) : users.length === 0 && searchQuery === '' ? (
                    <p>No users found. Create one through the backend or database.</p>
                ) : (
                    users.map(user => (
                        <div key={user.id} className="user-item">
                            <span><strong>ID:</strong> {user.id}</span>
                            <span><strong>Email:</strong> {user.email}</span>
                            {user.full_name && <span><strong>Name:</strong> {user.full_name}</span>}
                            <span><strong>Role:</strong> {user.role}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default UsersPage;