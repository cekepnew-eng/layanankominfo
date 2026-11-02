import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

const normalizeUser = (userData, refreshProfileImage = false) => {
  if (!userData) return userData;
  return {
    ...userData,
    name: userData.name || userData.full_name || '',
    profileImageCacheVersion: refreshProfileImage
      ? Date.now().toString(36)
      : userData.profileImageCacheVersion || Date.now().toString(36)
  };
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('spbe_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role) parsed.role = parsed.role;
        return normalizeUser(parsed);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('spbe_user', JSON.stringify(user));
      const role = user.role?.toUpperCase();
      if (role === 'ADMIN' || role === 'HELPDESK') {
        fetchTeams();
      }
    } else {
      sessionStorage.removeItem('spbe_user');
      sessionStorage.removeItem('spbe_token');
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
      const trustedDeviceToken = localStorage.getItem('spbe_trusted_device');
      const response = await api.login(email, password, captchaToken, captchaAnswer, trustedDeviceToken);

      if (response.success && (response.requires2FA || response.requires2FASetup || response.requires2FAChoice)) {
        return response;
      }
      if (response.success) {
        const token = response.token || sessionStorage.getItem('spbe_token');
        if (token) {
          sessionStorage.setItem('spbe_token', token);
        }
        if (response.requiresUserAgreement) {
          sessionStorage.setItem('spbe_user_agreement_pending', 'true');
          return {
            success: true,
            requiresUserAgreement: true,
            token,
            user: response.user
          };
        }
        sessionStorage.removeItem('spbe_user_agreement_pending');
        const userData = normalizeUser(response.user || { id: null, email: '', name: '', role: 'USER', roles: ['USER'] }, true);
        if (userData && userData.role) {
          userData.role = String(userData.role).toUpperCase();
        }
        if (userData && userData.roles) {
          userData.roles = userData.roles.map((role) => String(role).toUpperCase());
        }
        setUser(userData);
        sessionStorage.setItem('spbe_user', JSON.stringify(userData));
        return { success: true, token, user: userData };
      }
    } catch (err) {
      return { 
        success: false, 
        message: err.message, 
        isOldPassword: Boolean(err.isOldPassword || err.data?.isOldPassword),
        isLoginLocked: Boolean(err.data?.isLoginLocked),
        retryAfterSeconds: Number(err.data?.retryAfterSeconds) || 0
      };
    }
  };

  const login2FA = async (tempToken, otp, trustDevice = false) => {
    try {
      const response = await api.login2FA(tempToken, otp, trustDevice);
      if (response.success) {
        sessionStorage.setItem('spbe_token', response.token);
        if (response.requiresUserAgreement) {
          sessionStorage.setItem('spbe_user_agreement_pending', 'true');
          if (response.trustedDeviceToken) {
            localStorage.setItem('spbe_trusted_device', response.trustedDeviceToken);
          }
          return { success: true, requiresUserAgreement: true };
        }
        sessionStorage.removeItem('spbe_user_agreement_pending');
        if (response.trustedDeviceToken) {
          localStorage.setItem('spbe_trusted_device', response.trustedDeviceToken);
        }
        const userData = normalizeUser(response.user, true);
        if (userData && userData.role) {
          userData.role = String(userData.role).toUpperCase();
        }
        if (userData && userData.roles) {
          userData.roles = userData.roles.map(role => String(role).toUpperCase());
        }
        setUser(userData);
        return { success: true, requiresUserAgreement: false };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const acceptUserAgreement = async () => {
    try {
      const response = await api.acceptUserAgreement();
      const userData = normalizeUser(response.user, true);
      if (userData?.role) userData.role = String(userData.role).toUpperCase();
      if (userData?.roles) {
        userData.roles = userData.roles.map(role => String(role).toUpperCase());
      }
      sessionStorage.setItem('spbe_token', response.token);
      sessionStorage.removeItem('spbe_user_agreement_pending');
      setUser(userData);
      sessionStorage.setItem('spbe_user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Persetujuan tidak dapat disimpan.' };
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

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Failed to record logout activity:', error);
    } finally {
      setUser(null);
      sessionStorage.removeItem('spbe_user');
      sessionStorage.removeItem('spbe_token');
      sessionStorage.removeItem('spbe_user_agreement_pending');
      window.location.href = '/auth/login';
    }
  };

  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const svcRes = await api.getPublicServices();
        const mappedServices = (svcRes.data || []).map(s => ({
          ...s,
          requiredDocs: s.required_docs || s.requiredDocs,
          sop: s.sop_link || s.sop
        }));
        setServices(mappedServices);
      } catch (err) {
        console.error('Failed to fetch services in AuthContext', err);
      }
    };
    fetchServices();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, setUser, login, login2FA, acceptUserAgreement, register, logout,
      tickets: [], setTickets: () => {},
      services, setServices,
      users: [], setUsers: () => {},
      teams, setTeams, fetchTeams,
      ratings: [], setRatings: () => {}
    }}>
      {children}
    </AuthContext.Provider>
  );
};
