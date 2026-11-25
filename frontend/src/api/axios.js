import axios from 'axios';

// Pure in-memory token storage (NO localStorage, NO sessionStorage)
let token = null;
let inMemoryRefreshToken = null;

export const setAccessToken = (t) => {
  token = t || null;
};

export const getAccessToken = () => token;

// In-memory fallback for test harnesses and runtime isolation
export const setFallbackRefreshToken = (rt) => {
  inMemoryRefreshToken = rt || null;
};

export const getFallbackRefreshToken = () => inMemoryRefreshToken;

// Ensure browser storage is completely free of auth tokens
if (typeof window !== 'undefined') {
  try {
    window.sessionStorage?.clear();
    window.localStorage?.removeItem('token');
    window.localStorage?.removeItem('accessToken');
    window.localStorage?.removeItem('refreshToken');
    window.localStorage?.removeItem('jwt');
    window.localStorage?.removeItem('redkitindia_rf_token');
    window.localStorage?.removeItem('redkitindia_tab_refresh_token');
  } catch (e) {
    // Ignore storage errors in restricted contexts
  }
}

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
  // If running locally in browser dev mode and env points to remote Render, route to local server
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    if (!envUrl || envUrl.includes('onrender.com')) {
      return 'http://localhost:5000/api';
    }
  }
  if (envUrl) {
    return normalizeApiUrl(envUrl);
  }
  return 'https://booksystem-wz8g.onrender.com/api';
};

export const getAdminServerBase = () => {
  const adminUrl = import.meta.env.VITE_ADMIN_API_BASE_URL;
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    if (!adminUrl || adminUrl.includes('onrender.com')) {
      return 'http://localhost:5001/api';
    }
  }
  const target = adminUrl || 'https://booksystem-1.onrender.com/';
  let clean = target.trim().replace(/\/+$/, '');
  if (clean.endsWith('/api/admin')) return clean.replace(/\/admin$/, '');
  if (clean.endsWith('/api')) return clean;
  return `${clean}/api`;
};

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Automatically sends and receives HTTP-Only cookies
});

// Request interceptor: Attach in-memory Access Token & Route admin requests to admin backend
api.interceptors.request.use(
  (config) => {
    config.baseURL = config.url?.startsWith('/admin') ? getAdminServerBase() : getApiBaseURL();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Also include in-memory fallback token header if present (e.g. during test runs)
    if (inMemoryRefreshToken && !config.headers['x-refresh-token']) {
      config.headers['x-refresh-token'] = inMemoryRefreshToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let customerRefreshPromise = null;
let adminRefreshPromise = null;

const refreshAccessToken = (isAdminReq) => {
  const activePromise = isAdminReq ? adminRefreshPromise : customerRefreshPromise;
  if (activePromise) return activePromise;

  const refreshUrl = isAdminReq
    ? `${getAdminServerBase()}/admin/auth/refresh`
    : `${getApiBaseURL()}/auth/refresh`;
  const payload = inMemoryRefreshToken ? { refreshToken: inMemoryRefreshToken } : {};
  const headers = inMemoryRefreshToken ? { 'x-refresh-token': inMemoryRefreshToken } : {};

  const promise = axios
    .post(refreshUrl, payload, { headers, withCredentials: true })
    .then((res) => {
      if (res.data?.accessToken) {
        setAccessToken(res.data.accessToken);
        if (res.data.refreshToken) {
          setFallbackRefreshToken(res.data.refreshToken);
        }
        return res.data.accessToken;
      }
      throw new Error('No access token returned during refresh');
    })
    .finally(() => {
      if (isAdminReq) {
        adminRefreshPromise = null;
      } else {
        customerRefreshPromise = null;
      }
    });

  if (isAdminReq) {
    adminRefreshPromise = promise;
  } else {
    customerRefreshPromise = promise;
  }
  return promise;
};

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
    if (
      error.response?.status === 401 &&
      request &&
      !request._retry &&
      !request.url?.includes('/auth/login') &&
      !request.url?.includes('/auth/refresh')
    ) {
      request._retry = true;
      try {
        const isAdminReq = request.url?.startsWith('/admin');
        const newAccessToken = await refreshAccessToken(isAdminReq);
        request.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(request);
      } catch (refreshErr) {
        setAccessToken(null);
        setFallbackRefreshToken(null);
        return Promise.reject(refreshErr);
      }
    }

    // Log error in browser console for fast visibility and debugging
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
