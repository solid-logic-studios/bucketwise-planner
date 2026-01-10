import { AreaChart } from '@mantine/charts';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client.js';
import type { DebtPayoffPlanDTO, FortnightlyTimelineEntry, ProfileDTO } from '../../api/types.js';
import { BaseChart } from './BaseChart.js';

interface DebtPayoffTimelineChartProps {
  currentFortnightId?: string;
}

export function DebtPayoffTimelineChart({ currentFortnightId }: DebtPayoffTimelineChartProps) {
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [plan, setPlan] = useState<DebtPayoffPlanDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const p = await api.getProfile();
        if (!mounted) return;
        setProfile(p);
        const planData = await api.getDebtPayoffPlan(
          p.defaultFireExtinguisherAmountCents,
          undefined,
          currentFortnightId
        );
        if (!mounted) return;
        setPlan(planData);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [currentFortnightId]);

  const data = useMemo(() => {
    if (!plan) return [] as Array<{ date: string; totalDebtRemaining: number }>;
    return plan.timeline.map((t: FortnightlyTimelineEntry) => ({
      date: t.paymentDate,
      totalDebtRemaining: t.totalDebtRemainingCents / 100,
    }));
  }, [plan]);

  const description = useMemo(() => {
    if (!plan || !profile) return undefined;
    const fortnights = plan.totalFortnightsToPayoff;
    const months = Math.ceil(fortnights / 2);
    return `Debt-free in about ${months} months at ${
      profile.defaultFireExtinguisherAmountCents / 100
    }$/fortnight Fire Extinguisher.`;
  }, [plan, profile]);

  return (
    <BaseChart
      title="Debt Payoff Timeline"
      description={description}
      loading={loading}
      error={error}
    >
      <AreaChart
        h={280}
        data={data}
        dataKey="date"
        series={[{ name: 'totalDebtRemaining', label: 'Total Debt Remaining', color: 'accent.5' }]}
        curveType="linear"
        withLegend
        gridAxis="xy"
        yAxisLabel="$"
      />
    </BaseChart>
  );
}
