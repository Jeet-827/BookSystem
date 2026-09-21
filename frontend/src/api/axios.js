import axios from 'axios';

let token = null;

export const setAccessToken = (t) => {
  token = t;
};

export const getAccessToken = () => token;

const api = axios.create({
  baseURL: '/api',
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

// Response interceptor: Silent Refresh when Access Token expires
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;

    // If 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !request._retry && request.url !== '/auth/login' && request.url !== '/auth/refresh') {
      request._retry = true;
      try {
        // Request new access token using HTTP-only refresh token cookie
        const res = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
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

    return Promise.reject(error);
  }
);

export default api;
