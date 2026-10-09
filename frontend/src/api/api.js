import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
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
          `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh`,
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

    if (!(status === 401 && url.includes('/auth/refresh'))) {
      console.error(`🚨 [API Error ${status || 'Network'}] [${method} ${url}]:`, errorMsg);
    }

    return Promise.reject(error);
  }
);

export default api;
