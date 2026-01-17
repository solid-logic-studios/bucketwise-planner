import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    Card,
    Group,
    Modal,
    NumberInput,
    SegmentedControl,
    SimpleGrid,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
    Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedValue, useHotkeys } from '@mantine/hooks';
import { IconBulb, IconQuestionMark } from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import type { DebtDTO, DebtPayoffPlanDTO, ProfileDTO } from '../api/types.js';
import { DebtPayoffMilestones } from '../components/charts/DebtPayoffMilestones.js';
import { DebtSnowballGanttChart } from '../components/charts/DebtSnowballGanttChart.js';
import { ErrorAlert } from '../components/ErrorAlert.js';
import { useHelp } from '../components/HelpDrawer.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { usePageDataContext } from '../contexts/PageContextProvider.js';
import { formatCurrency } from '../utils/formatters.js';

const bucketOptions = [
  'Daily Expenses',
  'Splurge',
  'Smile',
  'Fire Extinguisher',
  'Mojo',
  'Grow',
] as const;

interface DebtsState {
  data?: DebtPayoffPlanDTO;
  loading: boolean;
  error?: string;
}

interface DebtsListState {
  items: DebtDTO[];
  loading: boolean;
  error?: string;
}

interface DebtFormValues {
  name: string;
  debtType: 'credit-card' | 'mortgage';
  originalAmountDollars: number;
  currentBalanceDollars: number;
  interestRatePercent: number;
  minimumPaymentDollars: number;
  priority: number;
}

