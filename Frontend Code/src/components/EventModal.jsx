import React from 'react';
import { format } from 'date-fns';
import './EventModal.css'; // We will create this CSS file next

function EventModal({ isOpen, onClose, event }) {
    // Don't render anything if the modal is not open or there's no event data
    if (!isOpen || !event) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="event-modal-content">
                <div className="event-modal-header">
                    <h2>Upcoming Event!</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="event-modal-body">
                    <h3>{event.title}</h3>
                    <p className="event-detail">
                        <strong>Date & Time:</strong> {format(new Date(event.event_date), 'PPPP p')}
                    </p>
                    <p className="event-detail">
                        <strong>Location:</strong> {event.location}
                    </p>
                    {event.description && (
                        <p className="event-description">{event.description}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EventModal;
