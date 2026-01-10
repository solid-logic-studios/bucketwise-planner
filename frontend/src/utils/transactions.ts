import type { FortnightDetailDTO, FortnightlyTimelineEntry, TransactionDTO } from '../api/types.js';
import { formatDateToISO } from './formatters.js';

export type GroupBy = 'date' | 'bucket' | 'kind';

export const filterTransactionsBySearch = (transactions: TransactionDTO[], searchTerm: string): TransactionDTO[] => {
  if (!searchTerm.trim()) return transactions;
  const lowerSearch = searchTerm.toLowerCase();
  return transactions.filter(
    (tx) =>
      tx.description.toLowerCase().includes(lowerSearch) ||
      tx.bucket.toLowerCase().includes(lowerSearch) ||
      tx.kind.toLowerCase().includes(lowerSearch) ||
      (tx.tags?.some((tag) => tag.toLowerCase().includes(lowerSearch)) ?? false)
  );
};

export const groupTransactions = (
  transactions: TransactionDTO[],
  groupMode: GroupBy
): Array<{ key: string; label: string; sortValue: string; transactions: TransactionDTO[] }> => {
  const groups: Record<string, { key: string; label: string; sortValue: string; transactions: TransactionDTO[] }> = {};

  transactions.forEach((tx) => {
    if (groupMode === 'date') {
      const parsed = new Date(tx.occurredAt);
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      const localDateKey = `${year}-${month}-${day}`;

      if (!groups[localDateKey]) {
        const label = parsed.toLocaleDateString('en-AU', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        groups[localDateKey] = { key: localDateKey, label, sortValue: localDateKey, transactions: [] };
      }
      groups[localDateKey].transactions.push(tx);
    } else if (groupMode === 'bucket') {
      const key = tx.bucket;
      if (!groups[key]) {
        groups[key] = { key, label: key, sortValue: key.toLowerCase(), transactions: [] };
      }
      groups[key].transactions.push(tx);
    } else {
      const key = tx.kind.charAt(0).toUpperCase() + tx.kind.slice(1);
      if (!groups[key]) {
        groups[key] = { key, label: key, sortValue: key.toLowerCase(), transactions: [] };
      }
      groups[key].transactions.push(tx);
    }
  });

  return Object.values(groups).sort((a, b) => {
    if (groupMode === 'date') {
      return b.sortValue.localeCompare(a.sortValue); // newest first
    }
    return a.sortValue.localeCompare(b.sortValue);
  });
};

export const normalizeDateInput = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getPlannedPayments = (entry: FortnightlyTimelineEntry | null) => {
  if (!entry) return [] as Array<{ id: string; name: string; amountCents: number }>;
  const items: Array<{ id: string; name: string; amountCents: number }> = [];
  if (entry.debtBeingPaid) {
    items.push({ id: entry.debtBeingPaid.id, name: entry.debtBeingPaid.name, amountCents: entry.paymentToActiveDebtCents });
  }
  if (Array.isArray(entry.minimumPaymentsOnOtherDebts)) {
    entry.minimumPaymentsOnOtherDebts.forEach((p) => {
      items.push({ id: p.debtId, name: p.debtName, amountCents: p.minimumPaymentCents });
    });
  }
  return items;
};

export const isPaymentRecorded = (
  payment: { id: string; name: string; amountCents: number },
  transactions: TransactionDTO[]
) => {
  const lowerName = payment.name.toLowerCase();
  return transactions.some(
    (tx) =>
      tx.kind === 'expense' &&
      (tx.tags ?? []).includes('debt-payment') &&
      tx.description.toLowerCase().includes(lowerName)
  );
};

export const computeRecordedPaymentIds = (transactions: TransactionDTO[], entry: FortnightlyTimelineEntry | null) => {
  const recorded = new Set<string>();
  getPlannedPayments(entry).forEach((payment) => {
    if (isPaymentRecorded(payment, transactions)) {
      recorded.add(payment.id);
    }
  });
  return recorded;
};

export const calculateComplianceScore = (
  entry: FortnightlyTimelineEntry | null,
  isPaymentCompleted: (paymentId: string) => boolean
) => {
  if (!entry) return { done: 0, total: 0, percentage: 0 };
  const planned = getPlannedPayments(entry);
  const done = planned.filter((p) => isPaymentCompleted(p.id)).length;
  return {
    done,
    total: planned.length,
    percentage: planned.length === 0 ? 0 : Math.round((done / planned.length) * 100),
  };
};

export const calculateBudgetVariance = (fortnightDetail: FortnightDetailDTO | null) => {
  if (!fortnightDetail) return { spent: 0, allocated: 0, variance: 0, percentageVar: 0 };
  const totalSpent = fortnightDetail.bucketBreakdowns.reduce((sum, b) => sum + b.spentCents, 0);
  const totalAllocated = fortnightDetail.bucketBreakdowns.reduce((sum, b) => sum + b.allocatedCents, 0);
  const variance = totalSpent - totalAllocated;
  return {
    spent: totalSpent,
    allocated: totalAllocated,
    variance,
    percentageVar: totalAllocated === 0 ? 0 : Math.round((Math.abs(variance) / totalAllocated) * 100),
  };
};

export const normalizeFortnightDates = (startDate: string, endDate: string) => ({
  start: formatDateToISO(startDate),
  end: formatDateToISO(endDate),
});
