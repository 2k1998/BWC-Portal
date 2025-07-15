// src/components/TaskForm.jsx
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { companyApi } from '../api/apiService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './TaskForm.css';

// A reusable form component for creating/editing tasks
function TaskForm({ onSubmit, initialData = {}, submitButtonText = "Submit" }) {
  const { accessToken, loading: authLoading } = useAuth?.() || {};
  const { showNotification } = useNotification?.() || {};

  // State for all form fields, initialized with optional initialData
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [startDate, setStartDate] = useState(initialData.startDate || null);
  const [deadline, setDeadline] = useState(initialData.deadline || null);
  const [isAllDay, setIsAllDay] = useState(initialData.isAllDay || false);
  const [isUrgent, setIsUrgent] = useState(initialData.isUrgent || false);
  const [isImportant, setIsImportant] = useState(initialData.isImportant || false);

  // Company selection state
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialData.company_id || '');
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Fetch companies on mount (if authenticated)
  useEffect(() => {
    if (!authLoading && accessToken) {
      setLoadingCompanies(true);
      companyApi.getAll(accessToken)
        .then(data => {
          setCompanies(data);
          setLoadingCompanies(false);
        })
        .catch(() => {
          showNotification && showNotification('Failed to load companies for task form.', 'error');
          setLoadingCompanies(false);
        });
    }
  }, [authLoading, accessToken, showNotification]);

  // Effect to auto-calculate the deadline when 'All Day' is checked
  useEffect(() => {
    if (isAllDay && startDate instanceof Date) {
      const newDeadline = new Date(startDate);
      newDeadline.setHours(23, 30, 0, 0); // Set time to 23:30
      setDeadline(newDeadline);
    }
  }, [startDate, isAllDay]);

  // Handles form submission by calling the passed `onSubmit` prop
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      showNotification && showNotification('You must select a company for the task.', 'warning');
      return;
    }
    // Consolidate form state into a single data object
    const taskData = {
      title,
      description,
      start_date: startDate ? startDate.toISOString() : null,
      deadline_all_day: isAllDay,
      deadline: deadline ? deadline.toISOString() : null,
      urgency: isUrgent,
      important: isImportant,
      company_id: parseInt(selectedCompanyId),
    };
    // Pass the data up to the parent component
    onSubmit(taskData);
  };

  return (
    <form onSubmit={handleSubmit} className="create-task-form">
      <h3>{submitButtonText}</h3>
      <div className="form-group">
        <label htmlFor="task-title">Title:</label>
        <input id="task-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="task-description">Description:</label>
        <textarea id="task-description" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
      </div>
      <div className="form-group">
        <label htmlFor="company">Company <span className="required">*</span></label>
        <select
          id="company"
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          required
          disabled={loadingCompanies}
        >
          <option value="" disabled>{loadingCompanies ? 'Loading...' : 'Select a company'}</option>
          {companies.map(company => (
            <option key={company.id} value={company.id}>{company.name}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Start Date:</label>
        <DatePicker
          selected={startDate}
          onChange={setStartDate}
          showTimeSelect
          timeFormat="HH:mm"
          dateFormat="dd/MM/yyyy HH:mm"
          className="custom-datepicker-input"
          placeholderText="Select date and time"
        />
      </div>
      <div className="form-group checkbox-group">
        <input type="checkbox" id="task-allDay" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} />
        <label htmlFor="task-allDay">All Day Deadline</label>
      </div>
      <div className="form-group">
        <label>Deadline:</label>
        <DatePicker
          selected={deadline}
          onChange={setDeadline}
          showTimeSelect
          timeFormat="HH:mm"
          dateFormat="dd/MM/yyyy HH:mm"
          className="custom-datepicker-input"
          placeholderText="Select date and time"
          disabled={isAllDay}
        />
      </div>
      <div className="form-group checkbox-group">
        <input type="checkbox" id="task-urgent" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
        <label htmlFor="task-urgent">Urgent</label>
      </div>
      <div className="form-group checkbox-group">
        <input type="checkbox" id="task-important" checked={isImportant} onChange={(e) => setIsImportant(e.target.checked)} />
        <label htmlFor="task-important">Important</label>
      </div>
      <button type="submit">{submitButtonText}</button>
    </form>
  );
}

export default TaskForm;