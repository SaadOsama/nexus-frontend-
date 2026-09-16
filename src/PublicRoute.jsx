import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

// Usage: wrap /login and /signup with this
export default function PublicRoute({ children }) {
  const { isAuthenticated, user } = useSelector((state) => state.user);

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/overview'} replace />;
  }

  return children;
}
