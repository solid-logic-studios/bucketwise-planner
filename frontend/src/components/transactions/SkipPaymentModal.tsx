import { Button, Group, Modal, Stack, Text, Textarea } from '@mantine/core';
import { formatCurrency } from '../../utils/formatters.js';
import { ErrorAlert } from '../ErrorAlert.js';

interface SkipPaymentModalProps {
  opened: boolean;
  isHistoricalFortnight: boolean;
  skipTarget: { debtId: string; debtName: string; amountCents: number } | null;
  skipReason: string;
  onSkipReasonChange: (value: string) => void;
  skipError?: string;
  skipSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function SkipPaymentModal({
  opened,
  isHistoricalFortnight,
  skipTarget,
  skipReason,
  onSkipReasonChange,
  skipError,
  skipSubmitting,
  onClose,
  onSubmit,
}: SkipPaymentModalProps) {
  return (
    <Modal opened={opened && !isHistoricalFortnight} onClose={onClose} title="Skip Payment" size="md">
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {skipTarget
            ? `Skip payment for ${skipTarget.debtName} (${formatCurrency(skipTarget.amountCents)})`
            : 'No payment selected'}
        </Text>

        <Textarea
          label="Reason (optional)"
          minRows={3}
          value={skipReason}
          onChange={(event) => onSkipReasonChange(event.currentTarget.value)}
        />

        {skipError && <ErrorAlert message={skipError} />}

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose} disabled={skipSubmitting}>
            Cancel
          </Button>
          <Button color="red" onClick={onSubmit} loading={skipSubmitting} disabled={!skipTarget}>
            Confirm Skip
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