export function DebtsView() {
  const { openHelp } = useHelp();
  useHotkeys([
    ['mod+/', () => openHelp('debts')],
  ]);
  const { setPageData } = usePageDataContext();
  const [fireExtinguisherDollars, setFireExtinguisherDollars] = useState<number>(500);
  const [frequency, setFrequency] = useState<'fortnight' | 'month'>('fortnight');
  const [debouncedAmount] = useDebouncedValue(fireExtinguisherDollars, 500);
  const [state, setState] = useState<DebtsState>({ loading: true });
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [currentFortnightId, setCurrentFortnightId] = useState<string | null>(null);
  const [debtsState, setDebtsState] = useState<DebtsListState>({ items: [], loading: true });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string>();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string>();
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [recordSubmitting, setRecordSubmitting] = useState(false);
  const [recordError, setRecordError] = useState<string>();
  const [recordDebt, setRecordDebt] = useState<DebtDTO | null>(null);

  const recordForm = useForm<{ description: string; amountDollars: number; bucket: (typeof bucketOptions)[number] }>({
    initialValues: {
      description: '',
      amountDollars: 0,
      bucket: 'Fire Extinguisher',
    },
    validate: {
      description: (v) => (!v.trim() ? 'Description is required' : null),
      amountDollars: (v) => (v <= 0 ? 'Amount must be greater than 0' : null),
    },
  });

  const debtForm = useForm<DebtFormValues>({
    initialValues: {
      name: '',
      debtType: 'credit-card',
      originalAmountDollars: 0,
      currentBalanceDollars: 0,
      interestRatePercent: 0,
      minimumPaymentDollars: 0,
      priority: 1,
    },
    validate: {
      name: (v) => (!v.trim() ? 'Name is required' : null),
      originalAmountDollars: (v) => (v <= 0 ? 'Original amount must be > 0' : null),
      currentBalanceDollars: (v, values) => (v < 0 ? 'Balance cannot be negative' : v > values.originalAmountDollars ? 'Balance cannot exceed original' : null),
      interestRatePercent: (v) => (v < 0 ? 'Rate cannot be negative' : v > 36 ? 'Rate too high' : null),
      minimumPaymentDollars: (v) => (v < 0 ? 'Minimum payment cannot be negative' : null),
      priority: (v, values) => (values.debtType === 'mortgage' && v < 5 ? 'Mortgage priority must be >= 5' : v < 0 ? 'Priority cannot be negative' : null),
    },
  });

  const monthlyCents = useMemo(() => {
    const baseCents = Math.max(debouncedAmount, 0) * 100;
    if (frequency === 'fortnight') {
      // Keep as fortnightly - no conversion needed
      return Math.round(baseCents);
    }
    // Convert monthly to fortnightly
    return Math.round(baseCents * (12 / 26));
  }, [debouncedAmount, frequency]);

  // Seed from profile default fire extinguisher if available
  useEffect(() => {
    let cancelled = false;
    api
      .getProfile()
      .then((dto) => {
        if (cancelled) return;
        setProfile(dto);
        if (dto.defaultFireExtinguisherAmountCents > 0) {
          setFireExtinguisherDollars(dto.defaultFireExtinguisherAmountCents / 100);
          setFrequency('fortnight');
        }
      })
      .catch(() => {
        // non-blocking: keep manual entry
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadDebts = () => {
    setDebtsState((prev) => ({ ...prev, loading: true, error: undefined }));
    api
      .listDebts()
      .then((items) => {
        setDebtsState({ items, loading: false });
      })
      .catch((err) => {
        setDebtsState((prev) => ({ ...prev, loading: false, error: err.message }));
      });
  };

  // Load current fortnight on mount
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

  useEffect(() => {
    loadDebts();
  }, []);

  // Populate page context with debts list
  useEffect(() => {
    if (debtsState.items.length > 0) {
      // For debts list view, we could send all debts or the priority 1 debt
      // For context, sending priority 1 (the debt being paid) is most useful
      const priorityDebt = debtsState.items.find(d => d.priority === 1);
      if (priorityDebt) {
        setPageData({
          specificDebt: priorityDebt,
          debtId: priorityDebt.id,
        });
      }
    }
  }, [debtsState.items, setPageData]);

  const refreshPayoffPlan = useCallback(async () => {
    if (monthlyCents <= 0) return;

    setState((prev) => ({ ...prev, loading: true, error: undefined }));
    try {
      const data = await api.getDebtPayoffPlan(monthlyCents, new Date(), currentFortnightId ?? undefined);
      setState({ data, loading: false });
    } catch (err) {
      setState({ error: err instanceof Error ? err.message : 'Failed to load payoff plan', loading: false });
    }
  }, [monthlyCents, currentFortnightId]);

  useEffect(() => {
    if (debouncedAmount <= 0) return;
    refreshPayoffPlan();
  }, [debouncedAmount, refreshPayoffPlan]);

  const openRecordPayment = (debt: DebtDTO) => {
    setRecordDebt(debt);
    recordForm.setValues({
      description: `Debt payment: ${debt.name}`,
      amountDollars: debt.minimumPaymentCents / 100,
      bucket: 'Fire Extinguisher',
    });
    setRecordError(undefined);
    setRecordModalOpen(true);
  };

  const submitRecordPayment = async () => {
    if (!recordDebt) return;
    const validation = recordForm.validate();
    if (validation.hasErrors) return;

    setRecordSubmitting(true);
    setRecordError(undefined);

    try {
      await api.recordTransaction({
        sourceBucket: recordForm.values.bucket,
        kind: 'expense',
        description: recordForm.values.description,
        amountCents: Math.round(recordForm.values.amountDollars * 100),
        occurredAt: new Date().toISOString(),
        tags: ['debt-payment', recordDebt.debtType],
        debtId: recordDebt.id,
      });

      setRecordModalOpen(false);
      setRecordDebt(null);
      loadDebts();
      await refreshPayoffPlan();
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setRecordSubmitting(false);
    }
  };

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between" align="center">
        <Group gap="xs" align="center">
          <Title order={2}>Debt Payoff Plan</Title>
          <Tooltip label="Open Debts help (⌘/Ctrl + /)" withArrow position="bottom">
            <ActionIcon variant="light" onClick={() => openHelp('debts')} aria-label="Open help">
              <IconQuestionMark size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Button size="sm" variant="light" onClick={() => setAddModalOpen(true)}>
          Add Debt
        </Button>
      </Group>

      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          Track debts to power the payoff plan.
        </Text>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Text size="sm" fw={600}>
            Configure Fire Extinguisher Allocation
          </Text>

          <SegmentedControl
            value={frequency}
            onChange={(value) => setFrequency(value as 'fortnight' | 'month')}
            data={[
              { label: 'Fortnightly', value: 'fortnight' },
              { label: 'Monthly', value: 'month' },
            ]}
          />

          <NumberInput
            label={frequency === 'fortnight' ? 'Fortnightly Fire Extinguisher (AUD)' : 'Monthly Fire Extinguisher (AUD)'}
            description={
              frequency === 'fortnight'
                ? 'Amount you allocate every fortnight; will be converted to monthly for the payoff calculator'
                : 'Amount you allocate every month to debt repayment'
            }
            placeholder="500"
            value={fireExtinguisherDollars}
            onChange={(value) => setFireExtinguisherDollars(typeof value === 'number' ? value : 0)}
            min={0}
            decimalScale={2}
            fixedDecimalScale
            prefix="$"
            style={{ maxWidth: 300 }}
          />

          <Text size="sm" c="dimmed">
            Using {formatCurrency(monthlyCents)} per month for payoff calculation.
          </Text>

          <Alert icon={<IconBulb size={16} />} color="yellow" variant="light" radius="md">
            To keep annual totals consistent: monthly → fortnight = amount × (12/26); fortnight → monthly = amount × (26/12).
          </Alert>

          {profile && profile.defaultFireExtinguisherAmountCents > 0 && (
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                From profile: {formatCurrency(profile.defaultFireExtinguisherAmountCents)} per fortnight →
                {formatCurrency(Math.round(profile.defaultFireExtinguisherAmountCents * (26 / 12)))} per month
              </Text>
              <Button
                variant="light"
                size="xs"
                onClick={() => {
                  setFireExtinguisherDollars(profile.defaultFireExtinguisherAmountCents / 100);
                  setFrequency('fortnight');
                }}
              >
                Use profile amount
              </Button>
            </Group>
          )}
        </Stack>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text fw={600}>Your Debts</Text>
            <Button size="xs" variant="light" onClick={loadDebts}>
              Refresh
            </Button>
          </Group>

          {debtsState.loading && <LoadingSpinner />}
          {debtsState.error && <ErrorAlert title="Error loading debts" message={debtsState.error} />}

          {!debtsState.loading && !debtsState.error && debtsState.items.length === 0 && (
            <Text size="sm" c="dimmed">
              No debts yet. Add one to start tracking.
            </Text>
          )}

          {!debtsState.loading && !debtsState.error && debtsState.items.length > 0 && (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Balance</Table.Th>
                  <Table.Th>Rate</Table.Th>
                  <Table.Th>
                    <Group gap={6} align="center">
                      <Text>Min Payment</Text>
                      <Tooltip withArrow position="bottom" label="Monthly minimums convert to fortnightly using × (12/26) in the timeline.">
                        <ActionIcon variant="subtle" aria-label="Minimum payment conversion info" size="sm">
                          <IconBulb size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Th>
                  <Table.Th>Priority</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {debtsState.items.map((debt) => (
                  <Table.Tr key={debt.id}>
                    <Table.Td>{debt.name}</Table.Td>
                    <Table.Td>{debt.debtType}</Table.Td>
                    <Table.Td>{formatCurrency(debt.currentBalanceCents)}</Table.Td>
                    <Table.Td>{(debt.interestRate * 100).toFixed(2)}%</Table.Td>
                    <Table.Td>
                      <Stack gap={2}>
                        <Group gap={6} align="center">
                          <Text fw={500}>{formatCurrency(debt.minimumPaymentCents)}</Text>
                          <Badge size="xs" variant="light" color="gray">
                            {debt.minPaymentFrequency === 'MONTHLY' ? 'Monthly' : 'Fortnightly'}
                          </Badge>
                        </Group>
                        {debt.minPaymentFrequency === 'MONTHLY' && (
                          <Text size="xs" c="dimmed">
                            ≈ {formatCurrency(Math.round(debt.minimumPaymentCents * (12 / 26)))} per fortnight
                          </Text>
                        )}
                      </Stack>
                    </Table.Td>
                    <Table.Td>{debt.priority}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button size="xs" variant="light" onClick={() => openRecordPayment(debt)}>
                          Record Payment
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setEditingDebtId(debt.id);
                            debtForm.setValues({
                              name: debt.name,
                              debtType: debt.debtType as 'credit-card' | 'mortgage',
                              originalAmountDollars: debt.originalAmountCents / 100,
                              currentBalanceDollars: debt.currentBalanceCents / 100,
                              interestRatePercent: debt.interestRate * 100,
                              minimumPaymentDollars: debt.minimumPaymentCents / 100,
                              priority: debt.priority,
                            });
                            setEditModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Card>

      {state.loading && <LoadingSpinner />}

      {state.error && <ErrorAlert title="Error loading payoff plan" message={state.error} />}

      {state.data && (
        <PayoffPlanContent
          plan={state.data}
          currentFortnightId={currentFortnightId ?? undefined}
        />
      )}

      <Modal
        opened={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        title={recordDebt ? `Record payment for ${recordDebt.name}` : 'Record payment'}
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Bucket: Fire Extinguisher — tagged as debt payment.
          </Text>

          <SegmentedControl
            fullWidth
            value={recordForm.values.bucket}
            onChange={(value) => recordForm.setFieldValue('bucket', value as (typeof bucketOptions)[number])}
            data={bucketOptions.map((bucket) => ({ label: bucket, value: bucket }))}
          />

          <TextInput label="Description" required {...recordForm.getInputProps('description')} />

          <NumberInput
            label="Amount (AUD)"
            required
            min={0}
            decimalScale={2}
            fixedDecimalScale
            prefix="$"
            {...recordForm.getInputProps('amountDollars')}
          />

          {recordError && <ErrorAlert message={recordError} />}

          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setRecordModalOpen(false)} disabled={recordSubmitting}>
              Cancel
            </Button>
            <Button onClick={submitRecordPayment} loading={recordSubmitting} disabled={!recordDebt}>
              Save Payment
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Debt" size="lg">
        <form
          onSubmit={debtForm.onSubmit(async (values) => {
            setAddSubmitting(true);
            setAddError(undefined);
            try {
              await api.createDebt({
                name: values.name,
                debtType: values.debtType,
                originalAmountCents: Math.round(values.originalAmountDollars * 100),
                currentBalanceCents: Math.round(values.currentBalanceDollars * 100),
                interestRate: values.interestRatePercent / 100,
                minimumPaymentCents: Math.round(values.minimumPaymentDollars * 100),
                priority: values.priority,
              });
              debtForm.reset();
              setAddModalOpen(false);
              loadDebts();
            } catch (err) {
              setAddError(err instanceof Error ? err.message : 'Failed to add debt');
            } finally {
              setAddSubmitting(false);
            }
          })}
        >
          <Stack gap="md">
            <Group grow align="flex-start">
              <NumberInput
                label="Original Amount (AUD)"
                min={0}
                decimalScale={2}
                fixedDecimalScale
                prefix="$"
                required
                {...debtForm.getInputProps('originalAmountDollars')}
              />
              <NumberInput
                label="Current Balance (AUD)"
                min={0}
                decimalScale={2}
                fixedDecimalScale
                prefix="$"
                required
                {...debtForm.getInputProps('currentBalanceDollars')}
              />
            </Group>

            <Group grow align="flex-start">
              <NumberInput
                label="Interest Rate (%)"
                min={0}
                max={36}
                decimalScale={2}
                fixedDecimalScale
                suffix="%"
                required
                {...debtForm.getInputProps('interestRatePercent')}
              />

              <NumberInput
                label="Minimum Payment (AUD)"
                min={0}
                decimalScale={2}
                fixedDecimalScale
                prefix="$"
                required
                {...debtForm.getInputProps('minimumPaymentDollars')}
              />
            </Group>

            <Group grow align="flex-start">
              <NumberInput
                label="Priority"
                min={0}
                required
                {...debtForm.getInputProps('priority')}
              />

              <SegmentedControl
                data={[
                  { label: 'Credit Card', value: 'credit-card' },
                  { label: 'Mortgage', value: 'mortgage' },
                ]}
                {...debtForm.getInputProps('debtType')}
              />
            </Group>

            <TextInput
              label="Name"
              placeholder="e.g., Visa, Home Loan"
              required
              {...debtForm.getInputProps('name')}
            />

            {addError && <ErrorAlert message={addError} />}

            <Group justify="flex-end">
              <Button variant="subtle" onClick={() => setAddModalOpen(false)} disabled={addSubmitting}>
                Cancel
              </Button>
              <Button type="submit" loading={addSubmitting}>
                Add Debt
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal opened={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Debt" size="lg">
        <form
          onSubmit={debtForm.onSubmit(async (values) => {
            if (!editingDebtId) return;
            setEditSubmitting(true);
            setEditError(undefined);
            try {
              await api.updateDebt(editingDebtId, {
                name: values.name,
                debtType: values.debtType,
                originalAmountCents: Math.round(values.originalAmountDollars * 100),
                currentBalanceCents: Math.round(values.currentBalanceDollars * 100),
                interestRate: values.interestRatePercent / 100,
                minimumPaymentCents: Math.round(values.minimumPaymentDollars * 100),
                priority: values.priority,
              });
              setEditModalOpen(false);
              setEditingDebtId(null);
              loadDebts();
            } catch (err) {
              setEditError(err instanceof Error ? err.message : 'Failed to update debt');
            } finally {
              setEditSubmitting(false);
            }
          })}
        >
          <Stack gap="md">
            <Group grow align="flex-start">
              <NumberInput
                label="Original Amount (AUD)"
                min={0}
                decimalScale={2}
                fixedDecimalScale
                prefix="$"
                required
                {...debtForm.getInputProps('originalAmountDollars')}
              />
              <NumberInput
                label="Current Balance (AUD)"
                min={0}
                decimalScale={2}
                fixedDecimalScale
                prefix="$"
                required
                {...debtForm.getInputProps('currentBalanceDollars')}
              />
            </Group>

            <Group grow align="flex-start">
              <NumberInput
                label="Interest Rate (%)"
                min={0}
                max={36}
                decimalScale={2}
                fixedDecimalScale
                suffix="%"
                required
                {...debtForm.getInputProps('interestRatePercent')}
              />

              <NumberInput
                label="Minimum Payment (AUD)"
                min={0}
                decimalScale={2}
                fixedDecimalScale
                prefix="$"
                required
                {...debtForm.getInputProps('minimumPaymentDollars')}
              />
            </Group>

            <Group grow align="flex-start">
              <NumberInput
                label="Priority"
                min={0}
                required
                {...debtForm.getInputProps('priority')}
              />

              <SegmentedControl
                data={[
                  { label: 'Credit Card', value: 'credit-card' },
                  { label: 'Mortgage', value: 'mortgage' },
                ]}
                {...debtForm.getInputProps('debtType')}
              />
            </Group>

            <TextInput
              label="Name"
              placeholder="e.g., Visa, Home Loan"
              required
              {...debtForm.getInputProps('name')}
            />

            {editError && <ErrorAlert message={editError} />}

            <Group justify="flex-end">
              <Button variant="subtle" onClick={() => setEditModalOpen(false)} disabled={editSubmitting}>
                Cancel
              </Button>
              <Button type="submit" loading={editSubmitting}>
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

function PayoffPlanContent({ plan, currentFortnightId }: { plan: DebtPayoffPlanDTO; currentFortnightId?: string }) {
  const { totalFortnightsToPayoff, totalInterestCents, timeline } = plan;

  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Total Time to Debt-Free
            </Text>
            <Text size="xl" fw={700}>
              {totalFortnightsToPayoff} fortnights
            </Text>
            <Text size="sm" c="dimmed">
              {(totalFortnightsToPayoff / 26).toFixed(1)} years
            </Text>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Total Interest Paid
            </Text>
            <Text size="xl" fw={700} c="red">
              {formatCurrency(totalInterestCents)}
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      <Title order={3}>Fortnight-by-Fortnight Timeline</Title>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Payment Date</Table.Th>
              <Table.Th>Paying Off</Table.Th>
              <Table.Th>Payment</Table.Th>
              <Table.Th>Remaining</Table.Th>
              <Table.Th>Total Debt Left</Table.Th>
              <Table.Th>Interest</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {timeline.map((period) => (
              <>
                <Table.Tr key={period.fortnight}>
                  <Table.Td>
                    <Text fw={600}>{new Date(period.paymentDate).toLocaleDateString()}</Text>
                  </Table.Td>
                  <Table.Td>
                    {period.debtBeingPaid ? (
                      <Group gap={4}>
                        <Badge size="sm" variant="filled" color="blue">
                          {period.debtBeingPaid.name}
                        </Badge>
                        {period.debtsPaidOffThisMonth.length > 0 && (
                          <Text size="xs" c="green" fw={500}>
                            + {period.debtsPaidOffThisMonth.map(d => d.name).join(', ')} paid off!
                          </Text>
                        )}
                      </Group>
                    ) : (
                      <Text c="green" fw={600} size="sm">
                        ✓ Debt Free!
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600}>{formatCurrency(period.paymentToActiveDebtCents)}</Text>
                  </Table.Td>
                  <Table.Td>
                    {period.debtBeingPaid ? (
                      <Text>{formatCurrency(period.remainingBalanceOfActiveDebtCents)}</Text>
                    ) : (
                      <Text c="dimmed">—</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600}>{formatCurrency(period.totalDebtRemainingCents)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {formatCurrency(period.interestCents)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
                
                {/* Minimum payments on other debts */}
                {period.minimumPaymentsOnOtherDebts && period.minimumPaymentsOnOtherDebts.length > 0 && (
                  period.minimumPaymentsOnOtherDebts.map((minPayment) => (
                    <Table.Tr key={`${period.fortnight}-${minPayment.debtId}`} style={{ opacity: 0.7 }}>
                      <Table.Td />
                      <Table.Td>
                        <Group gap={4}>
                          <Badge size="xs" variant="light" color="gray">
                            {minPayment.debtName}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            (minimum)
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatCurrency(minPayment.minimumPaymentCents)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatCurrency(minPayment.remainingBalanceCents)}</Text>
                      </Table.Td>
                      <Table.Td />
                      <Table.Td />
                    </Table.Tr>
                  ))
                )}
              </>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Payoff timeline visualization */}
      <DebtSnowballGanttChart currentFortnightId={currentFortnightId ?? undefined} />
      <DebtPayoffMilestones currentFortnightId={currentFortnightId ?? undefined} />
    </Stack>
  );
}
