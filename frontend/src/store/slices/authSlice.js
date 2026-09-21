import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAccessToken } from '../../api/axios';

// Async Thunk: Register (Sets HTTP-Only cookies automatically)
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      setAccessToken(response.data.accessToken);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

// Async Thunk: Login (Sets HTTP-Only cookies automatically)
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      setAccessToken(response.data.accessToken);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Invalid credentials');
    }
  }
);

// Async Thunk: Check/Refresh Session from HTTP-Only Cookie on App Load
export const checkAuthSession = createAsyncThunk(
  'auth/checkAuthSession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/refresh');
      setAccessToken(response.data.accessToken);
      return response.data;
    } catch (err) {
      return rejectWithValue('No active session');
    }
  }
);

// Async Thunk: Logout (Destroys HTTP-Only cookies on server)
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      setAccessToken(null);
      return null;
    } catch (err) {
      setAccessToken(null);
      return null;
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  sessionChecking: true,
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
        state.user = action.payload.user;
        state.isAuthenticated = true;
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
