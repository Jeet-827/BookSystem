import axios from 'axios';

let adminToken = null;

export const setAdminToken = (t) => {
  adminToken = t;
};

export const getAdminToken = () => adminToken;

const getAdminBaseURL = () => {
  if (import.meta.env.VITE_ADMIN_API_BASE_URL) return import.meta.env.VITE_ADMIN_API_BASE_URL.replace(/\/+$/, '');
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl !== '/api') return `${envUrl.replace(/\/+$/, '')}/admin`;
  if (import.meta.env.PROD) return 'https://booksystem-wz8g.onrender.com/api/admin';
  return '/api/admin';
};

const adminApi = axios.create({
  baseURL: getAdminBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

adminApi.interceptors.request.use(
  (config) => {
    const t = getAdminToken();
    if (t) {
      config.headers.Authorization = `Bearer ${t}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
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
        const baseURL = getAdminBaseURL();
        const res = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        if (res.data?.accessToken) {
          setAdminToken(res.data.accessToken);
          request.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return adminApi(request);
        }
      } catch (refreshErr) {
        setAdminToken(null);
        return Promise.reject(refreshErr);
      }
    }

    const status = error.response?.status;
    const method = error.config?.method?.toUpperCase() || 'REQUEST';
    const url = error.config?.url || '';
    const errorMsg = error.response?.data?.message || error.message;

    // Suppress expected 401s or failed probes on /auth/refresh for unauthenticated visitors
    if (!url.includes('/auth/refresh')) {
      console.error(`🚨 [Admin API Error ${status || 'Network'}] [${method} ${url}]:`, errorMsg);
    }

    return Promise.reject(error);
  }
);

export default adminApi;
