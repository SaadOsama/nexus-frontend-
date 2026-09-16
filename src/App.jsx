import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';

// Shared Components & Auth
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
import ProtectedRoute from './ProtectedRoutes.jsx';
import PublicRoute from './PublicRoute.jsx';

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, token } = useSelector((state) => state.user);

  // App load hote hi DB se active unread counts fetch karne ke liye effect
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/messages/counts', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          // Direct dispatch without extra file imports
          dispatch({
            type: 'user/setBadgeCounts',
            payload: {
              unreadMessages: response.data.unreadMessages,
              pendingRequests: response.data.pendingRequests,
            }
          });
        }
      } catch (error) {
        console.error('❌ Error fetching badge counts:', error);
      }
    };

    if (isAuthenticated && token) {
      fetchBadgeCounts();
    }
  }, [isAuthenticated, token, dispatch]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

      {/* Admin Route */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminOverview />
          </ProtectedRoute>
        }
      />

      {/* Protected User Routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
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

      {/* Fallback Catch-all */}
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? (user?.role === 'admin' ? '/admin' : '/overview') : '/login'}
            replace
          />
        }
      />
    </Routes>
  );
}