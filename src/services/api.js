import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = {
  // Medicines
  getMedicines: () => axios.get(`${API_URL}/medicines`),
  getMedicine: (id) => axios.get(`${API_URL}/medicines/${id}`),
  createMedicine: (medicine) => axios.post(`${API_URL}/medicines`, medicine),
  
  // Dispensaries
  getDispensaries: () => axios.get(`${API_URL}/dispensaries`),
  
  // Orders
  getOrders: () => axios.get(`${API_URL}/orders`),
  createOrder: (order) => axios.post(`${API_URL}/orders`, order),
  
  // Dashboard
  getDashboardData: () => axios.get(`${API_URL}/dashboard`),
  
  // Demand Predictions
  getDemandPredictions: (period) => axios.get(`${API_URL}/demand-predictions?period=${period}`)
};

export default api;