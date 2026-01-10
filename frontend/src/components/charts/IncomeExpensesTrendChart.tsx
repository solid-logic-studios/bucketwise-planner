import { AreaChart } from '@mantine/charts';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client.js';
import type { ForthnightSummaryDTO } from '../../api/types.js';
import { formatDate } from '../../utils/formatters.js';
import { BaseChart } from './BaseChart.js';

export function IncomeExpensesTrendChart() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fortnights, setFortnights] = useState<ForthnightSummaryDTO[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const list = await api.listFortnights();
        if (!mounted) return;
        setFortnights(list);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const data = useMemo(() => {
    const transformed = fortnights
      .slice()
      .sort((a, b) => a.periodStart.localeCompare(b.periodStart))
      .map((f) => {
        return {
          date: formatDate(f.periodStart),
          Income: f.totalIncomeCents / 100,
          Expenses: f.totalExpensesCents / 100,
        };
      });
    return transformed;
  }, [fortnights]);

  return (
    <BaseChart
      title="Income vs Expenses Trend"
      description="Fortnight-over-fortnight trend to track spending pace"
      loading={loading}
      error={error}
    >
      <AreaChart
        h={280}
        data={data}
        dataKey="date"
        series={[
          { name: 'Income', label: 'Income', color: 'accent.5' },
          { name: 'Expenses', label: 'Expenses', color: 'amber.5' },
        ]}
        curveType="linear"
        withLegend
        gridAxis="xy"
        valueFormatter={(value) => `$${value.toFixed(2)}`}
      />
    </BaseChart>
  );
}
