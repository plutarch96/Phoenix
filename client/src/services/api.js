import axios from 'axios';

// Use relative URL in development to work with React proxy
// In production, set REACT_APP_API_URL to the full backend URL
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

// Tests API
export const testsAPI = {
  getAll: (params) => api.get('/tests', { params }),
  getById: (id, userId) => api.get(`/tests/${id}`, { params: { user_id: userId } }),
  create: (data) => api.post('/tests', data),
  update: (id, data) => api.put(`/tests/${id}`, data),
  delete: (id) => api.delete(`/tests/${id}`),
  addCalibration: (testId, calibrationId) =>
    api.post(`/tests/${testId}/calibrations`, { calibration_id: calibrationId }),
  removeCalibration: (testId, calibrationId) =>
    api.delete(`/tests/${testId}/calibrations/${calibrationId}`),
  // User test tagging
  tagTest: (testId, userId) =>
    api.post(`/tests/${testId}/tag`, { user_id: userId }),
  untagTest: (testId, userId) =>
    api.delete(`/tests/${testId}/tag`, { data: { user_id: userId } }),
  getTaggedByUser: (userId) =>
    api.get(`/tests/user/${userId}/tagged`),
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

// Projects API
export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getNextTestNumber: (id) => api.get(`/projects/${id}/next-test-number`),
  // User project tagging
  tagProject: (projectId, userId) =>
    api.post(`/projects/${projectId}/tag`, { user_id: userId }),
  untagProject: (projectId, userId) =>
    api.delete(`/projects/${projectId}/tag`, { data: { user_id: userId } }),
  getTaggedByUser: (userId) =>
    api.get(`/projects/user/${userId}/tagged`),
  // Project claiming (Project Manager)
  claimProject: (projectId, userId) =>
    api.post(`/projects/${projectId}/claim`, { user_id: userId }),
  unclaimProject: (projectId, userId) =>
    api.delete(`/projects/${projectId}/claim`, { data: { user_id: userId } }),
  getClaimedByUser: (userId) =>
    api.get(`/projects/user/${userId}/claimed`),
  // Project joining (Staff)
  joinProject: (projectId, userId) =>
    api.post(`/projects/${projectId}/join`, { user_id: userId }),
  leaveProject: (projectId, userId) =>
    api.delete(`/projects/${projectId}/join`, { data: { user_id: userId } }),
  getJoinedByUser: (userId) =>
    api.get(`/projects/user/${userId}/joined`),
  // Get project members
  getMembers: (projectId) =>
    api.get(`/projects/${projectId}/members`),
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
  getRecentTests: (limit) => api.get('/analytics/tests/recent', { params: { limit } }),
  getExpiringSoonCalibrations: () => api.get('/analytics/calibrations/expiring-soon'),
};

// Equipment Types API
export const equipmentTypesAPI = {
  getAll: () => api.get('/equipment-types'),
  generateId: (equipment_type) => api.post('/equipment-types/generate-id', { equipment_type }),
  create: (data) => api.post('/equipment-types', data),
};

// Search API (global search)
export const searchAPI = {
  global: (query) => api.get('/search', { params: { q: query } }),
  media: (query) => api.get('/search/media', { params: { q: query } }),
};

// Reports API
export const reportsAPI = {
  getByTest: (testId) => api.get(`/reports/test/${testId}`),
  upload: (formData) => api.post('/reports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/reports/${id}`, data),
  delete: (id) => api.delete(`/reports/${id}`),
  download: (id) => api.get(`/reports/download/${id}`, { responseType: 'blob' }),
};

// Auth API
export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
  register: (data) => api.post('/auth/register', data),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword }),
  getUsers: () => api.get('/auth/users'),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
};

export default api;
