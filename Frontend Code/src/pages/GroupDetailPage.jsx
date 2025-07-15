// src/pages/GroupDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupApi, taskApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';

// --- NEW: Import DatePicker ---
import DatePicker from 'react-datepicker';

import './Groups.css';

function GroupDetailPage() {
    const { groupId } = useParams();
    const { accessToken, currentUser, loading: authLoading } = useAuth();
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [groupTasks, setGroupTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const { showNotification } = useNotification();

    const [newMemberId, setNewMemberId] = useState('');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskStartDate, setNewTaskStartDate] = useState(null);
    const [newTaskDeadline, setNewTaskDeadline] = useState(null);
    const [newTaskUrgency, setNewTaskUrgency] = useState(false);
    const [newTaskImportant, setNewTaskImportant] = useState(false);
    const [newTaskDeadlineAllDay, setNewTaskDeadlineAllDay] = useState(false);

    const isAdmin = currentUser?.role === "admin";

    // Updated "All Day Deadline" logic
    useEffect(() => {
        if (newTaskDeadlineAllDay && newTaskStartDate instanceof Date) {
            const deadlineDate = new Date(newTaskStartDate);
            deadlineDate.setHours(23, 30, 0, 0);
            setNewTaskDeadline(deadlineDate);
        }
    }, [newTaskStartDate, newTaskDeadlineAllDay]);

    const fetchGroupDetails = useCallback(async () => {
        if (!accessToken || !groupId) return;
        setLoading(true);
        try {
            const fetchedGroup = await groupApi.getGroupById(parseInt(groupId), accessToken);
            setGroup(fetchedGroup);

            const fetchedMembers = await groupApi.getGroupMembers(parseInt(groupId), accessToken);
            setMembers(fetchedMembers);

            const fetchedTasks = await groupApi.getGroupTasks(parseInt(groupId), accessToken);
            setGroupTasks(fetchedTasks);

        } catch (err) {
            showNotification(err.message || 'Failed to fetch group details.', 'error');
            console.error('Fetch group details error:', err);
            setGroup(null);
            setMembers([]);
            setGroupTasks([]);
        } finally {
            setLoading(false);
        }
    }, [accessToken, groupId, showNotification]);

    useEffect(() => {
        if (!authLoading) {
            fetchGroupDetails();
        }
    }, [authLoading, fetchGroupDetails]);

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!newMemberId.trim()) {
            showNotification('User ID cannot be empty.', 'error');
            return;
        }
        try {
            await groupApi.addUserToGroup(parseInt(groupId), parseInt(newMemberId), accessToken);
            showNotification(`User ID ${newMemberId} added to group.`, 'success');
            setNewMemberId('');
            fetchGroupDetails();
        } catch (err) {
            showNotification(err.message || 'Failed to add member.', 'error');
            console.error('Add member error:', err);
        }
    };

    const handleRemoveMember = async (memberId, memberEmail) => {
        if (!window.confirm(`Are you sure you want to remove ${memberEmail} from this group?`)) {
            return;
        }
        try {
            await groupApi.removeUserFromGroup(parseInt(groupId), memberId, accessToken);
            showNotification(`User ${memberEmail} removed from group.`, 'success');
            fetchGroupDetails();
        } catch (err) {
            showNotification(err.message || 'Failed to remove member.', 'error');
            console.error('Remove member error:', err);
        }
    };

    const handleAssignTask = async (e) => {
        e.preventDefault();
        try {
            const taskData = {
                title: newTaskTitle,
                description: newTaskDescription || null,
                start_date: newTaskStartDate ? newTaskStartDate.toISOString() : null,
                deadline_all_day: newTaskDeadlineAllDay,
                deadline: newTaskDeadline ? newTaskDeadline.toISOString() : null,
                urgency: newTaskUrgency,
                important: newTaskImportant,
            };
            await groupApi.assignGroupTask(parseInt(groupId), taskData, accessToken);
            showNotification(`Task "${newTaskTitle}" assigned to group.`, 'success');
            // Reset form
            setNewTaskTitle('');
            setNewTaskDescription('');
            setNewTaskStartDate(null);
            setNewTaskDeadlineAllDay(false);
            setNewTaskDeadline(null);
            setNewTaskUrgency(false);
            setNewTaskImportant(false);
            fetchGroupDetails();
        } catch (err) {
            showNotification(err.message || 'Failed to assign task.', 'error');
            console.error('Assign task error:', err);
        }
    };

    const handleToggleGroupTaskCompleted = async (taskId, currentStatus) => {
        try {
            await groupApi.updateTask(taskId, { status: currentStatus ? "new" : "completed" }, accessToken);
            showNotification(`Task status updated for task ID ${taskId}.`, 'success');
            fetchGroupDetails();
        } catch (err) {
            showNotification(err.message || 'Failed to update group task status.', 'error');
            console.error('Update group task status error:', err);
        }
    };

    // --- NEW: Handle Delete Task in Group ---
    const handleDeleteTaskInGroup = async (taskId, taskTitle) => {
        if (!window.confirm(`Are you sure you want to delete the task "${taskTitle}" from this group?`)) {
            return;
        }
        try {
            await taskApi.deleteTask(taskId, accessToken); // Reuse taskApi.deleteTask
            showNotification(`Task "${taskTitle}" deleted successfully!`, 'success');
            fetchGroupDetails(); // Re-fetch group details to update the task list
        } catch (err) {
            showNotification(err.message || 'Failed to delete task.', 'error');
            console.error('Delete task error:', err);
        }
    };
    // --- END NEW ---

    if (authLoading || loading) {
        return <div className="loading-spinner">Loading group details...</div>;
    }

    if (!group) {
        return <div className="error-message">Group not found or you are not authorized to view its details.</div>;
    }

    return (
        <div className="group-detail-container">
            <h1>Group: {group?.name || `ID: ${groupId}`}</h1>

            {/* Add/Remove Members Section */}
            <div className="section-card">
                <h2>Members</h2>
                <ul className="member-list">
                    {members.length === 0 ? (
                        <li>No members in this group.</li>
                    ) : (
                        members.map(member => (
                            <li key={member.id} className="member-item">
                                {member.full_name || member.email} (ID: {member.id})
                                {isAdmin && member.id !== currentUser?.id && (
                                    <button
                                        onClick={() => handleRemoveMember(member.id, member.email)}
                                        className="action-button delete-button small"
                                    >
                                        Remove
                                    </button>
                                )}
                            </li>
                        ))
                    )}
                </ul>
                {isAdmin && (
                    <form onSubmit={handleAddMember} className="add-member-form">
                        <h3>Add Member (by User ID)</h3>
                        <div className="form-group">
                            <label htmlFor="newMemberId">User ID:</label>
                            <input
                                type="number"
                                id="newMemberId"
                                value={newMemberId}
                                onChange={(e) => setNewMemberId(e.target.value)}
                                required
                                min="1"
                            />
                        </div>
                        <button type="submit">Add User</button>
                    </form>
                )}
            </div>

            {/* Group Tasks Section */}
            <div className="section-card">
                <h2>Group Tasks</h2>
                {isAdmin && (
                    <form onSubmit={handleAssignTask} className="assign-task-form">
                        <h3>Assign New Task to Group</h3>
                        <div className="form-group">
                            <label htmlFor="groupTaskTitle">Title:</label>
                            <input type="text" id="groupTaskTitle" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="groupTaskDescription">Description:</label>
                            <textarea id="groupTaskDescription" value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)}></textarea>
                        </div>
                        <div className="form-group">
                            <label htmlFor="groupTaskStartDate">Start Date:</label>
                            <DatePicker
                                selected={newTaskStartDate}
                                onChange={(date) => setNewTaskStartDate(date)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="dd/MM/yyyy HH:mm"
                                className="custom-datepicker-input"
                                placeholderText="Select date and time"
                            />
                        </div>
                        <div className="form-group checkbox-group">
                            <input type="checkbox" id="groupTaskDeadlineAllDay" checked={newTaskDeadlineAllDay} onChange={(e) => setNewTaskDeadlineAllDay(e.target.checked)} />
                            <label htmlFor="groupTaskDeadlineAllDay">All Day Deadline</label>
                        </div>
                        <div className="form-group">
                            <label htmlFor="groupTaskDeadline">Deadline:</label>
                            <DatePicker
                                selected={newTaskDeadline}
                                onChange={(date) => setNewTaskDeadline(date)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="dd/MM/yyyy HH:mm"
                                className="custom-datepicker-input"
                                placeholderText="Select date and time"
                                disabled={newTaskDeadlineAllDay}
                            />
                        </div>
                        <div className="form-group checkbox-group">
                            <input type="checkbox" id="groupTaskUrgency" checked={newTaskUrgency} onChange={(e) => setNewTaskUrgency(e.target.checked)} />
                            <label htmlFor="groupTaskUrgency">Urgent</label>
                        </div>
                        <div className="form-group checkbox-group">
                            <input type="checkbox" id="groupTaskImportant" checked={newTaskImportant} onChange={(e) => setNewTaskImportant(e.target.checked)} />
                            <label htmlFor="groupTaskImportant">Important</label>
                        </div>
                        <button type="submit">Assign Task</button>
                    </form>
                )}
                <div className="task-list">
                    {groupTasks.length === 0 ? (
                        <p>No tasks assigned to this group yet.</p>
                    ) : (
                        groupTasks.map(task => (
                            <div
                                key={task.id}
                                className={`task-item ${task.completed ? 'completed' : ''} ${task.urgency && task.important ? 'urgent-important-highlight' : ''}`}
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
                                    {/* --- NEW: Advanced Badge Logic (copy from TasksPage.jsx) --- */}
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
                                    {/* --- END NEW --- */}
                                    <span className={`badge status-${task.status.toLowerCase()}`}>Status: {task.status}</span>
                                </div>
                                <div className="task-actions">
                                    <button
                                        onClick={() => handleToggleGroupTaskCompleted(task.id, task.completed)}
                                        className={`action-button ${task.completed ? 'mark-incomplete' : 'mark-complete'}`}
                                    >
                                        {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                                    </button>
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDeleteTaskInGroup(task.id, task.title)}
                                            className="action-button delete-button"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default GroupDetailPage;