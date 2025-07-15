// src/pages/AdminPanelPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/apiService'; // For fetching all users and management actions
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/Modal'; // For confirmation/editing modals
import './AdminPanel.css'; // Custom styles for the admin panel

function AdminPanelPage() {
    const { accessToken, currentUser, loading: authLoading } = useAuth();
    const { showNotification } = useNotification();
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchTrigger, setSearchTrigger] = useState(0);

    // State for Modals
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null); // The user being acted upon
    const [newRole, setNewRole] = useState(''); // State for new role in modal

    // Check if current user is an admin
    const isAdmin = currentUser?.role === "admin";

    const fetchUsers = useCallback(async () => {
        if (!accessToken || !isAdmin) return; // Only fetch if authenticated AND admin
        setLoadingUsers(true);
        try {
            // Use the existing listAllUsers endpoint, which supports search
            const fetchedUsers = await authApi.listAllUsers(accessToken, searchQuery);
            setUsers(fetchedUsers);
        } catch (err) {
            showNotification(err.message || 'Failed to fetch users.', 'error');
            console.error('Fetch users error:', err);
        } finally {
            setLoadingUsers(false);
        }
    }, [accessToken, isAdmin, searchQuery, showNotification]);

    // Effect to fetch users on component mount or search/token changes
    useEffect(() => {
        if (!authLoading && accessToken) {
            if (!isAdmin) { // If not admin, deny access immediately
                showNotification("Access Denied: You are not authorized to view the Admin Panel.", "error");
                setLoadingUsers(false);
                return;
            }
            fetchUsers();
        }
    }, [accessToken, authLoading, isAdmin, fetchUsers, searchTrigger]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setSearchTrigger(prev => prev + 1);
        }
    };

    const handleSearchButtonClick = () => {
        setSearchTrigger(prev => prev + 1);
    };

    // --- Action Handlers for Users ---
    const openRoleModal = (user) => {
        setSelectedUser(user);
        setNewRole(user.role); // Pre-fill with current role
        setIsRoleModalOpen(true);
    };

    const closeRoleModal = () => {
        setIsRoleModalOpen(false);
        setSelectedUser(null);
        setNewRole('');
    };

    const handleUpdateRole = async () => {
        if (!selectedUser || !newRole) return;
        if (selectedUser.id === currentUser?.id) {
            showNotification("Cannot change your own role via this panel.", "warning");
            closeRoleModal();
            return;
        }
        try {
            const updatedUser = await authApi.updateUserRole(selectedUser.id, { role: newRole }, accessToken);
            showNotification(`User ${updatedUser.email}'s role updated to ${updatedUser.role}.`, 'success');
            fetchUsers(); // Re-fetch to update list
            closeRoleModal();
        } catch (err) {
            showNotification(err.message || 'Failed to update role.', 'error');
            console.error('Update role error:', err);
        }
    };

    const handleToggleStatus = async (user) => {
        if (user.id === currentUser?.id) {
            showNotification("Cannot change your own active status via this panel.", "warning");
            return;
        }
        if (!window.confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} user ${user.email}?`)) {
            return;
        }
        try {
            const updatedUser = await authApi.updateUserStatus(user.id, { is_active: !user.is_active }, accessToken);
            showNotification(`User ${updatedUser.email} is now ${updatedUser.is_active ? 'active' : 'inactive'}.`, 'success');
            fetchUsers(); // Re-fetch to update list
        } catch (err) {
            showNotification(err.message || 'Failed to update status.', 'error');
            console.error('Update status error:', err);
        }
    };

    const openConfirmDeleteModal = (user) => {
        setSelectedUser(user);
        setIsConfirmDeleteModalOpen(true);
    };

    const closeConfirmDeleteModal = () => {
        setIsConfirmDeleteModalOpen(false);
        setSelectedUser(null);
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        if (selectedUser.id === currentUser?.id) {
            showNotification("Cannot delete your own account via this panel.", "warning");
            closeConfirmDeleteModal();
            return;
        }
        try {
            await authApi.deleteUser(selectedUser.id, accessToken);
            showNotification(`User ${selectedUser.email} deleted successfully.`, 'success');
            fetchUsers(); // Re-fetch to update list
            closeConfirmDeleteModal();
        } catch (err) {
            showNotification(err.message || 'Failed to delete user.', 'error');
            console.error('Delete user error:', err);
        }
    };
    // --- End Action Handlers ---


    if (authLoading || !isAdmin) { // Show loading or access denied if not admin
        return <div className="loading-spinner">Access Denied: Loading or not authorized.</div>;
    }

    if (loadingUsers) {
        return <div className="loading-spinner">Loading users for Admin Panel...</div>;
    }

    return (
        <div className="admin-panel-container">
            <h1>Admin Panel - User Management</h1>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search users by email or name..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                />
                <button onClick={handleSearchButtonClick}>Search</button>
            </div>

            <div className="user-management-table-wrapper">
                {users.length === 0 ? (
                    <p>No users found matching your criteria.</p>
                ) : (
                    <table className="user-management-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Email</th>
                                <th>First Name</th>
                                <th>Surname</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className={user.is_active ? '' : 'inactive-user'}>
                                    <td>{user.id}</td>
                                    <td>{user.email}</td>
                                    <td>{user.first_name || 'N/A'}</td>
                                    <td>{user.surname || 'N/A'}</td>
                                    <td>{user.role}</td>
                                    <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                                    <td>
                                        <button onClick={() => openRoleModal(user)} className="action-button edit-role-button">Edit Role</button>
                                        <button
                                            onClick={() => handleToggleStatus(user)}
                                            className={`action-button toggle-status-button ${user.is_active ? 'deactivate' : 'activate'}`}
                                        >
                                            {user.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button onClick={() => openConfirmDeleteModal(user)} className="action-button delete-button">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Role Edit Modal */}
            <Modal
                isOpen={isRoleModalOpen}
                onClose={closeRoleModal}
                title={`Edit Role for ${selectedUser?.email}`}
                showConfirmButton={false} // We'll have custom buttons in the footer
                message={
                    selectedUser && (
                        <div className="modal-form-content">
                            <label>New Role:</label>
                            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                                <option value="user">user</option>
                                <option value="admin">admin</option>
                            </select>
                        </div>
                    )
                }
                footer={
                    <div>
                        <button onClick={handleUpdateRole} className="modal-confirm-button">Update Role</button>
                        <button onClick={closeRoleModal} className="modal-cancel-button">Cancel</button>
                    </div>
                }
            />

            {/* Confirm Delete Modal */}
            <Modal
                isOpen={isConfirmDeleteModalOpen}
                onClose={closeConfirmDeleteModal}
                title="Confirm Deletion"
                message={`Are you sure you want to delete user ${selectedUser?.email}? This action cannot be undone.`}
                onConfirm={handleDeleteUser}
                confirmText="Delete Permanently"
                cancelText="Cancel"
            />
        </div>
    );
}

export default AdminPanelPage;