import { Button, Group, Modal, NumberInput, Radio, Select, Stack, TagsInput, TextInput, Tooltip } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import type { UseFormReturnType } from '@mantine/form';
import { bucketOptions, type TransactionFormValues } from '../../hooks/transactions/types.js';
import { ErrorAlert } from '../ErrorAlert.js';

interface EditTransactionModalProps {
  opened: boolean;
  onClose: () => void;
  form: UseFormReturnType<Omit<TransactionFormValues, 'debtPayment' | 'debtId'>>;
  submitting: boolean;
  submitError?: string;
  suggestedTags?: string[];
  onSubmit: (values: Omit<TransactionFormValues, 'debtPayment' | 'debtId'>) => void;
}

export function EditTransactionModal({ opened, onClose, form, submitting, submitError, suggestedTags = [], onSubmit }: EditTransactionModalProps) {
  const isTransfer = form.values.kind === 'transfer';

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Transaction" centered>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="md">
          <div>
            <Tooltip label={isTransfer ? "Select the source bucket (transfers from)" : "Select the bucket this transaction belongs to"} withArrow position="right">
              <Select
                label={isTransfer ? "Source Bucket" : "Bucket"}
                placeholder="Select bucket"
                required
                {...form.getInputProps('sourceBucket')}
                data={bucketOptions.map((bucket) => ({ value: bucket, label: bucket }))}
              />
            </Tooltip>
          </div>

          {isTransfer && (
            <div>
              <Tooltip label="Select the bucket to transfer money into. Must be different from the source bucket." withArrow position="right">
                <Select
                  label="Destination Bucket"
                  placeholder="Select destination"
                  required
                  data={bucketOptions
                    .filter((bucket) => bucket !== form.values.sourceBucket)
                    .map((bucket) => ({ value: bucket, label: bucket }))}
                  {...form.getInputProps('destinationBucket')}
                  error={form.errors.destinationBucket}
                />
              </Tooltip>
            </div>
          )}

          <div>
            <Tooltip label="Select the transaction type" withArrow position="right">
              <Radio.Group label="Transaction Type" required {...form.getInputProps('kind')}>
                <Group mt="xs">
                  <Radio value="income" label="Income" />
                  <Radio value="expense" label="Expense" />
                  <Radio value="transfer" label="Transfer" />
                </Group>
              </Radio.Group>
            </Tooltip>
          </div>

          <Tooltip label="Clear description of what this transaction is for" withArrow position="right">
            <TextInput label="Description" placeholder={isTransfer ? "e.g., Reallocate to debt" : "e.g., Groceries at Coles"} required {...form.getInputProps('description')} />
          </Tooltip>

          <Tooltip label="Transaction amount in Australian Dollars" withArrow position="right">
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

          <Tooltip label="Optional: adjust the exact local date and time for this transaction. Leave blank to keep the original." withArrow position="right">
            <DateTimePicker
              label="Date & Time (optional)"
              placeholder="Keep current"
              valueFormat="DD MMM YYYY, HH:mm"
              clearable
              {...form.getInputProps('occurredAt')}
            />
          </Tooltip>

          <Tooltip label="Add optional labels to categorize and filter transactions. Suggested tags from this fortnight appear below." withArrow position="right">
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
            <Button type="submit" loading={submitting} color="blue">
              Update Transaction
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
