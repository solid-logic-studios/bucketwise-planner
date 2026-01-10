import { Group, Text, ThemeIcon, Tooltip } from '@mantine/core';
import { IconChartBar } from '@tabler/icons-react';

interface TokenUsageIndicatorProps {
  totalTokens: number;
}

/**
 * TokenUsageIndicator: Displays token usage with color-coded status.
 * 
 * Color coding:
 * - Green: < 5,000 tokens (efficient)
 * - Yellow: 5,000 - 10,000 tokens (moderate)
 * - Red: > 10,000 tokens (high usage)
 * 
 * @example
 * ```tsx
 * <TokenUsageIndicator totalTokens={3500} />
 * ```
 */
export function TokenUsageIndicator({ totalTokens }: TokenUsageIndicatorProps) {
  const getColor = (tokens: number): string => {
    if (tokens < 5000) return 'teal';
    if (tokens < 10000) return 'yellow';
    return 'red';
  };

  const getTooltip = (tokens: number): string => {
    if (tokens < 5000) return 'Efficient usage';
    if (tokens < 10000) return 'Moderate usage';
    return 'High usage - consider clearing history';
  };

  const color = getColor(totalTokens);
  const tooltip = getTooltip(totalTokens);

  return (
    <Tooltip label={tooltip}>
      <Group gap="xs" style={{ cursor: 'help' }}>
        <ThemeIcon size="sm" variant="light" color={color}>
          <IconChartBar size={14} />
        </ThemeIcon>
        <Text size="xs" c={color}>
          {totalTokens.toLocaleString()} tokens
        </Text>
      </Group>
    </Tooltip>
  );
}
