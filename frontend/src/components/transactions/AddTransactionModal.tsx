import { Button, Checkbox, Group, Modal, NumberInput, Radio, Select, Stack, TagsInput, TextInput, Tooltip } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import type { UseFormReturnType } from '@mantine/form';
import type { DebtDTO } from '../../api/types.js';
import { bucketOptions, type TransactionFormValues } from '../../hooks/transactions/types.js';
import { ErrorAlert } from '../ErrorAlert.js';

interface AddTransactionModalProps {
  opened: boolean;
  isHistoricalFortnight: boolean;
  onClose: () => void;
  form: UseFormReturnType<TransactionFormValues>;
  debts: DebtDTO[];
  submitting: boolean;
  submitError?: string;
  suggestedTags?: string[];
  onSubmit: (values: TransactionFormValues) => void;
}

export function AddTransactionModal({
  opened,
  isHistoricalFortnight,
  onClose,
  form,
  debts,
  submitting,
  submitError,
  suggestedTags = [],
  onSubmit,
}: AddTransactionModalProps) {
  return (
    <Modal opened={opened && !isHistoricalFortnight} onClose={onClose} title="Add Transaction" size="md">
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="md">
          <div>
            <Tooltip label="Choose which Barefoot bucket this transaction belongs to (Daily Expenses for everyday spending, Fire Extinguisher for debt payments, etc.)" withArrow position="right">
              <Select
                label="Bucket"
                required
                {...form.getInputProps('bucket')}
                data={bucketOptions.map((bucket) => ({ value: bucket, label: bucket }))}
              />
            </Tooltip>
          </div>

          <div>
            <Tooltip label="Select the transaction type - Income adds money, Expense removes it, Transfer moves between buckets" withArrow position="right">
              <Radio.Group label="Transaction Type" required {...form.getInputProps('kind')}>
                <Group mt="xs">
                  <Radio value="income" label="Income" />
                  <Radio value="expense" label="Expense" />
                  <Radio value="transfer" label="Transfer" />
                </Group>
              </Radio.Group>
            </Tooltip>
          </div>

          <Tooltip label="Check this to apply the payment toward a specific debt, which updates the payoff timeline" withArrow position="right">
            <Checkbox
              label="Apply to a debt (updates payoff plan)"
              checked={form.values.debtPayment}
              onChange={(e) => form.setFieldValue('debtPayment', e.currentTarget.checked)}
            />
          </Tooltip>

          <div>
            <Tooltip label="Select which debt this payment applies to - the amount will reduce the selected debt's balance" withArrow position="right">
              <Select
                label="Debt"
                placeholder="Select debt"
                data={debts.map((debt) => ({ value: debt.id, label: debt.name }))}
                disabled={!form.values.debtPayment}
                required={form.values.debtPayment}
                {...form.getInputProps('debtId')}
              />
            </Tooltip>
          </div>

          <Tooltip label="Clear description of what this transaction is for - used for filtering and reconciliation" withArrow position="right">
            <TextInput label="Description" placeholder="e.g., Groceries at Coles" required {...form.getInputProps('description')} />
          </Tooltip>

          <Tooltip label="Transaction amount in Australian Dollars - will be converted to cents for storage" withArrow position="right">
            <NumberInput
              label="Amount (AUD)"
              placeholder="0.00"
              required
              min={0}
              decimalScale={2}
              fixedDecimalScale
              prefix="$"
              {...form.getInputProps('amountDollars')}
            />
          </Tooltip>

          <Tooltip label="Optional: set the exact local date and time for this transaction. Leave blank to use now." withArrow position="right">
            <DateTimePicker
              label="Date & Time (optional)"
              placeholder="Defaults to now"
              valueFormat="DD MMM YYYY, HH:mm"
              clearable
              {...form.getInputProps('occurredAt')}
            />
          </Tooltip>

          <Tooltip label="Add optional labels to categorize and filter transactions later (e.g., 'groceries', 'medical', 'recurring'). Suggested tags from this fortnight appear below." withArrow position="right">
            <TagsInput
              label="Tags (optional)"
              placeholder="Add tags"
              data={suggestedTags}
              {...form.getInputProps('tags')}
            />
          </Tooltip>

          {submitError && <ErrorAlert message={submitError} />}

          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Add Transaction
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
