import { Badge } from '@mantine/core';

const BUCKET_COLORS = {
  'daily-expenses': 'blue',
  'splurge': 'pink',
  'smile': 'teal',
  'fire-extinguisher': 'amber',
  'Daily Expenses': 'blue',
  'Splurge': 'pink',
  'Smile': 'teal',
  'Fire Extinguisher': 'amber',
} as const;

interface BucketBadgeProps {
  bucket: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'filled' | 'outline' | 'dot';
}

export function BucketBadge({ bucket, size = 'sm', variant = 'light' }: BucketBadgeProps) {
  const color = BUCKET_COLORS[bucket as keyof typeof BUCKET_COLORS] || 'gray';
  const label = bucket.replace(/-/g, ' ');

  return (
    <Badge size={size} variant={variant} color={color} tt="capitalize">
      {label}
    </Badge>
  );
}
