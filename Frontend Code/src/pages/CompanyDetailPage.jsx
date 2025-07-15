// src/pages/CompanyDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { companyApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import './CompanyDetailPage.css'; // We will create this CSS file

function CompanyDetailPage() {
    const { companyId } = useParams();
    const { accessToken } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchTasks = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const fetchedTasks = await companyApi.getCompanyTasks(parseInt(companyId), accessToken);
            setTasks(fetchedTasks);
            // A bit of a trick to get the company name from the first task if it exists
            if (fetchedTasks.length > 0) {
                 // This assumes the backend will eventually provide the company name with the task
                 // For now, we'll just use the ID
                 setCompanyName(`Company ID: ${companyId}`);
            } else {
                 setCompanyName(`Company ID: ${companyId}`);
            }
        } catch (err) {
            showNotification(err.message || 'Failed to fetch company tasks.', 'error');
        } finally {
            setLoading(false);
        }
    }, [accessToken, companyId, showNotification]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return (
        <div className="company-detail-container">
            <button onClick={() => navigate(-1)} className="back-button">← Back</button>
            <h1>Tasks for {companyName}</h1>
            {loading ? (
                <div className="loading-spinner">Loading tasks...</div>
            ) : tasks.length === 0 ? (
                <p>No tasks found for this company.</p>
            ) : (
                <div className="task-list">
                    {tasks.map(task => (
                        <div key={task.id} className="task-item">
                            <h3>{task.title}</h3>
                            <p>{task.description}</p>
                            <span className={`badge status-${task.status}`}>{task.status}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CompanyDetailPage;