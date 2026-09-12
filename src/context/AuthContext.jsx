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
        if (parsed && parsed.role) parsed.role = parsed.role.toLowerCase();
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('spbe_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('spbe_user');
      localStorage.removeItem('spbe_token');
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      if (response.success) {
        localStorage.setItem('spbe_token', response.token);
        const userData = response.user;
        if (userData && userData.role) {
          userData.role = userData.role.toLowerCase();
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
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, login, register, logout,
      tickets: [], setTickets: () => {},
      services: [], setServices: () => {},
      users: [], setUsers: () => {},
      teams: [], setTeams: () => {},
      ratings: [], setRatings: () => {}
    }}>
      {children}
    </AuthContext.Provider>
  );
};
