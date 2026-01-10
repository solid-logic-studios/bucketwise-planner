import { Button, Card, Group, Modal, Stack, Text } from '@mantine/core';
import type { TransactionDTO } from '../../api/types.js';
import { formatCurrency } from '../../utils/formatters.js';
import { ErrorAlert } from '../ErrorAlert.js';

interface DeleteConfirmationModalProps {
  opened: boolean;
  onClose: () => void;
  deleteTarget: TransactionDTO | null;
  deleteError?: string;
  deleteSubmitting: boolean;
  onConfirm: () => void;
}

export function DeleteConfirmationModal({ opened, onClose, deleteTarget, deleteError, deleteSubmitting, onConfirm }: DeleteConfirmationModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Delete Transaction" centered>
      <Stack gap="md">
        <Text>Are you sure you want to delete this transaction? This action cannot be undone.</Text>
        {deleteTarget && (
          <Card withBorder p="sm" bg="var(--mantine-color-gray-0)">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>Description:</Text>
                <Text size="sm">{deleteTarget.description}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" fw={500}>Amount:</Text>
                <Text size="sm">{formatCurrency(deleteTarget.amountCents)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" fw={500}>Bucket:</Text>
                <Text size="sm">{deleteTarget.bucket}</Text>
              </Group>
            </Stack>
          </Card>
        )}
        {deleteError && <ErrorAlert message={deleteError} />}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose} disabled={deleteSubmitting}>
            Cancel
          </Button>
          <Button color="red" onClick={onConfirm} loading={deleteSubmitting}>
            Delete Transaction
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
