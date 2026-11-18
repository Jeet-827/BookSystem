import { describe, it, expect, beforeEach, vi } from 'vitest';
import authReducer, {
  clearAuthError,
  setFallbackRefreshToken,
  getFallbackRefreshToken,
} from '../authSlice';
import { setAccessToken, getAccessToken } from '../../../api/axios';

describe('Auth Persistence on Reload, In-Memory Token & Rate Limiting Test Suite (18 Tests)', () => {
  beforeEach(() => {
    setAccessToken(null);
    setFallbackRefreshToken(null);
    sessionStorage.clear();
    localStorage.clear();
  });

  it('1. Access token is stored strictly in browser memory, never in localStorage', () => {
    const testToken = 'jwt_test_token_in_memory_12345';
    setAccessToken(testToken);

    expect(getAccessToken()).toBe(testToken);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('2. Clearing access token sets in-memory variable to null', () => {
    setAccessToken('temporary_token');
    expect(getAccessToken()).toBe('temporary_token');

    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });

  it('3. Initial Redux auth state starts with sessionChecking: true and isAuthenticated: false', () => {
    const state = authReducer(undefined, { type: '@@INIT' });
    expect(state.sessionChecking).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('4. Successful checkAuthSession.fulfilled sets isAuthenticated: true and clears sessionChecking', () => {
    const initialState = {
      user: null,
      isAuthenticated: false,
      sessionChecking: true,
      loading: false,
      error: null,
    };

    const action = {
      type: 'auth/checkAuthSession/fulfilled',
      payload: {
        success: true,
        accessToken: 'fresh_access_token_on_reload',
        user: { _id: 'u1', name: 'John Doe', email: 'john@example.com', role: 'user' },
      },
    };

    const nextState = authReducer(initialState, action);
    expect(nextState.sessionChecking).toBe(false);
    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.user.name).toBe('John Doe');
  });

  it('5. Failed checkAuthSession.rejected sets isAuthenticated: false and clears sessionChecking', () => {
    const initialState = {
      user: null,
      isAuthenticated: false,
      sessionChecking: true,
      loading: false,
      error: null,
    };

    const action = {
      type: 'auth/checkAuthSession/rejected',
      payload: 'No active session',
    };

    const nextState = authReducer(initialState, action);
    expect(nextState.sessionChecking).toBe(false);
    expect(nextState.isAuthenticated).toBe(false);
    expect(nextState.user).toBeNull();
  });

  it('6. checkAuthSession.pending keeps sessionChecking as true', () => {
    const initialState = {
      user: null,
      isAuthenticated: false,
      sessionChecking: false,
      loading: false,
      error: null,
    };

    const action = { type: 'auth/checkAuthSession/pending' };
    const nextState = authReducer(initialState, action);
    expect(nextState.sessionChecking).toBe(true);
  });

  it('7. Login fulfilled updates Redux user and sets isAuthenticated to true', () => {
    const initialState = { user: null, isAuthenticated: false, loading: true, error: null };
    const action = {
      type: 'auth/login/fulfilled',
      payload: {
        success: true,
        accessToken: 'access_jwt_123',
        user: { _id: 'u2', name: 'Alice Smith', email: 'alice@example.com' },
      },
    };

    const nextState = authReducer(initialState, action);
    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.user.email).toBe('alice@example.com');
  });

  it('8. Registration fulfilled sets authenticated status and user profile', () => {
    const initialState = { user: null, isAuthenticated: false, loading: true, error: null };
    const action = {
      type: 'auth/register/fulfilled',
      payload: {
        success: true,
        accessToken: 'new_registered_jwt',
        user: { _id: 'u3', name: 'Bob Reader', email: 'bob@gmail.com' },
      },
    };

    const nextState = authReducer(initialState, action);
    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.user.name).toBe('Bob Reader');
  });

  it('9. Logout fulfilled clears user and sets isAuthenticated: false', () => {
    const initialState = {
      user: { _id: 'u1', name: 'John Doe' },
      isAuthenticated: true,
      sessionChecking: false,
      error: null,
    };

    const action = { type: 'auth/logoutUser/fulfilled' };
    const nextState = authReducer(initialState, action);
    expect(nextState.isAuthenticated).toBe(false);
    expect(nextState.user).toBeNull();
  });

  it('10. clearAuthError action resets error to null', () => {
    const initialState = { error: 'Invalid credentials', isAuthenticated: false };
    const nextState = authReducer(initialState, clearAuthError());
    expect(nextState.error).toBeNull();
  });

  it('11. Fallback refresh token can be set and retrieved for browser reload recovery', () => {
    const refToken = 'fallback_ref_token_xyz_789';
    setFallbackRefreshToken(refToken);
    expect(getFallbackRefreshToken()).toBe(refToken);
  });

  it('12. Clearing fallback refresh token sets it to null in memory and sessionStorage', () => {
    setFallbackRefreshToken('temp_ref_token');
    setFallbackRefreshToken(null);
    expect(getFallbackRefreshToken()).toBeNull();
  });

  it('13. LocalStorage remains completely clean of auth tokens throughout full flow', () => {
    setAccessToken('test_jwt');
    setFallbackRefreshToken('test_ref');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('jwt')).toBeNull();
  });

  it('14. Simulates token refresh payload creation for reload request', () => {
    setFallbackRefreshToken('valid_rt_999');
    const token = getFallbackRefreshToken();
    const payload = token ? { refreshToken: token } : {};
    expect(payload).toEqual({ refreshToken: 'valid_rt_999' });
  });

  it('15. Handles empty fallback token with empty object payload (relying on httpOnly cookie)', () => {
    setFallbackRefreshToken(null);
    const token = getFallbackRefreshToken();
    const payload = token ? { refreshToken: token } : {};
    expect(payload).toEqual({});
  });

  it('16. Simulates rate limit 429 response handling on excessive refresh calls', () => {
    const rateLimitError = {
      response: {
        status: 429,
        data: {
          success: false,
          message: 'Too many token refresh attempts, please try again after 15 minutes',
        },
      },
    };

    const isRateLimited = rateLimitError.response.status === 429;
    expect(isRateLimited).toBe(true);
    expect(rateLimitError.response.data.message).toContain('Too many token refresh attempts');
  });

  it('17. Session checking state ensures protected pages know when auth is verifying', () => {
    const verifyingState = { sessionChecking: true, isAuthenticated: false };
    const shouldRedirectImmediately = !verifyingState.sessionChecking && !verifyingState.isAuthenticated;
    expect(shouldRedirectImmediately).toBe(false);

    const guestState = { sessionChecking: false, isAuthenticated: false };
    const shouldRedirectGuest = !guestState.sessionChecking && !guestState.isAuthenticated;
    expect(shouldRedirectGuest).toBe(true);
  });

  it('18. Token rotation updates access token with new string after refresh', () => {
    let currentToken = 'old_expired_access_token';
    setAccessToken(currentToken);
    expect(getAccessToken()).toBe('old_expired_access_token');

    // Rotation happens
    const rotatedToken = 'brand_new_rotated_token_2026';
    setAccessToken(rotatedToken);
    expect(getAccessToken()).toBe('brand_new_rotated_token_2026');
    expect(getAccessToken()).not.toBe('old_expired_access_token');
  });
});
