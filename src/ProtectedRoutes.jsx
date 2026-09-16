import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  // 1. Redux State
  const reduxAuth = useSelector((state) => state.user?.isAuthenticated);

  // 2. Direct Sync LocalStorage Check (No Delay)
  const token = localStorage.getItem('nexus_token');
  const hasToken = Boolean(
    token && 
    token !== 'undefined' && 
    token !== 'null' && 
    token.trim() !== ''
  );

  // Debugger to trace in Console
  console.log('[ProtectedRoute Check]', { reduxAuth, hasToken, token });

  // Agar Redux State true ho YA Direct LocalStorage me valid token pada ho, access allow karein
  if (reduxAuth || hasToken) {
    return children;
  }

  // Otherwise login par redirect
  return <Navigate to="/login" replace state={{ from: location }} />;
}