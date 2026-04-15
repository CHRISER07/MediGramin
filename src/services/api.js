/**
 * MediGramin API Service — centralized axios instance.
 * All backend calls go through here. Base URL = http://localhost:5000
 */
import axios from 'axios';

const BASE = 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE,
  timeout: 30000, // 30s
  headers: { 'Content-Type': 'application/json' },
});

// Log errors in development
api.interceptors.response.use(
  res => res,
  err => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]', err.config?.url, err.response?.data || err.message);
    }
    return Promise.reject(err);
  }
);

// ── Helpers ─────────────────────────────────────────────────────────────────
const get = (url, params) => api.get(url, { params }).then(r => r.data);
const post = (url, data) => api.post(url, data).then(r => r.data);
const put = (url, data) => api.put(url, data).then(r => r.data);
const postForm = (url, formData) =>
  api.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);

// ── Health ────────────────────────────────────────────────────────────────
export const checkHealth = () => get('/api/health');

// ── Inventory ─────────────────────────────────────────────────────────────
export const inventoryAPI = {
  dashboard: () => get('/api/inventory/dashboard'),
  list: (params) => get('/api/inventory/items', params),
  get: (sku) => get(`/api/inventory/items/${sku}`),
  upload: (file) => { const fd = new FormData(); fd.append('file', file); return postForm('/api/inventory/upload', fd); },
  export: () => { window.open(`${BASE}/api/inventory/export`); },
  lowStock: () => get('/api/inventory/low-stock'),
  expiring: (days = 30) => get('/api/inventory/expiring', { days }),
  predict: (sku) => get(`/api/inventory/predict/${sku}`),
  anomalies: () => get('/api/inventory/anomalies'),
  insights: () => post('/api/inventory/insights', {}),
  query: (question) => post('/api/inventory/query', { question }),
  getOrders: (status) => get('/api/inventory/orders', status ? { status } : {}),
  placeOrder: (data) => post('/api/inventory/orders', data),
  updateOrder: (id, status) => put(`/api/inventory/orders/${id}`, { status }),
};

// ── Routing ───────────────────────────────────────────────────────────────
export const routingAPI = {
  upload: (file) => { const fd = new FormData(); fd.append('file', file); return postForm('/api/routing/upload', fd); },
  clusters: () => get('/api/routing/clusters'),
  map: (cluster) => get('/api/routing/map', cluster !== undefined ? { cluster } : {}),
  priority: (user_input) => post('/api/routing/priority', { user_input }),
};

// ── Chatbot ───────────────────────────────────────────────────────────────
export const chatbotAPI = {
  status: () => get('/api/chatbot/status'),
  chat: (message, language = 'en') => post('/api/chatbot/chat', { message, language }),
  triage: (data) => post('/api/chatbot/triage', data),
  translate: (text, language) => post('/api/chatbot/translate', { text, language }),
};

// ── Patients ──────────────────────────────────────────────────────────────
export const patientsAPI = {
  list: (params) => get('/api/patients', params),
  register: (data) => post('/api/patients', data),
  get: (id) => get(`/api/patients/${id}`),
  update: (id, data) => put(`/api/patients/${id}`, data),
  villages: () => get('/api/patients/meta/villages'),
  summary: () => get('/api/patients/meta/summary'),
};

// ── Visits ─────────────────────────────────────────────────────────────────
export const visitsAPI = {
  log: (data) => post('/api/visits', data),
  get: (id) => get(`/api/visits/${id}`),
  byPatient: (pid) => get(`/api/visits/patient/${pid}`),
  recent: (limit = 20) => get('/api/visits/recent', { limit }),
  updateTriage: (id, data) => put(`/api/visits/${id}/triage`, data),
};

// ── Prescriptions ──────────────────────────────────────────────────────────
export const prescriptionsAPI = {
  create: (data) => post('/api/prescriptions', data),
  byPatient: (pid) => get(`/api/prescriptions/${pid}`),
  verify: (qrHash) => get(`/api/prescriptions/verify/${qrHash}`),
  markPrinted: (id) => put(`/api/prescriptions/${id}/print`, {}),
};

// ── Sync ────────────────────────────────────────────────────────────────────
export const syncAPI = {
  push: (records) => post('/api/sync/push', { records }),
  status: () => get('/api/sync/status'),
};

export default api;