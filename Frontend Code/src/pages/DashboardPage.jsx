// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { calendarApi, taskApi, eventApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import addMonths from 'date-fns/addMonths';
import subMonths from 'date-fns/subMonths';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import EventModal from '../components/EventModal';
import './CalendarDashboard.css';
import './DashboardTasks.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

function DashboardPage() {
    const { currentUser, accessToken, loading: authLoading } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [calendarEvents, setCalendarEvents] = useState([]);
    const [allMyTasks, setAllMyTasks] = useState([]);
    const [loadingContent, setLoadingContent] = useState(true);
    const [upcomingEvent, setUpcomingEvent] = useState(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    
    // --- RESTORED: State for calendar controls ---
    const [currentView, setCurrentView] = useState('month');
    const [currentDate, setCurrentDate] = useState(new Date());

    const isAdmin = currentUser?.role === "admin";

    const fetchDashboardData = useCallback(async () => {
        if (!accessToken) return;
        setLoadingContent(true);
        try {
            const [calEvents, tasks, event] = await Promise.all([
                calendarApi.getCalendarEvents(accessToken),
                taskApi.getTasks(accessToken),
                !isAdmin ? eventApi.getUpcomingEvent(accessToken) : Promise.resolve(null)
            ]);

            const formattedEvents = calEvents.map(ev => ({
                title: ev.title,
                start: new Date(ev.start),
                end: new Date(ev.end),
                allDay: ev.allDay,
                resource: ev
            }));
            setCalendarEvents(formattedEvents);
            setAllMyTasks(tasks);

            if (event) {
                setUpcomingEvent(event);
                setIsEventModalOpen(true);
            }
        } catch (err) {
            showNotification(err.message || 'Failed to load dashboard content.', 'error');
        } finally {
            setLoadingContent(false);
        }
    }, [accessToken, showNotification, isAdmin]);

    useEffect(() => {
        if (!authLoading && accessToken) {
            fetchDashboardData();
        }
    }, [authLoading, accessToken, fetchDashboardData]);
    
    // --- RESTORED: Handlers for calendar navigation ---
    const handleNavigate = useCallback((newDate) => {
        setCurrentDate(newDate);
    }, []);

    const handleViewChange = useCallback((newView) => {
        setCurrentView(newView);
    }, []);


    const categorizeTasks = (tasks) => {
        const categorized = {
            urgentImportant: [], urgentOnly: [], importantOnly: [], normal: [], allDayDeadline: []
        };
        if (!tasks || !Array.isArray(tasks)) return categorized;
        const activeTasks = tasks.filter(task => !task.completed);
        activeTasks.forEach(task => {
            if (task.deadline_all_day) categorized.allDayDeadline.push(task);
            else if (task.urgency && task.important) categorized.urgentImportant.push(task);
            else if (task.urgency) categorized.urgentOnly.push(task);
            else if (task.important) categorized.importantOnly.push(task);
            else categorized.normal.push(task);
        });
        return categorized;
    };

    const categorizedTasks = categorizeTasks(allMyTasks);

    const renderTaskListCard = (tasks, title, categoryClass) => (
        <div className={`task-category-card ${categoryClass}`}>
            <h3>{title} ({tasks.length})</h3>
            {tasks.length === 0 ? (
                <p>No tasks in this category.</p>
            ) : (
                <ul className="task-category-list">
                    {tasks.map(task => (
                        <li key={task.id} className="task-category-list-item">
                            <span className="task-category-title">{task.title}</span>
                            {task.deadline && <span className="task-category-deadline"> (Due: {format(new Date(task.deadline), 'PP')})</span>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    if (authLoading || loadingContent) {
        return <div className="loading-spinner">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard-container">
            <EventModal 
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                event={upcomingEvent}
            />

            <h1 className="welcome-message">Welcome, {currentUser?.first_name || "User"}!</h1>
            <p className="dashboard-intro">This is your dashboard. See upcoming events and tasks below.</p>

            <div className="dashboard-grid-container">
                {renderTaskListCard(categorizedTasks.urgentImportant, 'Urgent & Important', 'red-category')}
                {renderTaskListCard(categorizedTasks.urgentOnly, 'Urgent', 'blue-category')}
                {renderTaskListCard(categorizedTasks.importantOnly, 'Important', 'green-category')}
                {renderTaskListCard(categorizedTasks.normal, 'Not Urgent, Not Important', 'yellow-category')}
                {renderTaskListCard(categorizedTasks.allDayDeadline, 'All Day Deadlines', 'orange-category')}
                
                <div className="dashboard-calendar-wrapper">
                    {/* --- RESTORED: Custom Toolbar JSX --- */}
                    <div className="custom-month-navigation">
                        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="nav-arrow-button">&lt;</button>
                        <span className="current-month-display">{format(currentDate, 'MMMM yyyy')}</span>
                        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="nav-arrow-button">&gt;</button>
                        <button onClick={() => setCurrentDate(new Date())} className="nav-today-button">Today</button>
                    </div>
                    <div className="custom-calendar-toolbar">
                        <button onClick={() => handleViewChange('month')} className={currentView === 'month' ? 'active' : ''}>Month</button>
                        <button onClick={() => handleViewChange('week')} className={currentView === 'week' ? 'active' : ''}>Week</button>
                        <button onClick={() => handleViewChange('day')} className={currentView === 'day' ? 'active' : ''}>Day</button>
                        <button onClick={() => handleViewChange('agenda')} className={currentView === 'agenda' ? 'active' : ''}>Agenda</button>
                    </div>
                    
                    <Calendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 500 }}
                        // --- RESTORED: Props for controlled navigation ---
                        view={currentView}
                        date={currentDate}
                        onNavigate={handleNavigate}
                        onView={handleViewChange}
                    />
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;

