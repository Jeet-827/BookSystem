import axios from 'axios';

const getApiBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl !== '/api') {
    return envUrl.replace(/\/+$/, '');
  }
  if (import.meta.env.PROD) {
    return 'https://booksystem-wz8g.onrender.com/api';
  }
  return '/api';
};

const apiBaseURL = getApiBaseURL();

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Response interceptor for automatic token refresh & HTML response validation
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
