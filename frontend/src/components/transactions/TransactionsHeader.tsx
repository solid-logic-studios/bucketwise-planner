import { ActionIcon, Button, Group, Title, Tooltip } from '@mantine/core';
import { IconPlus, IconQuestionMark } from '@tabler/icons-react';

interface TransactionsHeaderProps {
  onAdd: () => void;
  onHelp: () => void;
}

export function TransactionsHeader({ onAdd, onHelp }: TransactionsHeaderProps) {
  return (
    <Group justify="space-between" align="center">
      <Group gap="xs" align="center">
        <Title order={2}>Fortnightly Execution</Title>
        <Tooltip label="Open Transactions help (Shift + /)" withArrow position="bottom">
          <ActionIcon variant="light" onClick={onHelp} aria-label="Open help">
            <IconQuestionMark size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
      <Button leftSection={<IconPlus size={18} />} onClick={onAdd}>
        Add Transaction
      </Button>
    </Group>
  );
}
