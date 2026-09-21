import { describe, it, expect } from 'vitest';
import authReducer, { clearAuthError, loginUser, logoutUser, registerUser, checkAuthSession } from '../authSlice';

describe('authSlice reducer', () => {
  const initialAuthState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    sessionChecking: true,
    error: null,
  };

  it('should return initial state when passed empty action', () => {
    expect(authReducer(undefined, { type: undefined })).toEqual(initialAuthState);
  });

  it('should handle clearAuthError', () => {
    const errorState = { ...initialAuthState, error: 'Invalid password' };
    const nextState = authReducer(errorState, clearAuthError());
    expect(nextState.error).toBeNull();
  });

  it('should set loading on loginUser.pending', () => {
    const nextState = authReducer(initialAuthState, { type: loginUser.pending.type });
    expect(nextState.loading).toBe(true);
    expect(nextState.error).toBeNull();
  });

  it('should set user and isAuthenticated on loginUser.fulfilled', () => {
    const mockUser = { id: 'u1', name: 'John Doe', email: 'john@example.com' };
    const nextState = authReducer(initialAuthState, {
      type: loginUser.fulfilled.type,
      payload: { user: mockUser },
    });
    expect(nextState.loading).toBe(false);
    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.user).toEqual(mockUser);
  });

  it('should set error on loginUser.rejected', () => {
    const nextState = authReducer(initialAuthState, {
      type: loginUser.rejected.type,
      payload: 'Invalid email or password',
    });
    expect(nextState.loading).toBe(false);
    expect(nextState.error).toBe('Invalid email or password');
  });

  it('should clear user on logoutUser.fulfilled', () => {
    const loggedInState = {
      ...initialAuthState,
      user: { id: 'u1', name: 'John' },
      isAuthenticated: true,
    };
    const nextState = authReducer(loggedInState, { type: logoutUser.fulfilled.type });
    expect(nextState.user).toBeNull();
    expect(nextState.isAuthenticated).toBe(false);
  });

  it('should handle checkAuthSession.rejected by clearing sessionChecking', () => {
    const nextState = authReducer(initialAuthState, { type: checkAuthSession.rejected.type });
    expect(nextState.sessionChecking).toBe(false);
    expect(nextState.isAuthenticated).toBe(false);
  });
});
