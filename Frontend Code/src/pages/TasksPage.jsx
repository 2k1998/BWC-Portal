// src/pages/TasksPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import TaskForm from '../components/TaskForm';
import './Tasks.css';

function TasksPage() {
    const { accessToken, currentUser, loading: authLoading } = useAuth();
    const { showNotification } = useNotification();

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const isAdmin = currentUser?.role === "admin";

    const fetchTasks = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const fetchedTasks = await taskApi.getTasks(accessToken);
            setTasks(fetchedTasks);
        } catch (err) {
            showNotification(err.message || 'Failed to fetch tasks.', 'error');
        } finally {
            setLoading(false);
        }
    }, [accessToken, showNotification]);

    useEffect(() => {
        if (!authLoading && accessToken) {
            fetchTasks();
        }
    }, [accessToken, authLoading, fetchTasks]);

    const handleCreateTask = async (taskData) => {
        try {
            await taskApi.createTask(taskData, accessToken);
            showNotification('Task created successfully!', 'success');
            fetchTasks();
            setShowCreateForm(false);
        } catch (err) {
            showNotification(err.message || 'Failed to create task.', 'error');
        }
    };

    const handleToggleCompleted = async (taskId, currentCompletedStatus) => {
        try {
            await taskApi.updateTask(taskId, { completed: !currentCompletedStatus }, accessToken);
            showNotification(`Task marked as ${!currentCompletedStatus ? 'completed' : 'incomplete'}!`, 'success');
            fetchTasks();
        } catch (err) {
            showNotification(err.message || 'Failed to update task status.', 'error');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await taskApi.deleteTask(taskId, accessToken);
            showNotification('Task deleted successfully!', 'success');
            fetchTasks();
        } catch (err) {
            showNotification(err.message || 'Failed to delete task.', 'error');
        }
    };

    if (authLoading || loading) {
        return <div className="loading-spinner">Loading tasks...</div>;
    }

    const activeTasks = tasks.filter(task => !task.completed);
    const completedTasks = tasks.filter(task => task.completed);

    return (
        <div className="tasks-container">
            <h1>My Tasks</h1>

            {isAdmin && (
                <button onClick={() => setShowCreateForm(!showCreateForm)} className="toggle-form-button">
                    {showCreateForm ? 'Hide Create Task Form' : 'Create New Task'}
                </button>
            )}

            {isAdmin && showCreateForm && (
                <TaskForm onSubmit={handleCreateTask} submitButtonText="Add Task" />
            )}

            <div className="active-tasks-section">
                <h2>Active Tasks ({activeTasks.length})</h2>
                <div className="task-list">
                    {activeTasks.length === 0 ? (
                        <p>No active tasks.</p>
                    ) : (
                        activeTasks.map((task) => (
                            <div key={task.id} className={`task-item${task.urgency && task.important ? ' urgent-important-highlight' : ''}`}>
                                <h3>{task.title}</h3>
                                <p>{task.description}</p>
                                {task.start_date && <p>Starts: {new Date(task.start_date).toLocaleString()}</p>}
                                {task.deadline && <p>Deadline: {new Date(task.deadline).toLocaleString()}</p>}
                                <div className="task-badges">
                                    {task.deadline_all_day ? (
                                        <span className="badge all-day-badge">All Day</span>
                                    ) : task.urgency && task.important ? (
                                        <span className="badge urgent-and-important">Urgent and Important</span>
                                    ) : task.urgency ? (
                                        <span className="badge urgent-only">Urgent</span>
                                    ) : task.important ? (
                                        <span className="badge important-only">Important</span>
                                    ) : (
                                        <span className="badge not-urgent-not-important">Normal</span>
                                    )}
                                    <span className={`badge status-${task.status.toLowerCase()}`}>Status: {task.status}</span>
                                </div>
                                <div className="task-actions">
                                    <button onClick={() => handleToggleCompleted(task.id, task.completed)} className="action-button mark-complete">Mark Complete</button>
                                    <button onClick={() => handleDeleteTask(task.id)} className="action-button delete-button">Delete</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <div className="completed-tasks-section">
                <h2>Completed Tasks ({completedTasks.length})</h2>
                <div className="task-list">
                    {completedTasks.length === 0 ? (
                        <p>No completed tasks yet. Get to work!</p>
                    ) : (
                        completedTasks.map((task) => (
                            <div
                                key={task.id}
                                className={`task-item completed${task.urgency && task.important ? ' urgent-important-highlight' : ''}`}
                            >
                                <h3>{task.title}</h3>
                                <p>{task.description}</p>
                                {task.start_date && (
                                    <p>Starts: {new Date(task.start_date).toLocaleString()}</p>
                                )}
                                {task.deadline && (
                                    <p>Deadline: {new Date(task.deadline).toLocaleString()}</p>
                                )}
                                {task.deadline_all_day && (
                                    <span className="badge all-day-badge">All Day</span>
                                )}
                                <div className="task-badges">
                                    {task.urgency && task.important ? (
                                        <span className="badge urgent-and-important">Urgent and Important</span>
                                    ) : (
                                        <>
                                            {task.urgency && <span className="badge urgent red-circle">U</span>}
                                            {task.important && <span className="badge important red-circle">I</span>}
                                        </>
                                    )}
                                    <span className={`badge status-${task.status.toLowerCase()}`}>Status: {task.status}</span>
                                </div>
                                <div className="task-actions">
                                    <button
                                        onClick={() => handleToggleCompleted(task.id, task.completed)}
                                        className="action-button mark-incomplete"
                                    >
                                        Mark Incomplete
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="action-button delete-button"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default TasksPage;