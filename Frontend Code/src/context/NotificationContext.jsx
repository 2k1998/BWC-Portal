// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For unique IDs (install below)

// Create the context
const NotificationContext = createContext(null);

// Custom hook to easily consume the notification context
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

// Provider component
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    // Function to show a new notification
    // type: 'success', 'error', 'info', 'warning'
    // message: The text to display
    // duration: How long it should stay (ms), 0 for persistent
    const showNotification = useCallback((message, type = 'info', duration = 3000) => {
        const id = uuidv4(); // Generate a unique ID for each notification
        const newNotification = { id, message, type };
        setNotifications((prevNotifications) => [...prevNotifications, newNotification]);

        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    }, []); // No dependencies for showNotification itself

    // Function to remove a notification by ID
    const removeNotification = useCallback((id) => {
        setNotifications((prevNotifications) =>
            prevNotifications.filter((notification) => notification.id !== id)
        );
    }, []); // No dependencies for removeNotification itself

    const value = {
        notifications,
        showNotification,
        removeNotification,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};