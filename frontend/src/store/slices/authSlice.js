import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, {
  setAccessToken,
  setFallbackRefreshToken,
  getFallbackRefreshToken,
} from '../../api/axios';

export { setFallbackRefreshToken, getFallbackRefreshToken };

// Async Thunk: Register (Sets HTTP-Only cookies automatically + stores token in memory/session)
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.accessToken) {
        setAccessToken(response.data.accessToken);
      }
      if (response.data.refreshToken) {
        setFallbackRefreshToken(response.data.refreshToken);
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

// Async Thunk: Login (Sets HTTP-Only cookies automatically + stores token in memory/session)
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.accessToken) {
        setAccessToken(response.data.accessToken);
      }
      if (response.data.refreshToken) {
        setFallbackRefreshToken(response.data.refreshToken);
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Invalid credentials');
    }
  }
);

// Async Thunk: Check/Refresh Session from HTTP-Only Cookie or Fallback on App Load / Reload
// On every reload this API call exchanges the refresh token (via HTTP-only cookie or
// session fallback header/body) for a freshly minted access token and user profile.
// Strict compliance: Never touches localStorage.
export const checkAuthSession = createAsyncThunk(
  'auth/checkAuthSession',
  async (_, { rejectWithValue }) => {
    try {
      const rf = getFallbackRefreshToken();
      const payload = rf ? { refreshToken: rf } : {};
      const headers = rf ? { 'x-refresh-token': rf } : {};

      const response = await api.post('/auth/refresh', payload, { headers });
      if (response.data.accessToken) {
        setAccessToken(response.data.accessToken);
      }
      if (response.data.refreshToken) {
        setFallbackRefreshToken(response.data.refreshToken);
      }
      return response.data;
    } catch (err) {
      setAccessToken(null);
      setFallbackRefreshToken(null);
      if (err.response?.status === 401) {
        return rejectWithValue('Session expired');
      }
      return rejectWithValue('No active session');
    }
  }
);

// Async Thunk: Logout (Destroys HTTP-Only cookies on server + wipes tokens)
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const rf = getFallbackRefreshToken();
      const payload = rf ? { refreshToken: rf } : {};
      const headers = rf ? { 'x-refresh-token': rf } : {};
      await api.post('/auth/logout', payload, { headers });
    } catch (err) {
      // Continue cleanup regardless of server response
    } finally {
      setAccessToken(null);
      setFallbackRefreshToken(null);
    }
    return null;
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  sessionChecking: true, // Always true initially — resolved by checkAuthSession
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Check Auth Session on Load
      .addCase(checkAuthSession.pending, (state) => {
        state.sessionChecking = true;
      })
      .addCase(checkAuthSession.fulfilled, (state, action) => {
        state.sessionChecking = false;
        if (action.payload?.user) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
      })
      .addCase(checkAuthSession.rejected, (state) => {
        state.sessionChecking = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
