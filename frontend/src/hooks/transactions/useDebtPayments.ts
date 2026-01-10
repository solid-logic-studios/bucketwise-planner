import { useCallback, useState } from 'react';
import { api } from '../../api/client.js';
import type {
    DebtPayoffPlanDTO,
    FortnightlyTimelineEntry,
    ProfileDTO,
    SkippedDebtPaymentDTO,
    TransactionDTO,
} from '../../api/types.js';
import { formatDateToISO } from '../../utils/formatters.js';
import { computeRecordedPaymentIds, getPlannedPayments } from '../../utils/transactions.js';

export const useDebtPayments = () => {
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [payoffPlan, setPayoffPlan] = useState<DebtPayoffPlanDTO | null>(null);
  const [fortnightEntry, setFortnightEntry] = useState<FortnightlyTimelineEntry | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string>();
  const [skippedPayments, setSkippedPayments] = useState<Record<string, SkippedDebtPaymentDTO>>({});

  const loadDebtPayments = useCallback(async (fortnightStartDate: string | null) => {
    if (!fortnightStartDate) return;

    setPlanLoading(true);
    setPlanError(undefined);

    try {
      const startDateIso = formatDateToISO(fortnightStartDate);
      const profileData = await api.getProfile();
      setProfile(profileData);

      const planData = await api.getDebtPayoffPlan(
        profileData.defaultFireExtinguisherAmountCents,
        new Date(startDateIso)
      );
      setPayoffPlan(planData);

      const entry = planData.timeline.find((e) => formatDateToISO(e.paymentDate) === startDateIso) || null;
      setFortnightEntry(entry);
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Failed to load debt payments');
    } finally {
      setPlanLoading(false);
    }
  }, []);

  const loadSkippedPayments = useCallback(async (selectedFortnightId: string | null) => {
    if (!selectedFortnightId) return;

    try {
      const response = await api.listSkippedDebtPayments(selectedFortnightId);
      const map: Record<string, SkippedDebtPaymentDTO> = {};
      response.skippedPayments.forEach((payment) => {
        map[payment.debtId] = payment;
      });
      setSkippedPayments(map);
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Failed to load skipped payments');
    }
  }, []);

  const isPaymentCompleted = useCallback(
    (paymentId: string, selectedPayments: Set<string>) => selectedPayments.has(paymentId) || Boolean(skippedPayments[paymentId]),
    [skippedPayments]
  );

  const getPaymentStatus = useCallback(
    (paymentId: string, selectedPayments: Set<string>): 'recorded' | 'skipped' | 'pending' => {
      if (selectedPayments.has(paymentId)) return 'recorded';
      if (skippedPayments[paymentId]) return 'skipped';
      return 'pending';
    },
    [skippedPayments]
  );

  const computeRecordedPayments = useCallback(
    (transactions: TransactionDTO[], entryOverride?: FortnightlyTimelineEntry | null) =>
      computeRecordedPaymentIds(transactions, entryOverride ?? fortnightEntry),
    [fortnightEntry]
  );

  return {
    profile,
    payoffPlan,
    fortnightEntry,
    planLoading,
    planError,
    setPlanError,
    skippedPayments,
    setSkippedPayments,
    loadDebtPayments,
    loadSkippedPayments,
    getPlannedPayments,
    computeRecordedPayments,
    isPaymentCompleted,
    getPaymentStatus,
  } as const;
};
