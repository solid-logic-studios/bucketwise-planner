import { Card, Group, Text, Timeline } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client.js';
import type { DebtDTO, DebtPayoffPlanDTO, FortnightlyTimelineEntry } from '../../api/types.js';
import { DebtTypeBadge } from '../DebtTypeBadge.js';

interface DebtPayoffMilestonesProps {
  currentFortnightId?: string;
}

export function DebtPayoffMilestones({ currentFortnightId }: DebtPayoffMilestonesProps) {
  const [debts, setDebts] = useState<DebtDTO[]>([]);
  const [plan, setPlan] = useState<DebtPayoffPlanDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const profile = await api.getProfile();
        const [list, payoff] = await Promise.all([
          api.listDebts(),
          api.getDebtPayoffPlan(profile.defaultFireExtinguisherAmountCents, undefined, currentFortnightId),
        ]);
        if (!mounted) return;
        setDebts(list);
        setPlan(payoff);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [currentFortnightId]);

  const payoffDates = useMemo(() => {
    if (!plan) return new Map<string, { date: string; order: number }>();
    const result = new Map<string, { date: string; order: number }>();
    // Primary: use explicit debtsPaidOffThisMonth entries
    plan.timeline.forEach((t: FortnightlyTimelineEntry, idx) => {
      for (const d of t.debtsPaidOffThisMonth) {
        result.set(d.id, { date: t.paymentDate, order: idx });
      }
    });
    // Fallback: infer when the active debt switches (previous active reaches 0)
    let prevActiveId: string | null = null;
    plan.timeline.forEach((t: FortnightlyTimelineEntry, idx) => {
      const activeId = t.debtBeingPaid?.id || null;
      // const bal = t.remainingBalanceOfActiveDebtCents;
      if (prevActiveId && activeId && activeId !== prevActiveId) {
        // previous active changed – mark previous as paid off at previous step if not recorded
        const prevIdx = Math.max(0, idx - 1);
        const prevDate = plan.timeline[prevIdx]?.paymentDate || t.paymentDate;
        if (!result.has(prevActiveId)) {
          result.set(prevActiveId, { date: prevDate, order: prevIdx });
        }
      }
      prevActiveId = activeId;
      // bal can be used for future enhancement to detect exact zero crossover
    });
    // Final entry: ensure the last active debt is marked
    const last = plan.timeline[plan.timeline.length - 1];
    const lastActiveId = last?.debtBeingPaid?.id || null;
    if (lastActiveId && !result.has(lastActiveId)) {
      result.set(lastActiveId, { date: last.paymentDate, order: plan.timeline.length - 1 });
    }
    return result;
  }, [plan]);

  const items = useMemo(() => {
    const entries = debts.map((d) => ({
      id: d.id,
      name: d.name,
      debtType: d.debtType,
      priority: d.priority,
      payoffDate: payoffDates.get(d.id)?.date || null,
      order: payoffDates.get(d.id)?.order ?? Number.MAX_SAFE_INTEGER,
    }));
    return entries
      .sort((a, b) => a.order - b.order || a.priority - b.priority)
      .map((e) => ({
        ...e,
        label: e.payoffDate ? new Date(e.payoffDate).toLocaleDateString() : 'Not projected',
      }));
  }, [debts, payoffDates]);

  return (
    <Card withBorder shadow="sm" p="md" radius="md">
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Debt Milestones</Text>
        {plan ? (
          <Text size="sm" c="dimmed">Projected debt-free in ~{Math.ceil(plan.totalFortnightsToPayoff / 2)} months</Text>
        ) : null}
      </Group>
      {loading ? (
        <Text size="sm" c="dimmed">Loading...</Text>
      ) : error ? (
        <Text c="red">{error}</Text>
      ) : (
        <Timeline bulletSize={20} lineWidth={2} active={items.filter((i) => i.payoffDate).length - 1}>
          {items.map((item) => (
            <Timeline.Item key={item.id} title={item.name} bullet={<DebtTypeBadge debtType={item.debtType} />}>
              <Text size="sm" c="dimmed">{item.payoffDate ? `Projected payoff: ${item.label}` : 'No payoff projection (check priorities/minimums)'}</Text>
            </Timeline.Item>
          ))}
        </Timeline>
      )}
    </Card>
  );
}
