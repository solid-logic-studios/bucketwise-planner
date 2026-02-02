import { createContext } from 'react';

export interface AuthContextValue {
  isAuthenticated: boolean;
  accessToken: string | null;
  userEmail: string | null;
  userName: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
