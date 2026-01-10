import { Button, Group, Tooltip } from '@mantine/core';

interface QuickActionsProps {
  disabled: boolean;
  onRecordAll: () => void;
  recordAllLoading: boolean;
  recordAllDisabled?: boolean;
  onPrefillIncome: () => void;
  incomeDisabled?: boolean;
  onPrefillExpense: () => void;
}

export function QuickActions({
  disabled,
  onRecordAll,
  recordAllLoading,
  recordAllDisabled,
  onPrefillIncome,
  incomeDisabled,
  onPrefillExpense,
}: QuickActionsProps) {
  if (disabled) return null;

  return (
    <Group gap="sm" wrap="wrap">
      <Tooltip label="Automatically record all planned debt payments (Snowball + minimum payments) for this fortnight" withArrow position="bottom">
        <Button onClick={onRecordAll} loading={recordAllLoading} disabled={recordAllDisabled}>
          Record All Debt Payments
        </Button>
      </Tooltip>
      <Tooltip label="Quick-record button that pre-fills the transaction form with your total fortnightly income" withArrow position="bottom">
        <Button variant="light" onClick={onPrefillIncome} disabled={incomeDisabled}>
          Record Income
        </Button>
      </Tooltip>
      <Tooltip label="Quick-record button that opens the transaction form for adding an expense" withArrow position="bottom">
        <Button variant="light" onClick={onPrefillExpense}>
          Add Expense
        </Button>
      </Tooltip>
    </Group>
  );
}
