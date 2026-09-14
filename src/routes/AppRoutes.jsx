import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/landing/LandingPage';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Overview } from '../pages/dashboard/Overview';
import { ManageUsers } from '../pages/dashboard/ManageUsers';
import { ManageServices } from '../pages/dashboard/ManageServices';
import { ManageTeams } from '../pages/dashboard/ManageTeams';
import { ManageRatings } from '../pages/dashboard/ManageRatings';
import { TaskList } from '../pages/dashboard/TaskList';
import { CreateTicket } from '../pages/dashboard/CreateTicket';
import { MyTickets } from '../pages/dashboard/MyTickets';
import { TicketHistory } from '../pages/dashboard/TicketHistory';
import { Profile } from '../pages/dashboard/Profile';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

const HistoryWrapper = () => {
  const { user } = useAuth();
  if (user?.role === 'USER') {
    return <MyTickets />;
  }
  return <TicketHistory />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        
        <Route 
          path="admin/users" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ManageUsers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin/services" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ManageServices />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin/teams" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ManageTeams />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin/ratings" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ManageRatings />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="user/create-ticket" 
          element={
            <ProtectedRoute allowedRoles={['USER', 'HELPDESK']}>
              <CreateTicket />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="history" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HELPDESK', 'PEGAWAI', 'USER']}>
              <HistoryWrapper />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="profile" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HELPDESK', 'PEGAWAI', 'USER']}>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
