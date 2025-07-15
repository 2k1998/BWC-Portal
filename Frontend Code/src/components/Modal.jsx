// src/components/Modal.jsx
import React from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, message, onConfirm, showConfirmButton = true, confirmText = "Yes", cancelText = "No" }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    {showConfirmButton && (
                        <button className="modal-confirm-button" onClick={onConfirm}>
                            {confirmText}
                        </button>
                    )}
                    <button className="modal-cancel-button" onClick={onClose}>
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;