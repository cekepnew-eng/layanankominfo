import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const isMasyarakat = user.role?.toUpperCase() === 'MASYARAKAT'
    || (user.roles || []).some(role => String(role).toUpperCase() === 'MASYARAKAT');
  if (isMasyarakat && user.passwordChangeRequired && location.pathname !== '/dashboard/profile') {
    return <Navigate to="/dashboard/profile" replace />;
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
