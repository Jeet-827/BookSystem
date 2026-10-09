import axios from 'axios';

export const normalizeApiUrl = (url) => {
  if (!url) return '';
  let clean = url.trim().replace(/\/+$/, '');
  if (!clean.endsWith('/api') && clean !== '/api') {
    clean = `${clean}/api`;
  }
  return clean;
};

export const getApiBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return normalizeApiUrl(envUrl);
  }
  return 'https://booksystem-wz8g.onrender.com/api';
};

const apiBaseURL = getApiBaseURL();

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const getAdminServerBase = () => {
  const adminUrl = import.meta.env.VITE_ADMIN_API_BASE_URL || 'https://booksystem-1.onrender.com/';
  let clean = adminUrl.trim().replace(/\/+$/, '');
  if (clean.endsWith('/api/admin')) return clean.replace(/\/admin$/, '');
  if (clean.endsWith('/api')) return clean;
  return `${clean}/api`;
};

// Request interceptor: Route admin requests to dedicated admin backend
api.interceptors.request.use(
  (config) => {
    if (config.url?.startsWith('/admin')) {
      config.baseURL = getAdminServerBase();
    }
    return config;
  },
  (error) => Promise.reject(error)
);
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
    if (
      error.response?.status === 401 &&
      !request._retry &&
      !request.url.includes('/auth/login') &&
      !request.url.includes('/auth/refresh')
    ) {
      request._retry = true;
      try {
        await axios.post(
          `${getApiBaseURL()}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        return api(request);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    const status = error.response?.status;
    const method = error.config?.method?.toUpperCase() || 'REQUEST';
    const url = error.config?.url || '';
    const errorMsg = error.response?.data?.message || error.message;

    // Suppress expected 401s or failed probes on /auth/refresh for unauthenticated visitors
    if (!url.includes('/auth/refresh')) {
      console.error(`🚨 [API Error ${status || 'Network'}] [${method} ${url}]:`, errorMsg);
    }

    return Promise.reject(error);
  }
);

export default api;
