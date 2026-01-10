import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { api, clearAuthTokens, setAuthTokens } from '../api/client.ts';

interface AuthContextValue {
  isAuthenticated: boolean;
  accessToken: string | null;
  userEmail: string | null;
  userName: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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
    const result = await api.login({ email, password });
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
    const result = await api.signup({ email, name, password });
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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
