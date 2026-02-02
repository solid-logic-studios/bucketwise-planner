# Chart Integration Points

This document identifies where charts should be added in future iterations.

## Dashboard View (`src/views/DashboardView.tsx`)

### Payoff Timeline Sparkline
**Location**: Line ~169, in the Debts Card section  
**Current**: TODO comment placeholder  
**Recommended Chart**: Small sparkline or area chart showing debt payoff projection over time  
**Data Source**: `dashboard.debtFreeInMonths` and debt timeline from `GET /debts/payoff-plan`  
**Libraries**: Consider `recharts`, `nivo`, or `visx` (all Mantine-compatible)

```tsx
{/* TODO: add payoff timeline chart here. */}
// Suggested implementation:
// <Card>
//   <Text size="sm" fw={600}>Debt Payoff Projection</Text>
//   <AreaChart
//     data={payoffTimeline}
//     xAxis="month"
//     yAxis="totalDebtRemaining"
//     height={120}
//   />
// </Card>
```

## Debts View (`src/views/DebtsView.tsx`)

### Debt Payoff Gantt/Timeline
**Location**: Line ~195, after the monthly timeline table  
**Current**: TODO comment placeholder  
**Recommended Chart**: Gantt-style timeline or stacked bar chart showing when each debt will be paid off  
**Data Source**: `plan.timeline` (MonthlyTimelineEntry[])  
**Visual**: Each debt as a horizontal bar, color-coded by debt type, showing payoff progression month-by-month

```tsx
{/* TODO: Add payoff timeline chart/gantt visualization */}
// Suggested implementation:
// <Card>
//   <Title order={4}>Visual Timeline</Title>
//   <GanttChart
//     data={transformTimelineToGantt(plan.timeline)}
//     colorScale={debtTypeColors}
//     height={300}
//   />
// </Card>
```

## Fortnight View (`src/views/FortnightView.tsx`)

### Transaction Activity Chart (Future)
**Location**: Line ~174, after bucket breakdown grid  
**Current**: TODO comment placeholder  
**Potential Chart**: Timeline or bar chart showing daily transaction activity within the fortnight period  
**Data Source**: Would need `GET /transactions?fortnightId=...` grouped by date  
**Visual**: Daily spend by bucket, stacked bar or line chart

```tsx
{/* TODO: Add transaction timeline/chart for this fortnight */}
// Suggested implementation (future):
// <Card>
//   <Title order={4}>Spending Activity</Title>
//   <BarChart
//     data={groupTransactionsByDate(fortnightId)}
//     stacked
//     categories={['daily-expenses', 'splurge', 'smile']}
//     height={200}
//   />
// </Card>
```

## Recommended Chart Libraries

### Option 1: Recharts
- **Pros**: Most popular, well-maintained, declarative API
- **Install**: `pnpm add recharts`
- **Mantine Integration**: Good, needs custom theming
- **Size**: ~100KB gzipped

### Option 2: Nivo
- **Pros**: Beautiful defaults, many chart types, responsive
- **Install**: `pnpm add @nivo/core @nivo/line @nivo/bar`
- **Mantine Integration**: Excellent, supports dark themes
- **Size**: ~80KB gzipped (per chart type)

### Option 3: visx (Airbnb)
- **Pros**: Low-level, maximum flexibility, D3-based
- **Install**: `pnpm add @visx/shape @visx/scale @visx/axis`
- **Mantine Integration**: Full control, needs manual theming
- **Size**: ~40KB gzipped (minimal)

## Implementation Strategy

1. **Phase 1 (Current)**: Document insertion points with TODO comments ✅
2. **Phase 2 (Next)**: Choose chart library and install dependencies
3. **Phase 3**: Implement dashboard payoff sparkline (highest value)
4. **Phase 4**: Add debts timeline/gantt chart
5. **Phase 5**: Consider fortnight activity chart if needed

## Chart Theming

All charts should use theme colors from `src/theme.ts`:
- Primary: `accent` (teal)
- Secondary: `amber`
- Background: `night[8]` (dark navy)
- Text: `night[0]` (light)
- Grid: `night[6]` (subtle)

Example theme config for Recharts:
```tsx
const chartTheme = {
  stroke: theme.colors.accent[5],
  fill: theme.colors.accent[8],
  grid: theme.colors.night[6],
  text: theme.colors.night[0],
};
```
