import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000', // Backend API URL
  timeout: 10000,
});

export default api;
