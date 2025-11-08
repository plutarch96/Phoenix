import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Tests API
export const testsAPI = {
  getAll: (params) => api.get('/tests', { params }),
  getById: (id) => api.get(`/tests/${id}`),
  create: (data) => api.post('/tests', data),
  update: (id, data) => api.put(`/tests/${id}`, data),
  delete: (id) => api.delete(`/tests/${id}`),
  addCalibration: (testId, calibrationId) =>
    api.post(`/tests/${testId}/calibrations`, { calibration_id: calibrationId }),
  removeCalibration: (testId, calibrationId) =>
    api.delete(`/tests/${testId}/calibrations/${calibrationId}`),
};

// Calibrations API
export const calibrationsAPI = {
  getAll: (params) => api.get('/calibrations', { params }),
  getById: (id) => api.get(`/calibrations/${id}`),
  create: (formData) => api.post('/calibrations', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/calibrations/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/calibrations/${id}`),
  search: (query) => api.get(`/calibrations/search/${query}`),
};

// Clients API
export const clientsAPI = {
  getAll: () => api.get('/clients'),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

// Media API
export const mediaAPI = {
  getByTest: (testId) => api.get(`/media/test/${testId}`),
  getByTestAndType: (testId, mediaType) => api.get(`/media/test/${testId}/type/${mediaType}`),
  upload: (formData) => api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/media/${id}`, data),
  delete: (id) => api.delete(`/media/${id}`),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getTestTrends: (period) => api.get('/analytics/trends/tests', { params: { period } }),
  getPopularTags: () => api.get('/analytics/tags/popular'),
  getAllTags: () => api.get('/analytics/tags'),
  getClientStats: () => api.get('/analytics/clients/stats'),
  getRecentActivity: (limit) => api.get('/analytics/activity/recent', { params: { limit } }),
};

export default api;
