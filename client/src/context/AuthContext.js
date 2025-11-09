import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Load user on mount if token exists
  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const res = await authAPI.me();
      setUser(res.data);
    } catch (error) {
      console.error('Error loading user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const res = await authAPI.login(username, password);

      const { token: newToken, user: userData } = res.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Login failed. Please check if the server is running.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Staff: Can upload, download, edit, delete calibrations (includes admin)
  const isStaff = () => {
    return user && (user.role === 'staff' || user.role === 'admin');
  };

  // Project Manager: Can edit and delete everything (includes admin)
  const isProjectManager = () => {
    return user && (user.role === 'project_manager' || user.role === 'admin');
  };

  // Admin: Has access to logs and control over everything
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isClient = () => {
    return user && user.role === 'client';
  };

  // Helper: Can manage calibrations (Staff, Project Manager, Admin)
  const canManageCalibrations = () => {
    return user && (user.role === 'staff' || user.role === 'project_manager' || user.role === 'admin');
  };

  // Helper: Can edit/delete projects and tests (Project Manager, Admin)
  const canManageProjects = () => {
    return user && (user.role === 'project_manager' || user.role === 'admin');
  };

  // Legacy support: Keep isFRAEmployee for backward compatibility (maps to staff + project_manager + admin)
  const isFRAEmployee = () => {
    return user && (user.role === 'staff' || user.role === 'project_manager' || user.role === 'admin');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      isFRAEmployee,
      isStaff,
      isProjectManager,
      isAdmin,
      isClient,
      canManageCalibrations,
      canManageProjects
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
