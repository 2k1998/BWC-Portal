// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { companyApi } from '../api/apiService';
import './Header.css';

function Header() {
    const { isAuthenticated, currentUser, logout, accessToken } = useAuth();
    const navigate = useNavigate();
    const isAdmin = currentUser?.role === "admin";

    // State to hold the list of companies
    const [companies, setCompanies] = useState([]);

    // This simplified effect fetches companies whenever the user's token changes.
    useEffect(() => {
        // If there's a token, the user is logged in, so fetch companies.
        if (accessToken) {
            companyApi.getAll(accessToken)
                .then(data => {
                    setCompanies(data);
                })
                .catch(err => {
                    console.error("Header: Failed to fetch companies", err);
                    setCompanies([]); // On error, ensure the list is empty.
                });
        } else {
            // If there's no token (user is logged out), clear the list.
            setCompanies([]);
        }
    }, [accessToken]); // This effect runs only when the accessToken changes.

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="app-header">
            <nav>
                <Link to="/dashboard" className="app-title">BWC Portal</Link>
                <div className="nav-links">
                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard">Dashboard</Link>
                            <Link to="/tasks">My Tasks</Link>
                            {/* --- NEW TOP-LEVEL LINK FOR EVENTS --- */}
                            <Link to="/events">Events</Link>
                            <div className="dropdown">
                                <button className="dropdown-toggle" onClick={() => navigate('/companies')}>
                                    Companies
                                </button>
                                <div className="dropdown-menu">
                                    {companies.length > 0 ? (
                                        companies.map(company => (
                                            <Link key={company.id} to={`/companies/${company.id}`}>{company.name}</Link>
                                        ))
                                    ) : (
                                        <span className="dropdown-item-disabled">No companies found</span>
                                    )}
                                    <div className="dropdown-divider"></div>
                                    <Link to="/companies">View All</Link>
                                    {isAdmin && <Link to="/companies/new">Add New Company</Link>}
                                </div>
                            </div>
                            
                            <Link to="/groups">Groups</Link>
                            
                            {isAdmin && (
                                <div className="dropdown">
                                    <button className="dropdown-toggle">Admin</button>
                                    <div className="dropdown-menu">
                                        <Link to="/users">Users</Link>
                                        <Link to="/admin-panel">Admin Panel</Link>
                                        <Link to="/events/new">Add New Event</Link>
                                    </div>
                                </div>
                            )}

                            <div className="dropdown">
                                <button className="dropdown-toggle profile-toggle">
                                    Hello, {currentUser?.first_name || currentUser?.email}!
                                </button>
                                <div className="dropdown-menu">
                                    <Link to="/profile">Profile</Link>
                                    <button onClick={handleLogout} className="logout-button-dropdown">Logout</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        // Render login/register links when not authenticated
                        <>
                            <Link to="/login">Login</Link>
                            <Link to="/register">Register</Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}

export default Header;

