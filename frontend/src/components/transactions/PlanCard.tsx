import { Badge, Button, Card, Checkbox, Group, Progress, Stack, Text, Tooltip } from '@mantine/core';
import type {
    FortnightDetailDTO,
    FortnightlyTimelineEntry,
    ProfileDTO,
    SkippedDebtPaymentDTO,
    TransactionDTO,
} from '../../api/types.js';
import { useThemeColors } from '../../hooks/useThemeColors.js';
import { formatCurrency } from '../../utils/formatters.js';
import { BucketBadge } from '../BucketBadge.js';
import { DebtTypeBadge } from '../DebtTypeBadge.js';
import { ErrorAlert } from '../ErrorAlert.js';
import { LoadingSpinner } from '../LoadingSpinner.js';

interface PlanCardProps {
  fortnightDetail: FortnightDetailDTO | null;
  detailLoading: boolean;
  detailError?: string;
  profile: ProfileDTO | null;
  transactions: TransactionDTO[];
  planLoading: boolean;
  planError?: string;
  fortnightEntry: FortnightlyTimelineEntry | null;
  skippedPayments: Record<string, SkippedDebtPaymentDTO>;
  isHistoricalFortnight: boolean;
  onRecurringRecord: (input: { bucket: string; name: string; amountCents: number }) => void;
  onPaymentCheckbox: (debtId: string, checked: boolean) => void;
  onRecordPayment: (debtId: string, debtName: string, amountCents: number) => void;
  onSkipPayment: (debtId: string, debtName: string, amountCents: number) => void;
  isPaymentCompleted: (paymentId: string) => boolean;
  getPaymentStatus: (paymentId: string) => 'recorded' | 'skipped' | 'pending';
}

const isRecurringExpenseRecorded = (
  name: string,
  bucket: string,
  amountCents: number,
  transactions: TransactionDTO[]
) => {
  const lowerName = name.toLowerCase();
  return transactions.some(
    (tx) =>
      tx.bucket === bucket &&
      tx.amountCents === amountCents &&
      tx.kind === 'expense' &&
      tx.description.toLowerCase().includes(lowerName)
  );
};

