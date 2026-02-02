import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useHotkeys } from '@mantine/hooks';
import { IconExternalLink, IconPlus, IconQuestionMark } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import type { ForthnightSummaryDTO, FortnightDetailDTO } from '../api/types.js';
import { EmptyState } from '../components/EmptyState.js';
import { ErrorAlert } from '../components/ErrorAlert.js';
import { useHelp } from '../components/help/useHelp.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { usePageDataContext } from '../contexts/usePageDataContext.ts';
import { formatCurrency, formatDate, formatPercent } from '../utils/formatters.js';

interface FortnightState {
  data?: FortnightDetailDTO;
  loading: boolean;
  error?: string;
}

interface CreateFortnightFormValues {
  periodStart: Date | null;
  periodEnd: Date | null;
}

export function FortnightView() {
  const { openHelp } = useHelp();
  useHotkeys([
    ['mod+/', () => openHelp('fortnight')],
  ]);
  const { setPageData } = usePageDataContext();
  const [fortnightId, setFortnightId] = useState<string>('');
  const [fortnights, setFortnights] = useState<ForthnightSummaryDTO[]>([]);
  const [forthnightsLoading, setForthnightsLoading] = useState(false);
  const [state, setState] = useState<FortnightState>({ loading: false });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const form = useForm<CreateFortnightFormValues>({
    initialValues: {
      periodStart: null,
      periodEnd: null,
    },
    validate: {
      periodStart: (value) => (!value ? 'Start date is required' : null),
      periodEnd: (value, values) => {
        if (!value) return 'End date is required';
        if (values.periodStart && value <= values.periodStart) {
          return 'End date must be after start date';
        }
        return null;
      },
    },
  });

  // Load list of fortnights on mount
  useEffect(() => {
    let cancelled = false;
    setForthnightsLoading(true);

    api
      .listFortnights()
      .then((data) => {
        if (!cancelled) {
          setFortnights(data);
          // Auto-select latest fortnight
          if (data.length > 0 && data[0]) {
            setFortnightId(data[0].id);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load fortnights:', err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setForthnightsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!fortnightId) return;

    let cancelled = false;
    setState({ loading: true });

    api
      .getFortnight(fortnightId)
      .then((data) => {
        if (!cancelled) {
          setState({ data, loading: false });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ error: err.message, loading: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fortnightId]);

  // Populate page context with fortnight snapshot data
  useEffect(() => {
    if (state.data) {
      setPageData({
        fortnightSnapshot: state.data,
        fortnightId: fortnightId,
      });
    }
  }, [state.data, fortnightId, setPageData]);

  const handleCreateSubmit = async (values: CreateFortnightFormValues) => {
    if (!values.periodStart || !values.periodEnd) return;

    setSubmitting(true);
    setSubmitError(undefined);

    try {
      // Ensure dates are Date objects
      const startDate = values.periodStart instanceof Date ? values.periodStart : new Date(values.periodStart);
      const endDate = values.periodEnd instanceof Date ? values.periodEnd : new Date(values.periodEnd);

      const result = await api.createFortnight({
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
        allocations: [
          { bucket: 'Daily Expenses', percent: 0.6 },
          { bucket: 'Splurge', percent: 0.1 },
          { bucket: 'Smile', percent: 0.1 },
          { bucket: 'Fire Extinguisher', percent: 0.2 },
        ],
      });

      form.reset();
      setCreateModalOpen(false);

      // Refresh the list and auto-select the new fortnight
      const updated = await api.listFortnights();
      setFortnights(updated);
      setFortnightId(result.fortnightId);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create fortnight');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between" align="center">
        <Group gap="xs" align="center">
          <Title order={2}>Fortnight Details</Title>
          <Tooltip label="Open Fortnight help (⌘/Ctrl + /)" withArrow position="bottom">
            <ActionIcon variant="light" onClick={() => openHelp('fortnight')} aria-label="Open help">
              <IconQuestionMark size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Button leftSection={<IconPlus size={18} />} onClick={() => setCreateModalOpen(true)}>
          Create Fortnight
        </Button>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Select a fortnight to view details
          </Text>
          {forthnightsLoading ? (
            <LoadingSpinner />
          ) : (
            <Select
              label="Fortnight"
              placeholder="Choose a fortnight"
              value={fortnightId}
              onChange={(value) => {
                if (value) {
                  setFortnightId(value);
                }
              }}
              data={fortnights.map((f) => ({
                value: f.id,
                label: `${formatDate(f.periodStart)} – ${formatDate(f.periodEnd)}`,
              }))}
              searchable
              clearable={false}
            />
          )}
        </Stack>
      </Card>

      {state.loading && <LoadingSpinner />}

      {state.error && <ErrorAlert title="Error loading fortnight" message={state.error} />}

      {state.data && <FortnightContent fortnight={state.data} />}

      <Modal opened={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Fortnight" size="md">
        <form onSubmit={form.onSubmit(handleCreateSubmit)}>
          <Stack gap="md">
            <EmptyState
              title="Bucketwise Planner Allocations"
              message="This will create a fortnight with the preset Bucketwise Planner allocations:"
            >
              <Stack gap={4} mt="xs">
                <Text size="sm">• Daily Expenses: 60%</Text>
                <Text size="sm">• Splurge: 10%</Text>
                <Text size="sm">• Smile: 10%</Text>
                <Text size="sm">• Fire Extinguisher: 20%</Text>
              </Stack>
            </EmptyState>

            <DatePickerInput
              label="Period Start Date"
              placeholder="Pick start date"
              required
              clearable
              {...form.getInputProps('periodStart')}
            />

            <DatePickerInput
              label="Period End Date"
              placeholder="Pick end date"
              required
              clearable
              {...form.getInputProps('periodEnd')}
            />

            {submitError && <ErrorAlert message={submitError} />}

            <Group justify="flex-end">
              <Button variant="subtle" onClick={() => setCreateModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Create Fortnight
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

function FortnightContent({ fortnight }: { fortnight: FortnightDetailDTO }) {
  return (
    <Stack gap="lg">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Period
              </Text>
              <Text size="lg" fw={600}>
                {formatDate(fortnight.periodStart)} – {formatDate(fortnight.periodEnd)}
              </Text>
            </div>
            <Badge size="lg" variant="filled" color="amber">
              Fire: {formatCurrency(fortnight.fireExtinguisherAmountCents)}
            </Badge>
          </Group>
        </Stack>
      </Card>

      {fortnight.totalIncomeCents === 0 && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="xs">
            <Text size="sm" fw={600}>No income recorded for this fortnight</Text>
            <Text size="sm" c="dimmed">
              After creating a fortnight, record your income to allocate bucket budgets.
            </Text>
            <Group>
              <Button
                variant="light"
                size="xs"
                rightSection={<IconExternalLink size={14} />}
                component="a"
                href={`#transactions?fortnightId=${fortnight.id}`}
              >
                Go to Transactions
              </Button>
            </Group>
          </Stack>
        </Card>
      )}

      <Title order={3}>Bucket Breakdowns</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        {fortnight.bucketBreakdowns.map((bucket) => {
          const allocated = bucket.allocatedCents;
          const spent = bucket.spentCents;
          const remaining = bucket.remainingCents;
          const percentAllocated = bucket.allocatedPercent;

          return (
            <Card key={bucket.bucket} shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" fw={600} tt="capitalize">
                    {bucket.bucket}
                  </Text>
                  <Badge size="sm" variant="light">
                    {formatPercent(percentAllocated)}
                  </Badge>
                </Group>

                <Text size="xl" fw={700}>
                  {formatCurrency(remaining)} left
                </Text>

                <Text size="sm" c="dimmed">
                  Spent {formatCurrency(spent)} / {formatCurrency(allocated)}
                </Text>

                <Button
                  variant="light"
                  size="xs"
                  rightSection={<IconExternalLink size={14} />}
                  component="a"
                  href={`#transactions?bucket=${bucket.bucket}&fortnightId=${fortnight.id}`}
                >
                  View Transactions
                </Button>
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>

      {/* TODO: Add transaction timeline/chart for this fortnight */}
    </Stack>
  );
}
