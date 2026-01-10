import { Badge } from '@mantine/core';

interface DebtTypeBadgeProps {
  debtType: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'filled' | 'outline' | 'dot';
}

export function DebtTypeBadge({ debtType, size = 'sm', variant = 'light' }: DebtTypeBadgeProps) {
  return (
    <Badge size={size} variant={variant} color="amber">
      {debtType}
    </Badge>
  );
}
