import { Badge, Card, Group, Stack, Text, Tooltip } from '@mantine/core';
import type { FortnightDetailDTO } from '../../api/types.js';
import { formatCurrency } from '../../utils/formatters.js';

interface SummaryCardsProps {
  isHistoricalFortnight: boolean;
  incomeRecorded: boolean;
  plannedPaymentsCount: number;
  completedPaymentsCount: number;
  skippedPaymentsCount: number;
  fortnightDetail: FortnightDetailDTO | null;
  budgetVariance: { spent: number; allocated: number; variance: number; percentageVar: number };
}

export function SummaryCards({
  isHistoricalFortnight,
  incomeRecorded,
  plannedPaymentsCount,
  completedPaymentsCount,
  skippedPaymentsCount,
  fortnightDetail,
  budgetVariance,
}: SummaryCardsProps) {
  return (
    <Group gap="md" wrap="wrap">
      <Tooltip label="Whether you've recorded income for this fortnight" withArrow position="bottom">
        <Card shadow="sm" padding="sm" radius="md" withBorder>
          <Text size="sm" fw={600}>
            Income
          </Text>
          {isHistoricalFortnight ? (
            <Badge color={incomeRecorded ? 'green' : 'red'} variant="filled" size="sm">
              {incomeRecorded ? '✓ Recorded' : '✗ Not recorded'}
            </Badge>
          ) : (
            <Text size="sm" c={incomeRecorded ? 'green' : 'red'}>
              {incomeRecorded ? 'Recorded' : 'Not recorded'}
            </Text>
          )}
        </Card>
      </Tooltip>

      <Tooltip label="Tracks both the priority debt payment (Snowball) and minimum payments on other debts for this fortnight" withArrow position="bottom">
        <Card shadow="sm" padding="sm" radius="md" withBorder>
          <Text size="sm" fw={600}>
            Debt Payments
          </Text>
          {isHistoricalFortnight ? (
            <Stack gap={4}>
              <Badge color="blue" variant="filled" size="sm">
                {completedPaymentsCount}/{plannedPaymentsCount} completed
              </Badge>
              {skippedPaymentsCount > 0 && (
                <Text size="xs" c="red">({skippedPaymentsCount} skipped)</Text>
              )}
            </Stack>
          ) : (
            <Text size="sm">
              {plannedPaymentsCount === 0
                ? 'No payments'
                : `${completedPaymentsCount}/${plannedPaymentsCount} done`}
            </Text>
          )}
        </Card>
      </Tooltip>

      <Tooltip label="How much you've spent against your budget allocations for this fortnight" withArrow position="bottom">
        <Card shadow="sm" padding="sm" radius="md" withBorder>
          <Text size="sm" fw={600}>
            Budget
          </Text>
          {isHistoricalFortnight ? (
            (() => {
              if (!fortnightDetail) return <Text size="sm" c="dimmed">No data yet</Text>;
              if (budgetVariance.allocated === 0) return <Text size="sm" c="dimmed">No allocations</Text>;
              const color = budgetVariance.variance === 0 ? 'green' : budgetVariance.variance < 0 ? 'green' : 'red';
              return (
                <Stack gap={2}>
                  <Badge color={color} variant="filled" size="sm">
                    {budgetVariance.variance === 0
                      ? 'On budget'
                      : budgetVariance.variance < 0
                        ? `Under by ${formatCurrency(Math.abs(budgetVariance.variance))}`
                        : `Over by ${formatCurrency(budgetVariance.variance)}`}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {formatCurrency(budgetVariance.spent)} / {formatCurrency(budgetVariance.allocated)}
                  </Text>
                </Stack>
              );
            })()
          ) : (
            <Text size="sm">
              {(() => {
                if (!fortnightDetail) return 'No data yet';
                const totalAllocated = fortnightDetail.bucketBreakdowns.reduce((sum, b) => sum + b.allocatedCents, 0);
                const totalSpent = fortnightDetail.bucketBreakdowns.reduce((sum, b) => sum + b.spentCents, 0);
                if (totalAllocated === 0) return 'No allocations';
                const remaining = totalAllocated - totalSpent;
                if (remaining < 0) return `Over by ${formatCurrency(Math.abs(remaining))}`;
                return `Remaining ${formatCurrency(remaining)}`;
              })()}
            </Text>
          )}
        </Card>
      </Tooltip>
    </Group>
  );
}
