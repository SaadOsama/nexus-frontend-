import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

// Wrap any route that must never render — not even for a flash — without a
// logged-in user. This is what satisfies requirement #4: typing a project
// URL directly, with no session, must redirect to login instead of showing
// data first and reacting after the API call fails.
//
// Usage in your router:
//   <Route path="/projects" element={
//     <ProtectedRoute><ProjectList /></ProtectedRoute>
//   } />
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const token = useSelector((state) => state.user.token) || localStorage.getItem('iccd_token');

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
