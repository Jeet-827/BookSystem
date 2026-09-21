import axios from 'axios';

let adminToken = null;

export const setAdminToken = (t) => {
  adminToken = t;
};

export const getAdminToken = () => adminToken;

const adminApi = axios.create({
  baseURL: '/api/admin',
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
        const res = await axios.post('/api/admin/auth/refresh', {}, { withCredentials: true });
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
