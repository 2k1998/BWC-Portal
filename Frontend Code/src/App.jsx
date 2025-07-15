import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'react-datepicker/dist/react-datepicker.css'; // <-- Add this line

import './App.css'
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';
import AdminPanelPage from './pages/AdminPanelPage';
import Header from './components/Header';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationContainer from './components/NotificationContainer';
import CompaniesPage from './pages/CompaniesPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import NewCompanyPage from './pages/NewCompanyPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AddEventPage from './pages/AddEventPage'; // <-- Import the new page
import EventsPage from './pages/EventsPage'; // <-- Import the new page


// --- THE FIX: A more robust PrivateRoute ---
// This component now waits for the loading to finish AND ensures a user object exists
// before rendering the protected content. This prevents the "stuck on loading" issue.
const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    // This is the primary loading indicator for the entire authenticated app.
    return <div className="loading-spinner">Authenticating...</div>;
  }

  // If loading is finished, check if we have a user.
  // If yes, show the page. If no, redirect to login.
  return currentUser ? children : <Navigate to="/login" />;
};


// PublicOnlyRoute component (no changes needed)
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <Header />
          <main>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />
               <Route
                path="/forgot-password"
                element={
                  <PublicOnlyRoute>
                    <ForgotPasswordPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <RegisterPage />
                  </PublicOnlyRoute>
                }
              />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
              <Route path="/tasks" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
              <Route path="/groups" element={<PrivateRoute><GroupsPage /></PrivateRoute>} />
              <Route path="/groups/:groupId" element={<PrivateRoute><GroupDetailPage /></PrivateRoute>} />
              <Route path="/users" element={<PrivateRoute><UsersPage /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              <Route path="/admin-panel" element={<PrivateRoute><AdminPanelPage /></PrivateRoute>} />
              <Route path="/companies" element={<PrivateRoute><CompaniesPage /></PrivateRoute>} />
              <Route path="/companies/new" element={<PrivateRoute><NewCompanyPage /></PrivateRoute>} />
              <Route path="/companies/:companyId" element={<PrivateRoute><CompanyDetailPage /></PrivateRoute>} />
              {/* --- NEW EVENTS ROUTES --- */}
              <Route path="/events" element={<PrivateRoute><EventsPage /></PrivateRoute>} />
              <Route path="/events/new" element={<PrivateRoute><AddEventPage /></PrivateRoute>} />
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" />} />

              {/* 404 Not Found Route */}
              <Route path="*" element={
                <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5em' }}>
                  <h2>404 - Page Not Found</h2>
                  <p>The page you are looking for does not exist.</p>
                </div>
              } />
            </Routes>
          </main>
          <NotificationContainer />
        </AuthProvider>
      </NotificationProvider>
    </Router>
  )
}

export default App
