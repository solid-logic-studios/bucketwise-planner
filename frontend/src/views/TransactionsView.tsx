import { Badge, Group, SimpleGrid, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useHotkeys } from '@mantine/hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import type { DebtDTO, TransactionDTO } from '../api/types.js';
import { FortnightSelector } from '../components/FortnightSelector.js';
import { useHelp } from '../components/HelpDrawer.js';
import {
  AddTransactionModal,
  DeleteConfirmationModal,
  EditTransactionModal,
  HistoricalComplianceCard,
  PlanCard,
  QuickActions,
  SkipPaymentModal,
  SummaryCards,
  TransactionsHeader,
  TransactionsTable,
} from '../components/transactions/index.js';
import { usePageDataContext } from '../contexts/PageContextProvider.js';
import {
  bucketOptions,
  type BucketType,
  type TransactionFilters,
  type TransactionFormValues,
  type TransactionKind,
} from '../hooks/transactions/types.js';
import { useDebtPayments } from '../hooks/transactions/useDebtPayments.js';
import { useFortnightDetail } from '../hooks/transactions/useFortnightDetail.js';
import { useTransactionsData } from '../hooks/transactions/useTransactionsData.js';
import { useThemeColors } from '../hooks/useThemeColors.js';
import { formatDate, formatDateToISO } from '../utils/formatters.js';
import {
  calculateBudgetVariance,
  calculateComplianceScore,
  getPlannedPayments,
  normalizeDateInput,
  type GroupBy,
} from '../utils/transactions.js';

