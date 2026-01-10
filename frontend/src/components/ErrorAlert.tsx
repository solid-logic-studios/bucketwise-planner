import { Alert } from '@mantine/core';
import type { ReactNode } from 'react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  children?: ReactNode;
}

export function ErrorAlert({ title = 'Error', message, children }: ErrorAlertProps) {
  return (
    <Alert color="red" title={title} variant="light">
      {message}
      {children}
    </Alert>
  );
}
