import axios from 'axios';

const API_URL = 'http://localhost:5000/api/audit';

export const auditAPI = {
  // Get all audit logs with filters
  getAll: (params = {}) => {
    return axios.get(API_URL, { params });
  },

  // Get audit logs for a specific entity
  getEntityLogs: (entityType, entityId) => {
    return axios.get(`${API_URL}/entity/${entityType}/${entityId}`);
  },

  // Get audit logs for a specific user
  getUserLogs: (userId, limit = 50) => {
    return axios.get(`${API_URL}/user/${userId}`, { params: { limit } });
  },

  // Get audit statistics
  getStats: (startDate, endDate) => {
    return axios.get(`${API_URL}/stats`, {
      params: { start_date: startDate, end_date: endDate }
    });
  }
};
