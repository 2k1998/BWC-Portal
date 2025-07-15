// src/components/Toast.jsx
import React from 'react';
import './Toast.css'; // We'll create this CSS file

const Toast = ({ id, message, type, onRemove }) => {
    const typeClass = type ? `toast-${type}` : 'toast-info'; // Add a class based on type

    return (
        <div className={`toast ${typeClass}`} role="alert">
            <div className="toast-message">{message}</div>
            <button className="toast-close-button" onClick={() => onRemove(id)}>
                &times;
            </button>
        </div>
    );
};

export default Toast;