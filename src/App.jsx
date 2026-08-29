import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Shared Components & Auth (Exact File Casing)
import Layout from './components/shared/layout.jsx';
import Login from './components/Auth/login.jsx';
import Signup from './components/Auth/Signup.jsx';

// Pages
import HomePage from '../pages/Homepage/homepage.jsx';
import Overview from '../pages/user/Overview/Overview.jsx';
import Discover from '../pages/user/Discover/Discover.jsx';
import ProjectList from '../pages/user/MyProjects/ProjectList.jsx';
import Dashboard from '../pages/user/Dashboard/Dashboard.jsx';
import Messages from '../pages/user/Messages/Messages.jsx';
import Profile from '../pages/user/Profile/Profile.jsx';
import Notifications from '../pages/user/Notifications/Notifications.jsx';
import CollaborationRequests from '../pages/user/CollaborationRequests/CollaborationRequests.jsx';
import SavedProjects from '../pages/user/SavedProjects/SavedProjects.jsx';
import AdminOverview from '../pages/user/AdminOverview/AdminOverview.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} /> 
      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<AdminOverview />} />

      <Route element={<Layout />}>
        <Route path="/user" element={<Overview />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/my-projects" element={<ProjectList />} />
        <Route path="/saved-projects" element={<SavedProjects />} />
        <Route path="/requests" element={<CollaborationRequests />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}