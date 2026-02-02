import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { api, clearAuthTokens, setAuthTokens } from '../api/client.ts';
import { AuthContext, type AuthContextValue } from './auth-context.ts';

interface AuthUser {
  email: string;
  name: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  );
  const [userEmail, setUserEmail] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null
  );
  const [userName, setUserName] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('userName') : null
  );
  const isAuthenticated = !!accessToken;

  const login = useCallback(async (email: string, password: string) => {
    const result = (await api.login({ email, password })) as AuthTokens;
    setAuthTokens(result);
    setAccessTokenState(result.accessToken);
    try {
      localStorage.setItem('userEmail', result.user.email);
      localStorage.setItem('userName', result.user.name);
      setUserEmail(result.user.email);
      setUserName(result.user.name);
    } catch {
      // ignore storage errors
    }
  }, []);

  const signup = useCallback(async (email: string, name: string, password: string) => {
    const result = (await api.signup({ email, name, password })) as AuthTokens;
    setAuthTokens(result);
    setAccessTokenState(result.accessToken);
    try {
      localStorage.setItem('userEmail', result.user.email);
      localStorage.setItem('userName', result.user.name);
      setUserEmail(result.user.email);
      setUserName(result.user.name);
    } catch {
      // ignore storage errors
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore logout errors
    }
    clearAuthTokens();
    setAccessTokenState(null);
    try {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
    } catch {
      // ignore storage errors
    }
    setUserEmail(null);
    setUserName(null);
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({ isAuthenticated, accessToken, userEmail, userName, login, signup, logout }),
    [isAuthenticated, accessToken, userEmail, userName, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
