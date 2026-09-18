import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('spbe_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role) parsed.role = parsed.role;
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('spbe_user', JSON.stringify(user));
      const role = user.role?.toUpperCase();
      if (role === 'ADMIN' || role === 'HELPDESK') {
        fetchTeams();
      }
    } else {
      localStorage.removeItem('spbe_user');
      localStorage.removeItem('spbe_token');
    }
  }, [user]);

  const fetchTeams = async () => {
    try {
      const res = await api.getTeams();
      if (res.success) {
        setTeams(res.data);
      }
    } catch (e) {
      console.error('Error fetching teams:', e);
    }
  };

  const login = async (email, password, captchaToken, captchaAnswer) => {
    try {
      const response = await api.login(email, password, captchaToken, captchaAnswer);

      if (response.success && (response.requires2FA || response.requires2FASetup)) {
        return response;
      }
      if (response.success) {
        const token = response.token || localStorage.getItem('spbe_token');
        if (token) {
          localStorage.setItem('spbe_token', token);
        }
        const userData = response.user || { id: null, email: '', name: '', role: 'USER', roles: ['USER'] };
        if (userData && userData.role) {
          userData.role = String(userData.role).toUpperCase();
        }
        if (userData && userData.roles) {
          userData.roles = userData.roles.map((role) => String(role).toUpperCase());
        }
        setUser(userData);
        localStorage.setItem('spbe_user', JSON.stringify(userData));
        return { success: true, token, user: userData };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const login2FA = async (tempToken, otp) => {
    try {
      const response = await api.login2FA(tempToken, otp);
      if (response.success) {
        localStorage.setItem('spbe_token', response.token);
        const userData = response.user;
        if (userData && userData.role) {
          userData.role = userData.role;
        }
        setUser(userData);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const register = async (payload) => {
    try {
      const response = await api.register(payload);
      return response;
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('spbe_user');
    localStorage.removeItem('spbe_token');
    window.location.href = '/auth/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, setUser, login, login2FA, register, logout,
      tickets: [], setTickets: () => {},
      services: [], setServices: () => {},
      users: [], setUsers: () => {},
      teams, setTeams, fetchTeams,
      ratings: [], setRatings: () => {}
    }}>
      {children}
    </AuthContext.Provider>
  );
};
