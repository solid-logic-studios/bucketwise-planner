import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthProvider.tsx';

interface ProtectedRouteProps {
  fallback: ReactNode;
  children: ReactNode;
}

export function ProtectedRoute({ fallback, children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
}
