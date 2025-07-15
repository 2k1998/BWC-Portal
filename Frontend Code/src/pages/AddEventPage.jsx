// src/pages/AddEventPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { eventApi } from '../api/apiService';
import DatePicker from 'react-datepicker';
import './Auth.css'; // Reuse styles from the login/register forms

function AddEventPage() {
    const { accessToken } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [eventDate, setEventDate] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !location || !eventDate) {
            showNotification('Title, Location, and Event Date are required.', 'error');
            return;
        }
        setLoading(true);

        const eventData = {
            title,
            description,
            location,
            event_date: eventDate.toISOString(),
        };

        try {
            await eventApi.createEvent(eventData, accessToken);
            showNotification('Event created successfully!', 'success');
            navigate('/dashboard'); // Navigate back to the dashboard after creation
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Create New Event / Seminar</h2>
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="title">Event Title:</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="location">Location:</label>
                    <input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Event Date & Time:</label>
                    <DatePicker
                        selected={eventDate}
                        onChange={(date) => setEventDate(date)}
                        showTimeSelect
                        timeFormat="HH:mm"
                        dateFormat="dd/MM/yyyy HH:mm"
                        className="custom-datepicker-input" // You may need to style this class
                        placeholderText="Select the event date and time"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description (Optional):</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="4"
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Creating Event...' : 'Create Event'}
                </button>
            </form>
        </div>
    );
}

export default AddEventPage;