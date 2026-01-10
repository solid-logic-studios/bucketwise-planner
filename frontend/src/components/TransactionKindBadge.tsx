import { Badge } from '@mantine/core';

const KIND_COLORS = {
  income: 'teal',
  expense: 'red',
  transfer: 'blue',
} as const;

interface TransactionKindBadgeProps {
  kind: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'filled' | 'outline' | 'dot';
}

export function TransactionKindBadge({ kind, size = 'sm', variant = 'light' }: TransactionKindBadgeProps) {
  const color = KIND_COLORS[kind as keyof typeof KIND_COLORS] || 'gray';

  return (
    <Badge size={size} variant={variant} color={color}>
      {kind}
    </Badge>
  );
}
