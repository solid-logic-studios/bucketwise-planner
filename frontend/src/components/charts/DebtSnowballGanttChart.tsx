import { Badge, Box, Card, Group, Stack, Text } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client.js';
import type { DebtDTO, DebtPayoffPlanDTO, FortnightlyTimelineEntry, ProfileDTO } from '../../api/types.js';
import classes from './DebtSnowballGanttChart.module.css';

interface DebtSnowballGanttChartProps {
  currentFortnightId?: string;
}

function findActiveRangeForDebt(timeline: FortnightlyTimelineEntry[], debtId: string): { startIdx: number | null; endIdx: number | null } {
  let startIdx: number | null = null;
  let endIdx: number | null = null;
  for (let i = 0; i < timeline.length; i++) {
    const t = timeline[i];
    const activeId = t.debtBeingPaid?.id || null;
    if (activeId === debtId) {
      if (startIdx === null) startIdx = i;
      endIdx = i; // last seen
    }
  }
  return { startIdx, endIdx };
}

export function DebtSnowballGanttChart({ currentFortnightId }: DebtSnowballGanttChartProps) {
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
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
        const p = await api.getProfile();
        if (!mounted) return;
        setProfile(p);
        const [list, payoff] = await Promise.all([
          api.listDebts(),
          api.getDebtPayoffPlan(p.defaultFireExtinguisherAmountCents, undefined, currentFortnightId),
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

  const totalFortnights = plan?.totalFortnightsToPayoff ?? 0;

  const rows = useMemo(() => {
    if (!plan) return [] as Array<{
      id: string; name: string; startIdx: number | null; endIdx: number | null; payoffDate?: string | null; priority: number;
    }>;

    // Build payoff dates map
    const payoffMap = new Map<string, string>();
    plan.timeline.forEach((t) => {
      for (const d of t.debtsPaidOffThisMonth) {
        payoffMap.set(d.id, t.paymentDate);
      }
    });

    return debts.map((d) => {
      const { startIdx, endIdx } = findActiveRangeForDebt(plan.timeline, d.id);
      const payoffDate = payoffMap.get(d.id) || null;
      return { id: d.id, name: d.name, startIdx, endIdx, payoffDate, priority: d.priority };
    }).sort((a, b) => a.priority - b.priority);
  }, [plan, debts]);

  return (
    <Card withBorder shadow="sm" p="md" radius="md">
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Snowball Gantt</Text>
        <Group gap={8}>
          {profile ? (
            <Badge variant="light" color="accent" size="sm">FE: ${ (profile.defaultFireExtinguisherAmountCents / 100).toFixed(0) }/fortnight</Badge>
          ) : null}
          {plan ? (
            <Badge variant="light" color="amber" size="sm">~{Math.ceil(totalFortnights / 2)} months</Badge>
          ) : null}
        </Group>
      </Group>
      {loading ? (
        <Text size="sm" c="dimmed">Loading...</Text>
      ) : error ? (
        <Text c="red">{error}</Text>
      ) : (
        <Stack gap="sm">
          {rows.map((row) => {
            const start = row.startIdx ?? 0;
            const end = row.endIdx ?? start;
            const activeFortnights = Math.max(0, end - start + 1);
            const offsetPct = totalFortnights > 0 ? (start / totalFortnights) * 100 : 0;
            const activePct = totalFortnights > 0 ? (activeFortnights / totalFortnights) * 100 : 0;
            // const remainderPct = Math.max(0, 100 - offsetPct - activePct);
            const payoffLabel = row.payoffDate ? new Date(row.payoffDate).toLocaleDateString() : 'Est. payoff in timeline';
            return (
              <div key={row.id}>
                <Group justify="space-between" mb={4}>
                  <Text size="sm" fw={500}>{row.name}</Text>
                  <Badge variant="light" color="amber" size="sm">{payoffLabel}</Badge>
                </Group>
                <Box className={classes.ganttBar}>
                  <Box
                    className={classes.ganttBarFill}
                    style={{
                      left: `${offsetPct}%`,
                      width: `${activePct}%`,
                    }}
                  />
                </Box>
              </div>
            );
          })}
        </Stack>
      )}
    </Card>
  );
}
