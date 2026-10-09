import axios from 'axios';

let token = null;

export const setAccessToken = (t) => {
  token = t;
};

export const getAccessToken = () => token;

const rawBaseURL = import.meta.env.VITE_API_BASE_URL || '/api';
const apiBaseURL = rawBaseURL.replace(/\/+$/, '');

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Automatically sends and receives HTTP-Only cookies
});

// Request interceptor: Attach Access Token if available
api.interceptors.request.use(
  (config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Silent Refresh & Error Handling
api.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE html')) {
      const msg = `Endpoint [${response.config.url}] returned HTML instead of API data. Ensure VITE_API_BASE_URL is set in Vercel to your Render backend URL!`;
      console.error('🚨 [Vercel API Config Error]:', msg);
      return Promise.reject(new Error(msg));
    }
    return response;
  },
  async (error) => {
    const request = error.config;

    // If 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !request._retry && request.url !== '/auth/login' && request.url !== '/auth/refresh') {
      request._retry = true;
      try {
        // Request new access token using HTTP-only refresh token cookie
        const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
        const res = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        if (res.data?.accessToken) {
          setAccessToken(res.data.accessToken);
          request.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(request);
        }
      } catch (refreshErr) {
        setAccessToken(null);
        return Promise.reject(refreshErr);
      }
    }

    // Log error in browser console for fast visibility and debugging
    const status = error.response?.status;
    const method = error.config?.method?.toUpperCase() || 'REQUEST';
    const url = error.config?.url || '';
    const errorMsg = error.response?.data?.message || error.message;

    if (!(status === 401 && url.includes('/auth/refresh'))) {
      console.error(`🚨 [API Error ${status || 'Network'}] [${method} ${url}]:`, errorMsg);
    }

    return Promise.reject(error);
  }
);

export default api;
