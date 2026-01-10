import {
  ActionIcon,
  Badge,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { IconQuestionMark } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import type { DashboardDTO, ProfileDTO } from '../api/types.js';
import { BucketBadge } from '../components/BucketBadge.js';
import { DebtPayoffMilestones } from '../components/charts/DebtPayoffMilestones.js';
import { DebtSnowballGanttChart } from '../components/charts/DebtSnowballGanttChart.js';
import { DebtTypeBadge } from '../components/DebtTypeBadge.js';
import { EmptyState } from '../components/EmptyState.js';
import { ErrorAlert } from '../components/ErrorAlert.js';
import { useHelp } from '../components/HelpDrawer.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { usePageDataContext } from '../contexts/PageContextProvider.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

interface DashboardState {
  data?: DashboardDTO;
  loading: boolean;
  error?: string;
}

export function DashboardView() {
  const { openHelp } = useHelp();
  useHotkeys([
    ['mod+/', () => openHelp('dashboard')],
  ]);
  const { setPageData } = usePageDataContext();
  const [state, setState] = useState<DashboardState>({ loading: true });
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string>();
  const [currentFortnightId, setCurrentFortnightId] = useState<string | null>(null);

  // Load current fortnight first
  useEffect(() => {
    let cancelled = false;
    api
      .listFortnights()
      .then((fortnights) => {
        if (cancelled) return;
        // First fortnight is current
        if (fortnights.length > 0) {
          setCurrentFortnightId(fortnights[0].id);
        }
      })
      .catch(() => {
        // non-blocking: continue without fortnight ID
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Share fortnight ID with page context
  useEffect(() => {
    if (currentFortnightId) {
      setPageData({ fortnightId: currentFortnightId });
    }
  }, [currentFortnightId, setPageData]);

  // Load dashboard when fortnight ID is available
  useEffect(() => {
    let cancelled = false;
    api
      .getDashboard(currentFortnightId ?? undefined)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false });
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [currentFortnightId]);

  useEffect(() => {
    let cancelled = false;
    api
      .getProfile()
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
          setProfileLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setProfileLoading(false);
          setProfileError(err.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return <LoadingSpinner />;
  }

  if (state.error) {
    return <ErrorAlert message={state.error} />;
  }

  const dashboard = state.data;

  const totalRecurringCents = profile?.fixedExpenses?.reduce((sum, exp) => sum + exp.amountCents, 0) ?? 0;
  const topRecurring = profile?.fixedExpenses
    ? [...profile.fixedExpenses].sort((a, b) => b.amountCents - a.amountCents).slice(0, 5)
    : [];
  const recurringShare = profile?.fortnightlyIncomeCents
    ? Math.round((totalRecurringCents / profile.fortnightlyIncomeCents) * 100)
    : 0;
  const recurringBadgeColor = recurringShare > 70 ? 'red' : recurringShare > 50 ? 'yellow' : 'green';

  if (!dashboard) {
    return <EmptyState message="Nothing to display yet. Create a fortnight and add transactions." />;
  }

  const { currentFortnight, debts } = dashboard;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="baseline">
        <Group gap="xs" align="center">
          <Title order={2}>Dashboard</Title>
          <Tooltip label="Open Dashboard help (⌘/Ctrl + /)" withArrow position="bottom">
            <ActionIcon variant="light" onClick={() => openHelp('dashboard')} aria-label="Open help">
              <IconQuestionMark size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Badge color="accent" variant="light">
          Live
        </Badge>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Text c="dimmed" size="sm">
            💳 Consumer Debt
          </Text>
          <Text fw={600} size="lg" c={dashboard.consumerDebtCents > 0 ? 'red' : 'green'}>
            {formatCurrency(dashboard.consumerDebtCents)}
          </Text>
          <Text size="sm" c="dimmed">
            {dashboard.consumerDebtCents > 0 ? 'Attack with FE!' : 'Debt-free! 🎉'}
          </Text>
        </Card>

        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Text c="dimmed" size="sm">
            🏠 Mortgage Balance
          </Text>
          <Text fw={600} size="lg">
            {formatCurrency(dashboard.mortgageBalanceCents)}
          </Text>
          <Text size="sm" c="dimmed">
            Debt-free in {dashboard.debtFreeInMonths} months
          </Text>
        </Card>

        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Text c="dimmed" size="sm">
            Net Worth
          </Text>
          <Text fw={600} size="lg">
            {formatCurrency(dashboard.netWorthCents)}
          </Text>
          <Text size="sm" c="dimmed">
            Savings 6 mo: {formatCurrency(dashboard.projectedSavingsIn6Months)}
          </Text>
        </Card>

        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Text c="dimmed" size="sm">
            Income (period)
          </Text>
          <Text fw={600} size="lg">
            {formatCurrency(dashboard.totalIncomeCents)}
          </Text>
        </Card>

        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Text c="dimmed" size="sm">
            Expenses (period)
          </Text>
          <Text fw={600} size="lg">
            {formatCurrency(dashboard.totalExpensesCents)}
          </Text>
        </Card>
      </SimpleGrid>

      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Recurring Expenses</Text>
              <Text size="sm" c="dimmed">
                Per fortnight total
              </Text>
            </div>
            <Group gap="xs">
              <Badge color="accent" variant="light">
                {profileLoading ? 'Loading…' : formatCurrency(totalRecurringCents)}
              </Badge>
              {!profileLoading && profile && (
                <Badge color={recurringBadgeColor} variant="light">
                  {recurringShare}% of income
                </Badge>
              )}
            </Group>
          </Group>

          {profileError && <ErrorAlert message={profileError} />}

          {!profileLoading && !profileError && (!profile || profile.fixedExpenses.length === 0) && (
            <Text size="sm" c="dimmed">
              No recurring expenses configured yet.
            </Text>
          )}

          {!profileLoading && !profileError && topRecurring.length > 0 && (
            <Stack gap="xs">
              {topRecurring.map((expense) => (
                <Group key={expense.id ?? expense.name} justify="space-between" align="center">
                  <Group gap="xs">
                    <Text size="sm">{expense.name}</Text>
                    <BucketBadge bucket={expense.bucket} />
                  </Group>
                  <Text size="sm" fw={600}>
                    {formatCurrency(expense.amountCents)}
                  </Text>
                </Group>
              ))}
              {profile && profile.fixedExpenses.length > 5 && (
                <Text size="xs" c="dimmed">
                  Showing top 5 by amount.
                </Text>
              )}
            </Stack>
          )}
        </Stack>
      </Card>

      {currentFortnight ? (
        <Card withBorder shadow="sm">
          <Stack gap="sm">
            <Group justify="space-between">
              <div>
                <Text fw={600}>Current Fortnight</Text>
                <Text size="sm" c="dimmed">
                  {formatDate(currentFortnight.periodStart)} → {formatDate(currentFortnight.periodEnd)}
                </Text>
              </div>
              <Badge color="amber" variant="light">
                Fire Extinguisher: {formatCurrency(currentFortnight.fireExtinguisherAmountCents)}
              </Badge>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 2 }}>
              {currentFortnight.bucketBreakdowns.map((bucket) => (
                <Card key={bucket.bucket} withBorder radius="md">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Text fw={600}>{bucket.bucket}</Text>
                      <Text size="sm" c="dimmed">
                        Allocated {(bucket.allocatedPercent * 100).toFixed(0)}%
                      </Text>
                    </div>
                    <Badge color="accent" variant="light">
                      {formatCurrency(bucket.remainingCents)} left
                    </Badge>
                  </Group>
                  <Text size="sm" mt="xs">
                    Spent {formatCurrency(bucket.spentCents)} / {formatCurrency(bucket.allocatedCents)}
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Card>
      ) : (
        <EmptyState message="No current fortnight yet. Create one to see bucket breakdowns." />
      )}

      <Card withBorder shadow="sm">
        <Stack gap="sm">
          <Group justify="space-between" align="baseline">
            <Title order={4}>Debts</Title>
            <Text size="sm" c="dimmed">Payoff timeline and milestones</Text>
          </Group>

          <Stack gap="sm">
            <DebtSnowballGanttChart currentFortnightId={currentFortnightId ?? undefined} />
            <DebtPayoffMilestones currentFortnightId={currentFortnightId ?? undefined} />
          </Stack>

          <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Balance</Table.Th>
                <Table.Th>Min Payment</Table.Th>
                <Table.Th>Priority</Table.Th>
                <Table.Th>Fortnights to Payoff</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {debts.map((debt) => (
                <Table.Tr key={debt.id}>
                  <Table.Td>{debt.name}</Table.Td>
                  <Table.Td>
                    <DebtTypeBadge debtType={debt.debtType} />
                  </Table.Td>
                  <Table.Td>{formatCurrency(debt.currentBalanceCents)}</Table.Td>
                  <Table.Td>{formatCurrency(debt.minimumPaymentCents)}</Table.Td>
                  <Table.Td>{debt.priority}</Table.Td>
                  <Table.Td>{debt.monthsToPayoff}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>
    </Stack>
  );
}
