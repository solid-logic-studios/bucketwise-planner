import { Box, Card, Group, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { ErrorAlert } from '../ErrorAlert.js';
import { LoadingSpinner } from '../LoadingSpinner.js';
import classes from './BaseChart.module.css';

interface BaseChartProps {
  title: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  children?: ReactNode;
}

export function BaseChart({ title, description, loading, error, children }: BaseChartProps) {
  return (
    <Card withBorder shadow="sm" p="md" radius="md" className={classes.card}>
      <Group justify="space-between" mb="sm">
        <Text fw={600}>{title}</Text>
      </Group>
      {description ? (
        <Text c="dimmed" size="sm" mb="md">{description}</Text>
      ) : null}
      <Box className={classes.contentWrapper}>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : (
          <Box className={classes.chartContainer}>
            {children}
          </Box>
        )}
      </Box>
    </Card>
  );
}
