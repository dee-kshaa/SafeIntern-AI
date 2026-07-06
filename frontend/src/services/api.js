import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export const analyzeText = async (text, source = 'text') => {
  const response = await api.post('/api/analyze', { text, source });
  return response.data;
};

export const analyzeImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${API_BASE}/api/analyze/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const sendChat = async (message, context = '') => {
  const response = await api.post('/api/chat', { message, context });
  return response.data;
};

export const getReports = async () => {
  const response = await api.get('/api/reports');
  return response.data;
};

export const saveReport = async (text, analysis, source = 'text') => {
  const response = await api.post('/api/reports', { text, analysis, source });
  return response.data;
};

export const deleteReport = async (id) => {
  const response = await api.delete(`/api/reports/${id}`);
  return response.data;
};

export const getMarketAnalytics = async () => {
  const response = await api.get('/api/analytics');
  return response.data;
};

export const getPipelineStatus = async () => {
  const response = await api.get('/api/pipeline-status');
  return response.data;
};

export const getPriorityRecommendation = async (internship) => {
  const response = await api.post('/api/analytics/recommend', { internship });
  return response.data;
};

export default api;
