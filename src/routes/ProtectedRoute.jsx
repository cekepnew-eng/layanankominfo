import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles) {
    const userRole = user.role?.toUpperCase();
    const userRoles = (user.roles || []).map(r => String(r).toUpperCase());
    const isAllowed = allowedRoles.some(r => r.toUpperCase() === userRole || userRoles.includes(r.toUpperCase()));
    if (!isAllowed) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};
