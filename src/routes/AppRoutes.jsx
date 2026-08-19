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
import { ProtectedRoute } from './ProtectedRoute';

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
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageUsers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin/services" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageServices />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin/teams" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageTeams />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin/ratings" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageRatings />
            </ProtectedRoute>
          } 
        />

        

        
        <Route 
          path="user/create-ticket" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <CreateTicket />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="history" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'helpdesk', 'pegawai', 'user']}>
              <TicketHistory />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
