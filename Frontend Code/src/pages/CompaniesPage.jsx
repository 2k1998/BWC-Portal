// src/pages/CompaniesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { companyApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import './Companies.css';

function CompaniesPage() {
    const { accessToken, currentUser } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    const isAdmin = currentUser?.role === "admin";

    const fetchCompanies = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const fetchedCompanies = await companyApi.getAll(accessToken);
            setCompanies(fetchedCompanies);
        } catch (err) {
            showNotification(err.message || 'Failed to fetch companies.', 'error');
        } finally {
            setLoading(false);
        }
    }, [accessToken, showNotification]);

    useEffect(() => {
        if (accessToken) {
            fetchCompanies();
        } else {
            setLoading(false);
        }
    }, [accessToken, fetchCompanies]);

    const handleCompanyClick = (companyId) => {
        navigate(`/companies/${companyId}`);
    };

    const handleDeleteCompany = async (companyId, companyName) => {
        if (!window.confirm(`Are you sure you want to delete "${companyName}"?`)) return;
        try {
            await companyApi.delete(companyId, accessToken);
            showNotification('Company deleted successfully!', 'success');
            fetchCompanies(); // Refresh the list
        } catch (err) {
            showNotification(err.message || 'Failed to delete company.', 'error');
        }
    };

    if (loading) {
        return <div className="loading-spinner">Loading companies...</div>;
    }

    return (
        <div className="companies-container">
            <div className="companies-header">
                <h1>Companies</h1>
                {isAdmin && (
                    <button 
                        onClick={() => navigate('/companies/new')}
                        className="add-company-button"
                    >
                        Add New Company
                    </button>
                )}
            </div>

            <div className="companies-grid">
                {companies.length === 0 ? (
                    <div className="no-companies">
                        <h3>No companies have been registered yet.</h3>
                        {isAdmin && <p>Click "Add New Company" to get started.</p>}
                    </div>
                ) : (
                    companies.map(company => (
                        <div 
                            key={company.id} 
                            className="company-card"
                            onClick={() => handleCompanyClick(company.id)}
                        >
                            <div className="company-card-content">
                                <h3>{company.name}</h3>
                                <div className="company-details">
                                    {company.vat_number && <p><strong>VAT:</strong> {company.vat_number}</p>}
                                    {company.occupation && <p><strong>Occupation:</strong> {company.occupation}</p>}
                                    {/* --- THE FIX: Only render the date if it exists --- */}
                                    {company.creation_date && (
                                        <p><strong>Created:</strong> {new Date(company.creation_date).toLocaleDateString()}</p>
                                    )}
                                </div>
                            </div>
                            {isAdmin && (
                                <div className="company-actions">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent navigation
                                            handleDeleteCompany(company.id, company.name);
                                        }}
                                        className="delete-button"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default CompaniesPage;
