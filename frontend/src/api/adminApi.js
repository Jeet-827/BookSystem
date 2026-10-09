import axios from 'axios';

let adminToken = null;

export const setAdminToken = (t) => {
  adminToken = t;
};

export const getAdminToken = () => adminToken;

const getAdminBaseURL = () => {
  if (import.meta.env.VITE_ADMIN_API_BASE_URL) return import.meta.env.VITE_ADMIN_API_BASE_URL;
  if (import.meta.env.VITE_API_BASE_URL) return `${import.meta.env.VITE_API_BASE_URL}/admin`;
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
    return Promise.reject(error);
  }
);

export default adminApi;
