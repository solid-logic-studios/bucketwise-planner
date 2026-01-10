import { Alert } from '@mantine/core';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  message: string;
  children?: ReactNode;
}

export function EmptyState({ title = 'No data', message, children }: EmptyStateProps) {
  return (
    <Alert color="blue" title={title} variant="light">
      {message}
      {children}
    </Alert>
  );
}
