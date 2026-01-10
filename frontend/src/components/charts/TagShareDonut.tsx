import { PieChart } from '@mantine/charts';
import { Center, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client.js';
import type { TransactionDTO } from '../../api/types.js';
import { formatCurrency } from '../../utils/formatters.js';
import { BaseChart } from './BaseChart.js';

interface TagShareDonutProps {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  maxSlices?: number;
}

function canonicalize(tag: string): string {
  return tag.trim().toLowerCase();
}

export function TagShareDonut({ startDate, endDate, maxSlices = 6 }: TagShareDonutProps) {
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
    return () => { mounted = false; };
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
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const top = entries.slice(0, maxSlices);
    const others = entries.slice(maxSlices);
    const othersTotal = others.reduce((sum, [, amount]) => sum + amount, 0);
    const palette = ['amber.5', 'accent.5', 'night.5', 'amber.7', 'accent.7', 'night.7'];
    const chartData = top.map(([name, value], idx) => ({ name, value, color: palette[idx % palette.length] }));
    if (othersTotal > 0) chartData.push({ name: 'Other', value: othersTotal, color: 'night.9' });
    return chartData;
  }, [transactions, maxSlices]);

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  return (
    <BaseChart
      title="Tag Share (Expenses)"
      description="Distribution of expense tags in the selected period"
      loading={loading}
      error={error}
    >
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing="sm">
        <Center>
          <PieChart
            withLabels
            labelsType="percent"
            size={200}
            data={data}
          />
        </Center>

        {data.length > 0 && (
          <Stack gap={8} align="flex-start" justify="flex-start">
            {data.map((item) => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              const colorVar = `var(--mantine-color-${item.color.replace('.', '-')})`;
              const amountCents = Math.round(item.value * 100);
              return (
                <Group key={item.name} gap={8} align="center">
                  <span
                    aria-hidden
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: colorVar,
                      boxShadow: '0 0 0 1px var(--mantine-color-dark-6)'
                    }}
                  />
                  <Text size="sm">{item.name} — {pct}% · {formatCurrency(amountCents)}</Text>
                </Group>
              );
            })}
          </Stack>
        )}
      </SimpleGrid>
    </BaseChart>
  );
}
