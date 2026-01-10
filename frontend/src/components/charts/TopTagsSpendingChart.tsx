import { BarChart } from '@mantine/charts';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client.js';
import type { TransactionDTO } from '../../api/types.js';
import { formatCurrency } from '../../utils/formatters.js';
import { BaseChart } from './BaseChart.js';

interface TopTagsSpendingChartProps {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  maxTags?: number;
}

function canonicalize(tag: string): string {
  return tag.trim().toLowerCase();
}

export function TopTagsSpendingChart({ startDate, endDate, maxTags = 8 }: TopTagsSpendingChartProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { transactions } = await api.listTransactions({ startDate, endDate, limit: 500 });
        if (!mounted) return;
        setTransactions(transactions);
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
  }, [startDate, endDate]);

  const data = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const t of transactions) {
      if ((t.kind || '').toLowerCase() !== 'expense') continue;
      const tags = t.tags || [];
      for (const raw of tags) {
        const tag = canonicalize(raw);
        totals[tag] = (totals[tag] || 0) + t.amountCents / 100;
      }
    }
    const entries = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTags)
      .map(([tag, amount]) => ({ tag, amount }));
    return entries.length > 0 ? entries : [];
  }, [transactions, maxTags]);

  return (
    <BaseChart
      title={startDate && endDate ? `Top Spending Tags (${startDate} → ${endDate})` : 'Top Spending Tags'}
      description={startDate && endDate ? 'Your highest expense tags in the current fortnight' : 'Your highest expense tags in the selected period'}
      loading={loading}
      error={error}
    >
      <BarChart
        h={280}
        data={data}
        dataKey="tag"
        series={[{ name: 'amount', label: 'Amount ($)', color: 'amber.5' }]}
        withLegend
        gridAxis="xy"
        orientation="horizontal"
        valueFormatter={(value) => formatCurrency(Math.round(value * 100))}
      />
    </BaseChart>
  );
}
