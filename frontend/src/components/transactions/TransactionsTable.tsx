import { ActionIcon, Badge, Group, Pagination, Select, Stack, Table, Text, TextInput, Tooltip } from '@mantine/core';
import { IconEdit, IconRefresh, IconTrash, IconX } from '@tabler/icons-react';
import type { Dispatch, SetStateAction } from 'react';
import type { TransactionDTO } from '../../api/types.js';
import { bucketOptions, type TransactionFilters, type TransactionState } from '../../hooks/transactions/types.js';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';
import { filterTransactionsBySearch, groupTransactions, type GroupBy } from '../../utils/transactions.js';
import { BucketBadge } from '../BucketBadge.js';
import { EmptyState } from '../EmptyState.js';
import { ErrorAlert } from '../ErrorAlert.js';
import { LoadingSpinner } from '../LoadingSpinner.js';
import { TransactionKindBadge } from '../TransactionKindBadge.js';

interface TransactionsTableProps {
  filters: TransactionFilters;
  onFiltersChange: Dispatch<SetStateAction<TransactionFilters>>;
  searchInput: string;
  onSearchChange: (value: string) => void;
  groupBy: GroupBy;
  onGroupByChange: (mode: GroupBy) => void;
  state: TransactionState;
  isHistoricalFortnight: boolean;
  onRefresh: () => void;
  onEdit: (tx: TransactionDTO) => void;
  onDelete: (tx: TransactionDTO) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function TransactionsTable({
  filters,
  onFiltersChange,
  searchInput,
  onSearchChange,
  groupBy,
  onGroupByChange,
  state,
  isHistoricalFortnight,
  onRefresh,
  onEdit,
  onDelete,
  pageSize,
  onPageSizeChange,
  currentPage,
  onPageChange,
}: TransactionsTableProps) {
  const showPagination = state.total > pageSize;

  return (
    <Stack gap="md">
      <Text size="lg" fw={600}>
        Actual Transactions
      </Text>

      <Stack gap="sm">
        <Group grow>
          <TextInput
            placeholder="Search transactions..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            rightSection={
              searchInput ? (
                <ActionIcon size="xs" color="gray" radius="xl" variant="transparent" onClick={() => onSearchChange('')}>
                  <IconX size={16} />
                </ActionIcon>
              ) : null
            }
          />
          <Select
            placeholder="All buckets"
            clearable
            value={filters.bucket}
            onChange={(value) => onFiltersChange((prev) => ({ ...prev, bucket: value as typeof filters.bucket }))}
            data={bucketOptions.map((bucket) => ({ value: bucket, label: bucket }))}
            style={{ flex: 1 }}
          />
          <ActionIcon variant="light" onClick={onRefresh} size="lg">
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>

        <Group gap="sm">
          <Text size="xs" fw={500} c="dimmed">
            Group by:
          </Text>
          <Group gap="xs">
            {(['date', 'bucket', 'kind'] as const).map((mode) => (
              <Badge
                key={mode}
                variant={groupBy === mode ? 'filled' : 'light'}
                style={{ cursor: 'pointer' }}
                onClick={() => onGroupByChange(mode)}
                color={groupBy === mode ? 'blue' : 'gray'}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Badge>
            ))}
          </Group>
        </Group>

        {(filters.bucket || searchInput) && (
          <Group gap="xs">
            {filters.bucket && (
              <Badge
                variant="filled"
                color="blue"
                rightSection={
                  <ActionIcon
                    size="xs"
                    color="blue"
                    radius="xl"
                    variant="transparent"
                    onClick={() => onFiltersChange((prev) => ({ ...prev, bucket: undefined }))}
                  >
                    <IconX size={10} />
                  </ActionIcon>
                }
              >
                Bucket: {filters.bucket}
              </Badge>
            )}
            {searchInput && (
              <Badge
                variant="filled"
                color="blue"
                rightSection={
                  <ActionIcon
                    size="xs"
                    color="blue"
                    radius="xl"
                    variant="transparent"
                    onClick={() => onSearchChange('')}
                  >
                    <IconX size={10} />
                  </ActionIcon>
                }
              >
                Search: {searchInput}
              </Badge>
            )}
          </Group>
        )}
      </Stack>

      {state.loading && <LoadingSpinner />}
      {state.error && <ErrorAlert title="Error loading transactions" message={state.error} />}
      {!state.loading && !state.error && state.data.length === 0 && (
        <EmptyState title="No transactions" message="No transactions found for this fortnight." />
      )}

      {!state.loading && !state.error && state.data.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          {(() => {
            const filtered = filterTransactionsBySearch(state.data, searchInput);
            if (filtered.length === 0) {
              return <EmptyState title="No matching transactions" message={`No transactions match your search "${searchInput}".`} />;
            }

            const grouped = groupTransactions(filtered, groupBy);

            return (
              <Stack gap="lg">
                {grouped.map((group) => (
                  <Stack key={group.key} gap="sm">
                    <Text size="sm" fw={600} c="dimmed">
                      {group.label}
                    </Text>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Tooltip label="When the transaction occurred" withArrow position="top">
                            <Table.Th>Date</Table.Th>
                          </Tooltip>
                          <Tooltip label="What the transaction is for" withArrow position="top">
                            <Table.Th>Description</Table.Th>
                          </Tooltip>
                          <Tooltip label="Barefoot Investor bucket classification for this transaction" withArrow position="top">
                            <Table.Th>Bucket</Table.Th>
                          </Tooltip>
                          <Tooltip label="Transaction type: Income (money in), Expense (money out), or Transfer (between buckets)" withArrow position="top">
                            <Table.Th>Kind</Table.Th>
                          </Tooltip>
                          <Tooltip label="Transaction amount in Australian Dollars" withArrow position="top">
                            <Table.Th>Amount</Table.Th>
                          </Tooltip>
                          <Tooltip label="Custom categorization labels for filtering and tracking (e.g., 'groceries', 'medical')" withArrow position="top">
                            <Table.Th>Tags</Table.Th>
                          </Tooltip>
                          <Tooltip label="Edit or delete this transaction" withArrow position="top">
                            <Table.Th>Actions</Table.Th>
                          </Tooltip>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {group.transactions.map((tx) => {
                          const isTransfer = tx.kind === 'transfer' && tx.sourceBucket && tx.destinationBucket;
                          return (
                            <Table.Tr key={tx.id} style={isHistoricalFortnight ? { opacity: 0.8 } : {}}>
                              <Table.Td>{formatDateTime(tx.occurredAt)}</Table.Td>
                              <Table.Td>{tx.description}</Table.Td>
                              <Table.Td>
                                {isTransfer ? (
                                  <Group gap="xs">
                                    <BucketBadge bucket={tx.sourceBucket} />
                                    <Text size="xs" c="dimmed">→</Text>
                                    <BucketBadge bucket={tx.destinationBucket!} />
                                  </Group>
                                ) : (
                                  <BucketBadge bucket={tx.sourceBucket} />
                                )}
                              </Table.Td>
                              <Table.Td>
                                <TransactionKindBadge kind={tx.kind} />
                              </Table.Td>
                              <Table.Td>{formatCurrency(tx.amountCents)}</Table.Td>
                              <Table.Td>
                                {tx.tags && tx.tags.length > 0 && (
                                  <Group gap={4}>
                                    {tx.tags.map((tag) => (
                                      <Badge key={tag} size="xs" variant="dot">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </Group>
                                )}
                              </Table.Td>
                              <Table.Td>
                                <Group gap={4}>
                                  <Tooltip label="Edit transaction" withArrow position="left">
                                    <ActionIcon size="sm" color="blue" variant="light" onClick={() => onEdit(tx)}>
                                      <IconEdit size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Delete transaction" withArrow position="left">
                                    <ActionIcon size="sm" color="red" variant="light" onClick={() => onDelete(tx)}>
                                      <IconTrash size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </Stack>
                ))}
              </Stack>
            );
          })()}
        </div>
      )}

      {!state.loading && !state.error && state.data.length > 0 && (
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">
              Showing {Math.min(state.offset + 1, state.total)}-{Math.min(state.offset + pageSize, state.total)} of {state.total} transactions
            </Text>
            <Group gap="sm">
              <Select
                label="Per page:"
                value={String(pageSize)}
                onChange={(value) => value && onPageSizeChange(parseInt(value, 10))}
                data={['25', '50', '100']}
                style={{ width: 100 }}
              />
            </Group>
          </Group>
          {showPagination && (
            <Group justify="center">
              <Pagination value={currentPage} onChange={onPageChange} total={Math.ceil(state.total / pageSize)} size="sm" withEdges />
            </Group>
          )}
        </Stack>
      )}
    </Stack>
  );
}
