import axios from 'axios';
import { API_URL, logout } from './auth';

/** Cliente Axios §8.1/§12: todo el tráfico React→FastAPI pasa por aquí. */
export const client = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      logout();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default client;