export function TransactionsView() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [groupBy, setGroupBy] = useState<GroupBy>('date');
  const [searchInput, setSearchInput] = useState('');
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFortnightId, setSelectedFortnightId] = useState<string | null>(null);
  const [fortnightStartDate, setFortnightStartDate] = useState<string | null>(null);
  const [fortnightEndDate, setFortnightEndDate] = useState<string | null>(null);
  const { state, loadTransactions } = useTransactionsData({ filters, fortnightStartDate, fortnightEndDate, pageSize, currentPage });
  const { fortnightDetail, detailLoading, detailError, loadFortnightDetail } = useFortnightDetail();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [recordAllLoading, setRecordAllLoading] = useState(false);
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [skipSubmitting, setSkipSubmitting] = useState(false);
  const [skipError, setSkipError] = useState<string>();
  const [skipTarget, setSkipTarget] = useState<{ debtId: string; debtName: string; amountCents: number } | null>(null);
  const [skipReason, setSkipReason] = useState('');
  const [isHistoricalFortnight, setIsHistoricalFortnight] = useState(false);
  const [debts, setDebts] = useState<DebtDTO[]>([]);
  const { setPageData } = usePageDataContext();
  const { openHelp } = useHelp();

  // Edit transaction state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionDTO | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string>();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TransactionDTO | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  // Debt payments state
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const {
    profile,
    fortnightEntry,
    planLoading,
    planError,
    setPlanError,
    skippedPayments,
    loadDebtPayments,
    loadSkippedPayments,
    computeRecordedPayments,
    getPaymentStatus: getPaymentStatusRaw,
    isPaymentCompleted: isPaymentCompletedRaw,
  } = useDebtPayments();

  const { badgeSecondary } = useThemeColors();

  const form = useForm<TransactionFormValues>({
    initialValues: {
      bucket: bucketOptions[0],
      sourceBucket: bucketOptions[0],
      destinationBucket: null,
      kind: 'expense',
      description: '',
      amountDollars: 0,
      tags: [],
      debtPayment: false,
      debtId: undefined,
      occurredAt: null,
    },
    validate: {
      description: (value) => (!value.trim() ? 'Description is required' : null),
      amountDollars: (value) => (value <= 0 ? 'Amount must be greater than 0' : null),
      destinationBucket: (value, values) => {
        if (values.kind === 'transfer') {
          if (!value) return 'Destination bucket is required for transfers';
          if (value === values.sourceBucket) return 'Destination must differ from source bucket';
        }
        return null;
      },
      debtId: (_value, values) => (values.debtPayment && !values.debtId ? 'Select a debt to apply this payment' : null),
      occurredAt: (value) => {
        if (!value) return null;
        return normalizeDateInput(value) ? null : 'Enter a valid date and time';
      },
    },
  });

  const editForm = useForm<Omit<TransactionFormValues, 'debtPayment' | 'debtId'>>({
    initialValues: {
      bucket: bucketOptions[0],
      sourceBucket: bucketOptions[0],
      destinationBucket: null,
      kind: 'expense',
      description: '',
      amountDollars: 0,
      tags: [],
      occurredAt: null,
    },
    validate: {
      description: (value) => (!value.trim() ? 'Description is required' : null),
      amountDollars: (value) => (value <= 0 ? 'Amount must be greater than 0' : null),
      destinationBucket: (value, values) => {
        if (values.kind === 'transfer') {
          if (!value) return 'Destination bucket is required for transfers';
          if (value === values.sourceBucket) return 'Destination must differ from source bucket';
        }
        return null;
      },
      occurredAt: (value) => {
        if (!value) return null;
        return normalizeDateInput(value) ? null : 'Enter a valid date and time';
      },
    },
  });

  // Extract unique tags from all transactions for suggestions
  const suggestedTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const tx of state.data) {
      if (tx.tags && Array.isArray(tx.tags)) {
        for (const tag of tx.tags) {
          tagSet.add(tag);
        }
      }
    }
    return Array.from(tagSet).sort();
  }, [state.data]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    loadFortnightDetail(selectedFortnightId);
  }, [loadFortnightDetail, selectedFortnightId]);

  useEffect(() => {
    loadDebtPayments(fortnightStartDate);
  }, [loadDebtPayments, fortnightStartDate]);

  useEffect(() => {
    loadSkippedPayments(selectedFortnightId);
  }, [loadSkippedPayments, selectedFortnightId]);

  useHotkeys([
    [
      'mod+/',
      () => {
        if (addModalOpen || skipModalOpen) return;
        openHelp('transactions');
      },
    ],
  ]);

  useEffect(() => {
    api
      .listDebts()
      .then(setDebts)
      .catch(() => {
        /* non-blocking */
      });
  }, []);

  useEffect(() => {
    if (state.data.length > 0) {
      setPageData({
        transactions: state.data.slice(0, 50),
        fortnightId: selectedFortnightId || undefined,
      });
    }
  }, [state.data, selectedFortnightId, setPageData]);

  useEffect(() => {
    const matches = computeRecordedPayments(state.data, fortnightEntry);
    setSelectedPayments((prev) => {
      const merged = new Set(prev);
      matches.forEach((id) => merged.add(id));
      return merged;
    });
  }, [computeRecordedPayments, state.data, fortnightEntry]);

  const handleFortnightChange = (fortnightId: string, startDate: string, endDate: string) => {
    const normalizedStart = formatDateToISO(startDate);
    const normalizedEnd = formatDateToISO(endDate);
    setSelectedFortnightId(fortnightId);
    setFortnightStartDate(normalizedStart);
    setFortnightEndDate(normalizedEnd);
    // Detect if fortnight is in the past (ended before today)
    const endDate_Obj = new Date(normalizedEnd);
    endDate_Obj.setHours(23, 59, 59, 999);
    setIsHistoricalFortnight(endDate_Obj < new Date());
  };

  const isPaymentCompleted = useCallback(
    (paymentId: string) => isPaymentCompletedRaw(paymentId, selectedPayments),
    [isPaymentCompletedRaw, selectedPayments]
  );

  const getPaymentStatus = useCallback(
    (paymentId: string) => getPaymentStatusRaw(paymentId, selectedPayments),
    [getPaymentStatusRaw, selectedPayments]
  );

  const budgetVariance = useMemo(() => calculateBudgetVariance(fortnightDetail), [fortnightDetail]);

  const compliance = useMemo(
    () => calculateComplianceScore(fortnightEntry, isPaymentCompleted),
    [fortnightEntry, isPaymentCompleted]
  );

  const handleSubmit = async (values: TransactionFormValues) => {
    setSubmitting(true);
    setSubmitError(undefined);

    try {
      const tags = values.debtPayment ? Array.from(new Set([...(values.tags || []), 'debt-payment'])) : values.tags;
      const occurredAtDate = normalizeDateInput(values.occurredAt);
      const occurredAtIso = occurredAtDate ? occurredAtDate.toISOString() : new Date().toISOString();
      await api.recordTransaction({
        sourceBucket: values.sourceBucket,
        destinationBucket: values.destinationBucket || undefined,
        kind: values.kind,
        description: values.description,
        amountCents: Math.round(values.amountDollars * 100),
        occurredAt: occurredAtIso,
        tags,
        debtId: values.debtPayment ? values.debtId : undefined,
      });

      form.reset();
      setAddModalOpen(false);
      loadTransactions();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTransaction = (transaction: TransactionDTO) => {
    setEditingTransaction(transaction);
    editForm.setValues({
      bucket: transaction.sourceBucket as BucketType,
      sourceBucket: transaction.sourceBucket as BucketType,
      destinationBucket: transaction.destinationBucket as BucketType | null,
      kind: transaction.kind as TransactionKind,
      description: transaction.description,
      amountDollars: transaction.amountCents / 100,
      tags: transaction.tags || [],
      occurredAt: normalizeDateInput(transaction.occurredAt),
    });
    setEditModalOpen(true);
  };

  const handleUpdateTransaction = async (values: Omit<TransactionFormValues, 'debtPayment' | 'debtId'>) => {
    if (!editingTransaction) return;

    setEditSubmitting(true);
    setEditError(undefined);

    try {
      const occurredAtDate = normalizeDateInput(values.occurredAt);
      const occurredAtIso = occurredAtDate ? occurredAtDate.toISOString() : editingTransaction.occurredAt;
      await api.updateTransaction(editingTransaction.id, {
        sourceBucket: values.sourceBucket,
        destinationBucket: values.destinationBucket || undefined,
        kind: values.kind,
        description: values.description,
        amountCents: Math.round(values.amountDollars * 100),
        occurredAt: occurredAtIso,
        tags: values.tags,
      });

      editForm.reset();
      setEditModalOpen(false);
      setEditingTransaction(null);
      loadTransactions();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update transaction');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (transaction: TransactionDTO) => {
    setDeleteTarget(transaction);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleteSubmitting(true);
    setDeleteError(undefined);

    try {
      await api.deleteTransaction(deleteTarget.id);
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      loadTransactions();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete transaction');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handlePaymentCheckbox = (debtId: string, checked: boolean) => {
    setSelectedPayments((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(debtId);
      } else {
        newSet.delete(debtId);
      }
      return newSet;
    });
  };

  const handleRecordPayment = async (debtId: string, debtName: string, amountCents: number) => {
    // TODO: Auto-record feature - see FEATURE_WISHLIST.md
    // For now, this just pre-fills the add transaction modal
    form.setValues({
      bucket: 'Fire Extinguisher',
      kind: 'expense',
      description: `Debt payment: ${debtName}`,
      amountDollars: amountCents / 100,
      tags: ['debt-payment'],
      debtPayment: true,
      debtId: debtId,
    });
    setAddModalOpen(true);
  };

  const recordAllDebtPayments = async () => {
    if (!fortnightEntry || recordAllLoading) return;

    const planned = getPlannedPayments(fortnightEntry);
    const toRecord = planned.filter((p) => !isPaymentCompleted(p.id));
    if (toRecord.length === 0) return;

    setRecordAllLoading(true);
    setPlanError(undefined);

    try {
      const startDateIso = fortnightStartDate ? formatDateToISO(fortnightStartDate) : null;
      await Promise.all(
        toRecord.map((p) =>
          api.recordTransaction({
            sourceBucket: 'Fire Extinguisher',
            kind: 'expense',
            description: `Debt payment: ${p.name}`,
            amountCents: p.amountCents,
            occurredAt: startDateIso ? `${startDateIso}T00:00:00.000Z` : new Date().toISOString(),
            tags: ['debt-payment'],
            debtId: p.id,
          })
        )
      );
      await loadTransactions();
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Failed to record all payments');
    } finally {
      setRecordAllLoading(false);
    }
  };

  const openSkipPaymentModal = (debtId: string, debtName: string, amountCents: number) => {
    setSkipTarget({ debtId, debtName, amountCents });
    setSkipReason('');
    setSkipError(undefined);
    setSkipModalOpen(true);
  };

  const submitSkipPayment = async () => {
    if (!skipTarget || !selectedFortnightId || !fortnightEntry) return;

    setSkipSubmitting(true);
    setSkipError(undefined);

    try {
      const paymentDateIso = formatDateToISO(fortnightEntry.paymentDate);
      await api.skipDebtPayment(skipTarget.debtId, {
        fortnightId: selectedFortnightId,
        paymentDate: paymentDateIso ? `${paymentDateIso}T00:00:00.000Z` : new Date(fortnightEntry.paymentDate).toISOString(),
        amountCents: skipTarget.amountCents,
        skipReason: skipReason.trim() || undefined,
      });
      await loadSkippedPayments(selectedFortnightId);
      setSkipModalOpen(false);
      setPlanError(undefined);
    } catch (err) {
      setSkipError(err instanceof Error ? err.message : 'Failed to skip payment');
    } finally {
      setSkipSubmitting(false);
    }
  };

  const prefillIncome = () => {
    if (!fortnightDetail) return;
    const amountCents =
      (profile && profile.fortnightlyIncomeCents > 0 ? profile.fortnightlyIncomeCents : fortnightDetail.totalIncomeCents) || 0;
    form.setValues({
      bucket: 'Daily Expenses',
      kind: 'income',
      description: `Income for fortnight starting ${formatDate(fortnightDetail.periodStart)}`,
      amountDollars: amountCents / 100,
      tags: ['income'],
      debtPayment: false,
      debtId: undefined,
      occurredAt: null,
    });
    setAddModalOpen(true);
  };


  const prefillExpense = () => {
    form.setValues({
      bucket: 'Daily Expenses',
      kind: 'expense',
      description: '',
      amountDollars: 0,
      tags: [],
      debtPayment: false,
      debtId: undefined,
      occurredAt: null,
    });
    setAddModalOpen(true);
  };

  const plannedPayments = useMemo(() => getPlannedPayments(fortnightEntry), [fortnightEntry]);
  const completedPayments = plannedPayments.filter((p) => isPaymentCompleted(p.id)).length;
  const skippedPaymentsCount = plannedPayments.filter((p) => getPaymentStatus(p.id) === 'skipped').length;

  return (
    <Stack gap="lg" p="md">
      <Stack gap="sm">
        <TransactionsHeader onAdd={() => setAddModalOpen(true)} onHelp={() => openHelp('transactions')} />

        <SummaryCards
          isHistoricalFortnight={isHistoricalFortnight}
          incomeRecorded={state.data.some((tx: TransactionDTO) => tx.kind === 'income')}
          plannedPaymentsCount={plannedPayments.length}
          completedPaymentsCount={completedPayments}
          skippedPaymentsCount={skippedPaymentsCount}
          fortnightDetail={fortnightDetail}
          budgetVariance={budgetVariance}
        />

        <HistoricalComplianceCard visible={isHistoricalFortnight} compliance={compliance} variance={budgetVariance} />

        <QuickActions
          disabled={isHistoricalFortnight}
          onRecordAll={recordAllDebtPayments}
          recordAllLoading={recordAllLoading}
          recordAllDisabled={!fortnightEntry}
          onPrefillIncome={prefillIncome}
          incomeDisabled={!fortnightDetail}
          onPrefillExpense={prefillExpense}
        />
      </Stack>

      <Group justify="space-between" align="center">
        <FortnightSelector selectedFortnightId={selectedFortnightId} onFortnightChange={handleFortnightChange} />
        {isHistoricalFortnight && (
          <Badge color={badgeSecondary} variant="light" size="lg">
            🔒 Past Fortnight (Read-only)
          </Badge>
        )}
      </Group>

      <SimpleGrid cols={2} spacing="md">
        <PlanCard
          fortnightDetail={fortnightDetail}
          detailLoading={detailLoading}
          detailError={detailError}
          profile={profile}
          transactions={state.data}
          planLoading={planLoading}
          planError={planError}
          fortnightEntry={fortnightEntry}
          skippedPayments={skippedPayments}
          isHistoricalFortnight={isHistoricalFortnight}
          onRecurringRecord={(expense) => {
            form.setValues({
              bucket: expense.bucket as BucketType,
              kind: 'expense',
              description: expense.name,
              amountDollars: expense.amountCents / 100,
              tags: ['recurring-expense'],
              debtPayment: false,
              debtId: undefined,
              occurredAt: null,
            });
            setAddModalOpen(true);
          }}
          onPaymentCheckbox={handlePaymentCheckbox}
          onRecordPayment={handleRecordPayment}
          onSkipPayment={openSkipPaymentModal}
          isPaymentCompleted={isPaymentCompleted}
          getPaymentStatus={getPaymentStatus}
        />

        <TransactionsTable
          filters={filters}
          onFiltersChange={setFilters}
          searchInput={searchInput}
          onSearchChange={(value) => setSearchInput(value)}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          state={state}
          isHistoricalFortnight={isHistoricalFortnight}
          onRefresh={loadTransactions}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </SimpleGrid>

      <SkipPaymentModal
        opened={skipModalOpen}
        isHistoricalFortnight={isHistoricalFortnight}
        skipTarget={skipTarget}
        skipReason={skipReason}
        onSkipReasonChange={setSkipReason}
        skipError={skipError}
        skipSubmitting={skipSubmitting}
        onClose={() => setSkipModalOpen(false)}
        onSubmit={submitSkipPayment}
      />

      <AddTransactionModal
        opened={addModalOpen}
        isHistoricalFortnight={isHistoricalFortnight}
        onClose={() => setAddModalOpen(false)}
        form={form}
        debts={debts}
        submitting={submitting}
        submitError={submitError}
        suggestedTags={suggestedTags}
        onSubmit={handleSubmit}
      />

      <EditTransactionModal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        form={editForm}
        submitting={editSubmitting}
        submitError={editError}
        suggestedTags={suggestedTags}
        onSubmit={handleUpdateTransaction}
      />

      <DeleteConfirmationModal
        opened={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        deleteTarget={deleteTarget}
        deleteError={deleteError}
        deleteSubmitting={deleteSubmitting}
        onConfirm={confirmDelete}
      />
    </Stack>
  );
}
