import axios from 'axios';

// Create axios instance with auth interceptors (same as api.js)
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auditAPI = {
  // Get all audit logs with filters
  getAll: (params = {}) => {
    return api.get('/audit', { params });
  },

  // Get audit logs for a specific entity
  getEntityLogs: (entityType, entityId) => {
    return api.get(`/audit/entity/${entityType}/${entityId}`);
  },

  // Get audit logs for a specific user
  getUserLogs: (userId, limit = 50) => {
    return api.get(`/audit/user/${userId}`, { params: { limit } });
  },

  // Get audit statistics
  getStats: (startDate, endDate) => {
    return api.get(`/audit/stats`, {
      params: { start_date: startDate, end_date: endDate }
    });
  }
};
