import { LineChart } from '@mantine/charts';
import type { MortgageOverpaymentPlanDTO } from '../../api/types';
import { formatCurrency } from '../../utils/formatters';

interface MortgageOverpaymentChartProps {
  plan: MortgageOverpaymentPlanDTO;
}

export function MortgageOverpaymentChart({ plan }: MortgageOverpaymentChartProps) {
  // Sample data points to avoid rendering too many (performance optimization)
  const sampleEveryN = Math.ceil(Math.max(plan.baseline.length, plan.withFe.length) / 200);

  // Merge baseline and withFe timelines by date
  const dataPoints = new Map<string, { date: string; baseline: number; withFe: number }>();

  plan.baseline.forEach((point, idx) => {
    if (idx % sampleEveryN === 0 || idx === plan.baseline.length - 1) {
      dataPoints.set(point.dateISO, {
        date: point.dateISO,
        baseline: point.remainingCents / 100,
        withFe: 0,
      });
    }
  });

  plan.withFe.forEach((point, idx) => {
    if (idx % sampleEveryN === 0 || idx === plan.withFe.length - 1) {
      const existing = dataPoints.get(point.dateISO);
      if (existing) {
        existing.withFe = point.remainingCents / 100;
      } else {
        dataPoints.set(point.dateISO, {
          date: point.dateISO,
          baseline: 0,
          withFe: point.remainingCents / 100,
        });
      }
    }
  });

  // Convert to sorted array
  const data = Array.from(dataPoints.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Format date labels for better readability
  const formattedData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-AU', { year: 'numeric', month: 'short' }),
    Baseline: d.baseline,
    'With Fire Extinguisher': d.withFe,
  }));

  return (
    <LineChart
      h={400}
      data={formattedData}
      dataKey="date"
      series={[
        { name: 'Baseline', color: 'gray.6' },
        { name: 'With Fire Extinguisher', color: 'teal.4' },
      ]}
      curveType="natural"
      strokeWidth={2}
      gridAxis="xy"
      withLegend
      legendProps={{ verticalAlign: 'top', height: 50 }}
      valueFormatter={(value) => formatCurrency(value * 100)}
      yAxisProps={{
        domain: [0, 'dataMax'],
        tickFormatter: (value: number) => `$${(value / 1000).toFixed(0)}k`,
      }}
      xAxisProps={{
        angle: -45,
        textAnchor: 'end',
        height: 80,
      }}
    />
  );
}
