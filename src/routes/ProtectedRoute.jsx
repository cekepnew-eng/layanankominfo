import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [clock, setClock] = useState(Date.now());

  const expiryTimestamp = user?.passwordExpiresAt ? new Date(user.passwordExpiresAt).getTime() : null;
  useEffect(() => {
    if (expiryTimestamp === null || Number.isNaN(expiryTimestamp)) return undefined;
    const remaining = expiryTimestamp - Date.now();
    if (remaining <= 0) return undefined;
    const delay = Math.min(remaining, 24 * 60 * 60 * 1000);
    const timer = window.setTimeout(() => setClock(Date.now()), delay);
    return () => window.clearTimeout(timer);
  }, [expiryTimestamp, clock]);

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const passwordChangeRequired = user.passwordChangeRequired ||
    (expiryTimestamp !== null && !Number.isNaN(expiryTimestamp) && clock >= expiryTimestamp);
  if (passwordChangeRequired && location.pathname !== '/dashboard/profile') {
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
