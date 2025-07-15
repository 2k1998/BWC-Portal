// src/pages/GroupsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupApi, authApi } from '../api/apiService';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import './Groups.css';

function GroupsPage() {
    const { accessToken, currentUser, loading: authLoading } = useAuth();
    const { showNotification } = useNotification();
    const [groups, setGroups] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newGroupName, setNewGroupName] = useState('');

    const isAdmin = currentUser?.role === "admin";

    const fetchGroups = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const fetchedGroups = await groupApi.getGroups(accessToken);
            setGroups(fetchedGroups);
        } catch (err) {
            showNotification(err.message || 'Failed to fetch groups.', 'error');
            console.error('Fetch groups error:', err);
        } finally {
            setLoading(false);
        }
    }, [accessToken, showNotification]);

    const fetchAllUsers = useCallback(async () => {
        if (!accessToken || !isAdmin) return;
        try {
            const users = await authApi.listAllUsers(accessToken);
            setAllUsers(users);
        } catch (err) {
            showNotification(err.message || 'Failed to fetch all users for selection.', 'error');
            console.error('Fetch all users error:', err);
        }
    }, [accessToken, isAdmin, showNotification]);

    useEffect(() => {
        if (!authLoading && accessToken) {
            fetchGroups();
            if (isAdmin) {
                fetchAllUsers();
            }
        }
    }, [accessToken, authLoading, isAdmin, fetchGroups, fetchAllUsers]);

    const handleUserSelect = (userId) => {
        setSelectedUserIds((prevSelected) => {
            if (prevSelected.includes(userId)) {
                return prevSelected.filter((id) => id !== userId);
            } else {
                return [...prevSelected, userId];
            }
        });
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) {
            showNotification('Group name cannot be empty.', 'error');
            return;
        }
        try {
            const createdGroup = await groupApi.createGroup({ name: newGroupName }, accessToken);
            showNotification(`Group "${createdGroup.name}" created successfully!`, 'success');

            if (selectedUserIds.length > 0) {
                let successCount = 0;
                let failCount = 0;
                for (const userId of selectedUserIds) {
                    try {
                        await groupApi.addUserToGroup(createdGroup.id, userId, accessToken);
                        successCount++;
                    } catch (addErr) {
                        showNotification(`Failed to add user ID ${userId} to group ${createdGroup.name}: ${addErr.message}`, 'warning', 5000);
                        console.error(`Error adding user ${userId} to group:`, addErr);
                        failCount++;
                    }
                }
                if (successCount > 0) {
                    showNotification(`${successCount} user(s) successfully added to "${createdGroup.name}".`, 'info');
                }
                if (failCount > 0) {
                    showNotification(`${failCount} user(s) failed to be added to "${createdGroup.name}". Check console for details.`, 'warning');
                }
            }

            fetchGroups();
            setNewGroupName('');
            setSelectedUserIds([]);
        } catch (err) {
            showNotification(err.message || 'Failed to create group.', 'error');
            console.error('Create group error:', err);
        }
    };

    const handleDeleteGroup = async (groupId, groupName) => {
        if (!window.confirm(`Are you sure you want to delete the group "${groupName}"? This action cannot be undone.`)) {
            return;
        }
        try {
            await groupApi.deleteGroup(groupId, accessToken);
            setGroups(groups.filter(group => group.id !== groupId));
            showNotification(`Group "${groupName}" deleted successfully.`, 'success');
        } catch (err) {
            showNotification(err.message || 'Failed to delete group.', 'error');
            console.error('Delete group error:', err);
        }
    };

    if (authLoading || loading) {
        return <div className="loading-spinner">Loading groups...</div>;
    }

    return (
        <div className="groups-container">
            <h1>Manage Groups</h1>

            {/* <--- ADD THIS WRAPPER DIV --- */}
            <div className="group-main-content">
                {isAdmin && (
                    <form onSubmit={handleCreateGroup} className="create-group-form">
                        <h3>Create New Group</h3>
                        <div className="form-group">
                            <label htmlFor="groupName">Group Name:</label>
                            <input
                                type="text"
                                id="groupName"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Users:</label>
                            <div className="user-selection-section">
                                {allUsers.length === 0 ? (
                                    <p>No users found.</p>
                                ) : (
                                    <div className="user-checkbox-list">
                                        {allUsers.map(user => (
                                            <div key={user.id} className="user-checkbox-item">
                                                <input
                                                    type="checkbox"
                                                    id={`user-${user.id}`}
                                                    value={user.id}
                                                    checked={selectedUserIds.includes(user.id)}
                                                    onChange={() => handleUserSelect(user.id)}
                                                    disabled={user.id === currentUser?.id}
                                                />
                                                <label htmlFor={`user-${user.id}`}>
                                                    {user.full_name || user.email} {user.id === currentUser?.id && '(You - Auto Added)'}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button type="submit">Create Group</button>
                    </form>
                )}

                <div className="group-list">
                    <h2>Existing Groups</h2>
                    {groups.length === 0 ? (
                        <p>No groups found. Create one above!</p>
                    ) : (
                        groups.map(group => (
                            <div key={group.id} className="group-item">
                                <Link to={`/groups/${group.id}`} className="group-name-link">
                                    {group.name}
                                </Link>
                                <div className="group-actions">
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDeleteGroup(group.id, group.name)}
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

export default GroupsPage;