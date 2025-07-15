// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
    const [isAuthenticated, setIsAuthenticated] = useState(!!accessToken);
    const [currentUser, setCurrentUser] = useState(null);
    // The loading state is crucial for handling the initial auth check
    const [loading, setLoading] = useState(true);

    // This function fetches user data based on a token
    const fetchCurrentUser = useCallback(async (token) => {
        if (!token) {
            setCurrentUser(null);
            setIsAuthenticated(false);
            setLoading(false);
            return;
        }
        try {
            const user = await authApi.getMe(token);
            setCurrentUser(user);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('AuthContext: Failed to fetch current user, logging out.', error);
            // If the token is invalid, clear everything
            localStorage.removeItem('accessToken');
            setAccessToken(null);
            setCurrentUser(null);
            setIsAuthenticated(false);
        } finally {
            // This ensures the loading spinner always disappears
            setLoading(false);
        }
    }, []);

    // --- THE FIX ---
    // This effect now correctly watches for changes to the accessToken.
    // When login() updates the token, this effect will run again and fetch the new user's data.
    useEffect(() => {
        fetchCurrentUser(accessToken);
    }, [accessToken, fetchCurrentUser]);

    // The login function is now much simpler
    const login = async (email, password) => {
        try {
            const data = await authApi.login(email, password);
            localStorage.setItem('accessToken', data.access_token);
            // This is the only state that needs to be set.
            // The useEffect above will automatically handle fetching the user.
            setAccessToken(data.access_token);
            return true;
        } catch (error) {
            // Ensure loading is false if login fails
            setLoading(false);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        setAccessToken(null);
        setCurrentUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        accessToken,
        isAuthenticated,
        currentUser,
        loading,
        login,
        logout,
        fetchCurrentUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to easily consume the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
