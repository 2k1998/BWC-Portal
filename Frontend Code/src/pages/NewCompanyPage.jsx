import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { companyApi } from '../api/apiService';

function NewCompanyPage() {
    const [companyName, setCompanyName] = useState('');
    const [vatNumber, setVatNumber] = useState('');
    const [occupation, setOccupation] = useState('');
    const [creationDate, setCreationDate] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const { accessToken } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Send null if vatNumber is empty, otherwise send the value
        const companyData = {
            name: companyName,
            vat_number: vatNumber || null,
            occupation,
            creation_date: creationDate,
            description
        };

        try {
            await companyApi.create(companyData, accessToken);
            showNotification('Company registered successfully!', 'success');
            navigate('/companies'); // Navigate to the companies list page
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Register New Company</h2>
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="companyName">Company Name</label>
                    <input 
                        id="companyName" 
                        type="text" 
                        value={companyName} 
                        onChange={(e) => setCompanyName(e.target.value)} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="vatNumber">VAT Number (ΑΦΜ)</label>
                    <input 
                        id="vatNumber" 
                        type="text" 
                        value={vatNumber} 
                        onChange={(e) => setVatNumber(e.target.value)} 
                        // The 'required' attribute has been removed from this line
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="occupation">Occupation</label>
                    <input 
                        id="occupation" 
                        type="text" 
                        value={occupation} 
                        onChange={(e) => setOccupation(e.target.value)} 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="creationDate">Creation Day</label>
                    <input 
                        id="creationDate" 
                        type="date" 
                        value={creationDate} 
                        onChange={(e) => setCreationDate(e.target.value)} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea 
                        id="description" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        rows="4" 
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
        </div>
    );
}

export default NewCompanyPage;
