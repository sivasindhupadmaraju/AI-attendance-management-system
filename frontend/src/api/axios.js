import axios from 'axios';

// Use VITE_API_URL in production; fall back to Vite dev‑proxy during local development
// If the variable is missing in a production build we log a warning – API calls will otherwise fail.
const baseURL = import.meta.env.VITE_API_URL;
const apiBaseURL = baseURL ? `${baseURL.replace(/\/+$/, '')}/api` : '/api';
if (import.meta.env.PROD && !baseURL) {
  // eslint-disable-next-line no-console
  console.error('⚠️ VITE_API_URL is not defined – API requests will fail');
}
const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle session expiration (HTTP 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear credentials and force reload if unauthorized
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
