import { ActionIcon, Button, Group, Title, Tooltip } from '@mantine/core';
import { IconFileUpload, IconPlus, IconQuestionMark } from '@tabler/icons-react';

interface TransactionsHeaderProps {
  onAdd: () => void;
  onHelp: () => void;
  onImport: () => void;
  importDisabled?: boolean;
}

export function TransactionsHeader({ onAdd, onHelp, onImport, importDisabled }: TransactionsHeaderProps) {
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
      <Group gap="sm">
        <Button
          variant="light"
          leftSection={<IconFileUpload size={18} />}
          onClick={onImport}
          disabled={importDisabled}
        >
          Import CSV
        </Button>
        <Button leftSection={<IconPlus size={18} />} onClick={onAdd}>
          Add Transaction
        </Button>
      </Group>
    </Group>
  );
}