export function PlanCard({
  fortnightDetail,
  detailLoading,
  detailError,
  profile,
  transactions,
  planLoading,
  planError,
  fortnightEntry,
  skippedPayments,
  isHistoricalFortnight,
  onRecurringRecord,
  onPaymentCheckbox,
  onRecordPayment,
  onSkipPayment,
  isPaymentCompleted,
  getPaymentStatus,
}: PlanCardProps) {
  const { textMuted } = useThemeColors();

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Text size="lg" fw={600}>
          This Fortnight's Plan
        </Text>

        <Stack gap="sm">
          <Text size="sm" fw={600}>
            Budget Progress
          </Text>
          {detailLoading && <LoadingSpinner />}
          {detailError && <ErrorAlert message={detailError} />}
          {!detailLoading && !detailError && (!fortnightDetail || fortnightDetail.bucketBreakdowns.length === 0) && (
            <Text size="sm" c={textMuted}>
              No bucket allocations for this fortnight.
            </Text>
          )}
          {!detailLoading && !detailError && fortnightDetail &&
            fortnightDetail.bucketBreakdowns.map((bucket) => {
              const ratio = bucket.allocatedCents === 0 ? 0 : bucket.spentCents / bucket.allocatedCents;
              const color = bucket.allocatedCents === 0 ? 'gray' : ratio < 0.7 ? 'green' : ratio <= 1 ? 'yellow' : 'red';
              return (
                <Stack key={bucket.bucket} gap={4}>
                  <Group justify="space-between">
                    <BucketBadge bucket={bucket.bucket} />
                    <Text size="xs" c={textMuted}>
                      {formatCurrency(bucket.spentCents)} / {formatCurrency(bucket.allocatedCents)}
                    </Text>
                  </Group>
                  <Progress value={ratio * 100} color={color} size="sm" radius="sm" />
                </Stack>
              );
            })}
        </Stack>

        <Stack gap="sm">
          <Text size="sm" fw={600}>
            Recurring Expenses
          </Text>
          {!profile || profile.fixedExpenses.length === 0 ? (
            <Text size="sm" c={textMuted}>
              No recurring expenses configured.
            </Text>
          ) : (
            profile.fixedExpenses.map((expense) => {
              const recorded = isRecurringExpenseRecorded(
                expense.name,
                expense.bucket,
                expense.amountCents,
                transactions
              );
              return (
                <Group key={expense.id} justify="space-between" align="flex-start">
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Group gap="xs">
                      <Checkbox checked={recorded} readOnly />
                      <Text size="sm">{expense.name}</Text>
                      <BucketBadge bucket={expense.bucket} />
                    </Group>
                    <Text size="sm" c={textMuted} pl={28}>
                      {formatCurrency(expense.amountCents)}
                    </Text>
                  </Stack>
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() =>
                      onRecurringRecord({ bucket: expense.bucket, name: expense.name, amountCents: expense.amountCents })
                    }
                  >
                    Record
                  </Button>
                </Group>
              );
            })
          )}
        </Stack>

        {planLoading && <LoadingSpinner />}
        {planError && <ErrorAlert message={planError} />}
        {!planLoading && !planError && !fortnightEntry && (
          <Text size="sm" c={textMuted}>
            No debt payments scheduled for this fortnight.
          </Text>
        )}

        {!planLoading && !planError && fortnightEntry && (
          <Stack gap="lg">
            {fortnightEntry.debtBeingPaid && (
              <Stack gap="xs">
                <Tooltip label="The main debt being targeted for aggressive payment using the Barefoot Investor debt-elimination strategy. Minimum payments continue on other debts while you focus here." withArrow position="right">
                  <Group gap="xs" align="center">
                    <Text size="sm" fw={600}>
                      Snowball Payment
                    </Text>
                    <Badge size="xs" color="blue" variant="light">
                      Planned
                    </Badge>
                  </Group>
                </Tooltip>
                <Group justify="space-between" align="flex-start">
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Group gap="xs">
                      <Checkbox
                        checked={isPaymentCompleted(fortnightEntry.debtBeingPaid.id)}
                        disabled={Boolean(skippedPayments[fortnightEntry.debtBeingPaid.id])}
                        onChange={(e) =>
                          onPaymentCheckbox(fortnightEntry.debtBeingPaid!.id, e.currentTarget.checked)
                        }
                      />
                      <Text size="sm">{fortnightEntry.debtBeingPaid.name}</Text>
                      <DebtTypeBadge debtType={fortnightEntry.debtBeingPaid.debtType} />
                      {skippedPayments[fortnightEntry.debtBeingPaid.id] && (
                        <Badge color="red" size="xs" variant="filled">
                          Skipped
                        </Badge>
                      )}
                    </Group>
                    <Text size="sm" c={textMuted} pl={28}>
                      {formatCurrency(fortnightEntry.paymentToActiveDebtCents)} payment
                    </Text>
                    {skippedPayments[fortnightEntry.debtBeingPaid.id]?.skipReason && (
                      <Text size="xs" c="red" pl={28}>
                        Reason: {skippedPayments[fortnightEntry.debtBeingPaid.id].skipReason}
                      </Text>
                    )}
                  </Stack>
                  {!isHistoricalFortnight && (
                    <>
                      <Button
                        size="xs"
                        disabled={Boolean(skippedPayments[fortnightEntry.debtBeingPaid.id])}
                        onClick={() =>
                          onRecordPayment(
                            fortnightEntry.debtBeingPaid!.id,
                            fortnightEntry.debtBeingPaid!.name,
                            fortnightEntry.paymentToActiveDebtCents
                          )
                        }
                      >
                        Record Payment
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        color="red"
                        disabled={getPaymentStatus(fortnightEntry.debtBeingPaid.id) !== 'pending'}
                        onClick={() =>
                          onSkipPayment(
                            fortnightEntry.debtBeingPaid!.id,
                            fortnightEntry.debtBeingPaid!.name,
                            fortnightEntry.paymentToActiveDebtCents
                          )
                        }
                      >
                        Skip Payment
                      </Button>
                    </>
                  )}
                </Group>
              </Stack>
            )}

            {fortnightEntry.minimumPaymentsOnOtherDebts.length > 0 && (
              <Stack gap="xs">
                <Tooltip label="Minimum required payments to keep other accounts in good standing while you focus on the priority debt. Pay these alongside your Snowball payment." withArrow position="right">
                  <Group gap="xs" align="center">
                    <Text size="sm" fw={600}>
                      Minimum Payments
                    </Text>
                    <Badge size="xs" color="grape" variant="light">
                      Planned
                    </Badge>
                  </Group>
                </Tooltip>
                {fortnightEntry.minimumPaymentsOnOtherDebts.map((payment) => (
                  <Group key={payment.debtId} justify="space-between" align="flex-start">
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Group gap="xs">
                        <Checkbox
                          checked={isPaymentCompleted(payment.debtId)}
                          disabled={Boolean(skippedPayments[payment.debtId])}
                          onChange={(e) => onPaymentCheckbox(payment.debtId, e.currentTarget.checked)}
                        />
                        <Text size="sm">{payment.debtName}</Text>
                        {skippedPayments[payment.debtId] && (
                          <Badge color="red" size="xs" variant="filled">
                            Skipped
                          </Badge>
                        )}
                      </Group>
                      <Text size="sm" c={textMuted} pl={28}>
                        {formatCurrency(payment.minimumPaymentCents)} minimum
                      </Text>
                      {skippedPayments[payment.debtId]?.skipReason && (
                        <Text size="xs" c="red" pl={28}>
                          Reason: {skippedPayments[payment.debtId].skipReason}
                        </Text>
                      )}
                    </Stack>
                    {!isHistoricalFortnight && (
                      <>
                        <Button
                          size="xs"
                          disabled={Boolean(skippedPayments[payment.debtId])}
                          onClick={() => onRecordPayment(payment.debtId, payment.debtName, payment.minimumPaymentCents)}
                        >
                          Record Payment
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          color="red"
                          disabled={getPaymentStatus(payment.debtId) !== 'pending'}
                          onClick={() => onSkipPayment(payment.debtId, payment.debtName, payment.minimumPaymentCents)}
                        >
                          Skip Payment
                        </Button>
                      </>
                    )}
                  </Group>
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
