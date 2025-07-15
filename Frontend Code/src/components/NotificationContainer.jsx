// src/components/NotificationContainer.jsx
import React from 'react';
import Toast from './Toast';
import { useNotification } from '../context/NotificationContext';
import './Toast.css'; // Import the same CSS for overall container positioning

const NotificationContainer = () => {
    const { notifications, removeNotification } = useNotification();

    return (
        <div className="notification-container">
            {notifications.map((notification) => (
                <Toast
                    key={notification.id}
                    id={notification.id}
                    message={notification.message}
                    type={notification.type}
                    onRemove={removeNotification}
                />
            ))}
        </div>
    );
};

export default NotificationContainer;