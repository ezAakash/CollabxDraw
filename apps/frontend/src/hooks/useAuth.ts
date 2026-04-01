import { useState, useCallback } from 'react';
import { login as apiLogin, signup as apiSignup } from '../utils/api';

export function useAuth() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token')
  );

  const isAuthenticated = !!token;

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin({ email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      return { success: true };
    }
    return { success: false, message: data.message || 'Login failed' };
  }, []);

  const signup = useCallback(
    async (firstName: string, lastName: string, email: string, password: string) => {
      const data = await apiSignup({ firstName, lastName, email, password });
      if (data.message?.includes('signed up')) {
        return { success: true };
      }
      return { success: false, message: data.message || 'Signup failed' };
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
  }, []);

  return { token, isAuthenticated, login, signup, logout };
}
