import axios from 'axios';

let inMemoryAdminToken = null;

export const setAdminToken = (token) => {
  inMemoryAdminToken = token;
  if (token) {
    localStorage.setItem('bm_admin_token', token);
  } else {
    localStorage.removeItem('bm_admin_token');
  }
};

export const getAdminToken = () => {
  if (!inMemoryAdminToken) {
    inMemoryAdminToken = localStorage.getItem('bm_admin_token');
  }
  return inMemoryAdminToken;
};

const adminApi = axios.create({
  baseURL: '/api/admin',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

adminApi.interceptors.request.use(
  (config) => {
    const token = getAdminToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const res = await axios.post('/api/admin/auth/refresh', {}, { withCredentials: true });
        if (res.data?.accessToken) {
          setAdminToken(res.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return adminApi(originalRequest);
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
