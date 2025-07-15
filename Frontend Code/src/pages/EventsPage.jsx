// src/pages/EventsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { eventApi } from '../api/apiService';
import { format } from 'date-fns';
import './Events.css'; // We'll create this CSS file next

function EventsPage() {
    const { accessToken, currentUser } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const isAdmin = currentUser?.role === 'admin';

    const fetchEvents = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const fetchedEvents = await eventApi.getAllEvents(accessToken);
            setEvents(fetchedEvents);
        } catch (err) {
            showNotification(err.message || 'Failed to fetch events.', 'error');
        } finally {
            setLoading(false);
        }
    }, [accessToken, showNotification]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleDelete = async (eventId, eventTitle) => {
        if (!window.confirm(`Are you sure you want to delete the event "${eventTitle}"?`)) {
            return;
        }
        try {
            await eventApi.deleteEvent(eventId, accessToken);
            showNotification('Event deleted successfully!', 'success');
            fetchEvents(); // Refresh the list
        } catch (err) {
            showNotification(err.message || 'Failed to delete event.', 'error');
        }
    };

    if (loading) {
        return <div className="loading-spinner">Loading events...</div>;
    }

    return (
        <div className="events-container">
            <div className="events-header">
                <h1>Programmed Events</h1>
                {isAdmin && (
                    <button onClick={() => navigate('/events/new')} className="add-event-button">
                        Add New Event
                    </button>
                )}
            </div>

            <div className="event-list">
                {events.length === 0 ? (
                    <p className="no-events-message">There are no events programmed.</p>
                ) : (
                    events.map(event => (
                        <div key={event.id} className="event-card">
                            <div className="event-card-header">
                                <h3>{event.title}</h3>
                                {isAdmin && (
                                    <button 
                                        onClick={() => handleDelete(event.id, event.title)}
                                        className="delete-event-button"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                            <div className="event-card-body">
                                <p><strong>Date:</strong> {format(new Date(event.event_date), 'PPPP p')}</p>
                                <p><strong>Location:</strong> {event.location}</p>
                                {event.description && <p className="event-description">{event.description}</p>}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default EventsPage;
