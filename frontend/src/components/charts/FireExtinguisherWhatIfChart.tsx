import { AreaChart } from '@mantine/charts';
import { Card, Group, Slider, Text } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client.js';
import type { DebtPayoffPlanDTO, FortnightlyTimelineEntry, ProfileDTO } from '../../api/types.js';

interface FireExtinguisherWhatIfChartProps {
  currentFortnightId?: string;
}

function mergeTimeline(
  baseline: FortnightlyTimelineEntry[],
  whatIf: FortnightlyTimelineEntry[]
): Array<{ date: string; baseline: number | null; whatIf: number | null }> {
  const map = new Map<string, { baseline?: number; whatIf?: number }>();
  for (const t of baseline) {
    map.set(t.paymentDate, { ...(map.get(t.paymentDate) || {}), baseline: t.totalDebtRemainingCents / 100 });
  }
  for (const t of whatIf) {
    map.set(t.paymentDate, { ...(map.get(t.paymentDate) || {}), whatIf: t.totalDebtRemainingCents / 100 });
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, baseline: v.baseline ?? null, whatIf: v.whatIf ?? null }));
}

export function FireExtinguisherWhatIfChart({ currentFortnightId }: FireExtinguisherWhatIfChartProps) {
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [baselinePlan, setBaselinePlan] = useState<DebtPayoffPlanDTO | null>(null);
  const [whatIfPlan, setWhatIfPlan] = useState<DebtPayoffPlanDTO | null>(null);
  const [sliderAmount, setSliderAmount] = useState<number>(0);
  const [debouncedAmount] = useDebouncedValue(sliderAmount, 300);

  useEffect(() => {
    let mounted = true;
    async function loadBaseline() {
      const p = await api.getProfile();
      if (!mounted) return;
      setProfile(p);
      setSliderAmount(p.defaultFireExtinguisherAmountCents / 100);
      const plan = await api.getDebtPayoffPlan(p.defaultFireExtinguisherAmountCents, undefined, currentFortnightId);
      if (!mounted) return;
      setBaselinePlan(plan);
      setWhatIfPlan(plan);
    }
    loadBaseline();
    return () => { mounted = false; };
  }, [currentFortnightId]);

  useEffect(() => {
    let mounted = true;
    async function recalc() {
      if (!profile) return;
      const cents = Math.round(debouncedAmount * 100);
      const plan = await api.getDebtPayoffPlan(cents, undefined, currentFortnightId);
      if (!mounted) return;
      setWhatIfPlan(plan);
    }
    recalc();
    return () => { mounted = false; };
  }, [debouncedAmount, profile, currentFortnightId]);

  const mergedData = useMemo(() => {
    if (!baselinePlan || !whatIfPlan) return [] as Array<{ date: string; baseline: number | null; whatIf: number | null }>;
    return mergeTimeline(baselinePlan.timeline, whatIfPlan.timeline);
  }, [baselinePlan, whatIfPlan]);

  const metrics = useMemo(() => {
    if (!baselinePlan || !whatIfPlan) return null;
    const baselineMonths = Math.ceil(baselinePlan.totalFortnightsToPayoff / 2);
    const whatIfMonths = Math.ceil(whatIfPlan.totalFortnightsToPayoff / 2);
    const monthsSaved = Math.max(0, baselineMonths - whatIfMonths);
    const interestSaved = Math.max(0, (baselinePlan.totalInterestCents - whatIfPlan.totalInterestCents) / 100);
    return { baselineMonths, whatIfMonths, monthsSaved, interestSaved };
  }, [baselinePlan, whatIfPlan]);

  const maxAmount = useMemo(() => {
    if (!profile) return 0;
    return Math.round((profile.fortnightlyIncomeCents * 0.5) / 100); // up to 50% of income
  }, [profile]);

  return (
    <Card withBorder shadow="sm" p="md" radius="md">
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Fire Extinguisher What-If</Text>
        {metrics ? (
          <Text size="sm" c="dimmed">
            {metrics.monthsSaved > 0
              ? `Save ~${metrics.monthsSaved} months and $${metrics.interestSaved.toFixed(0)} in interest`
              : 'Adjust to see potential savings'}
          </Text>
        ) : null}
      </Group>
      <Group align="center" gap="md" mb="md">
        <Text size="sm" fw={500}>Amount</Text>
        <Slider
          value={sliderAmount}
          onChange={setSliderAmount}
          min={0}
          max={maxAmount}
          step={10}
          marks={[{ value: 0, label: '$0' }, { value: maxAmount, label: `$${maxAmount}` }]}
          w="100%"
        />
      </Group>
      <AreaChart
        h={260}
        data={mergedData}
        dataKey="date"
        series={[
          { name: 'baseline', label: 'Baseline', color: 'accent.5' },
          { name: 'whatIf', label: 'What-If', color: 'amber.5' },
        ]}
        curveType="linear"
        withLegend
        gridAxis="xy"
        yAxisLabel="$"
      />
    </Card>
  );
}
