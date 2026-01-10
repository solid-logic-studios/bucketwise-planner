import { ActionIcon, Grid, Group, Title, Tooltip } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { IconQuestionMark } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { DebtPayoffMilestones } from '../components/charts/DebtPayoffMilestones.js';
import { DebtPayoffTimelineChart } from '../components/charts/DebtPayoffTimelineChart.js';
import { DebtSnowballGanttChart } from '../components/charts/DebtSnowballGanttChart.js';
import { FireExtinguisherWhatIfChart } from '../components/charts/FireExtinguisherWhatIfChart.js';
import { IncomeExpensesTrendChart } from '../components/charts/IncomeExpensesTrendChart.js';
import { TagShareDonut } from '../components/charts/TagShareDonut.js';
import { TopTagsSpendingChart } from '../components/charts/TopTagsSpendingChart.js';
import { useHelp } from '../components/HelpDrawer.js';
import { usePageDataContext } from '../contexts/PageContextProvider.js';
import classes from './ChartsView.module.css';

export function ChartsView() {
  const { openHelp } = useHelp();
  useHotkeys([[ 'mod+/', () => openHelp('charts') ]]);
  const { pageData, setPageData } = usePageDataContext();

  const [startDateStr, setStartDateStr] = useState<string | null>(null);
  const [endDateStr, setEndDateStr] = useState<string | null>(null);
  const [currentFortnightId, setCurrentFortnightId] = useState<string | null>(pageData.fortnightId || null);

  // Get current fortnight ID if not in pageData
  useEffect(() => {
    if (!currentFortnightId) {
      let mounted = true;
      api
        .listFortnights()
        .then((fortnights) => {
          if (mounted && fortnights.length > 0) {
            setCurrentFortnightId(fortnights[0].id);
            setPageData({ fortnightId: fortnights[0].id });
          }
        })
        .catch(() => {
          // ignore - will continue without fortnight
        });
      return () => {
        mounted = false;
      };
    }
  }, [currentFortnightId, setPageData]);

  // Load dashboard with current fortnight
  useEffect(() => {
    let mounted = true;
    if (currentFortnightId) {
      async function loadDashboard() {
        try {
          const d = await api.getDashboard(currentFortnightId || undefined);
          if (!mounted) return;
          console.log('Dashboard loaded:', d.currentFortnight);
          setPageData({ fortnightSnapshot: d.currentFortnight || undefined });
          if (d.currentFortnight) {
            console.log('Setting dates:', d.currentFortnight.periodStart, d.currentFortnight.periodEnd);
            setStartDateStr(d.currentFortnight.periodStart);
            setEndDateStr(d.currentFortnight.periodEnd);
          }
        } catch (error) {
          console.error('Dashboard load error:', error);
          // ignore dashboard load errors for this view
        }
      }
      loadDashboard();
    }
    return () => { mounted = false; };
  }, [currentFortnightId, setPageData]);

  const startISO = useMemo(() => (startDateStr ? dayjs(startDateStr).format('YYYY-MM-DD') : undefined), [startDateStr]);
  const endISO = useMemo(() => (endDateStr ? dayjs(endDateStr).format('YYYY-MM-DD') : undefined), [endDateStr]);

  return (
    <Grid gutter="md" grow>
      <Grid.Col span={12}>
        <Group justify="space-between" mb="md">
          <Title order={3}>Charts</Title>
          <Tooltip label="Help (⌘/)">
            <ActionIcon variant="light" onClick={() => openHelp('charts')}>
              <IconQuestionMark size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }} className={classes.chartColumn}>
        <DebtPayoffTimelineChart currentFortnightId={pageData.fortnightId} />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }} className={classes.chartColumn}>
        <FireExtinguisherWhatIfChart currentFortnightId={pageData.fortnightId} />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }} className={classes.chartColumn}>
        <IncomeExpensesTrendChart />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }} className={classes.chartColumn}>
        <TagShareDonut key={`${startISO}-${endISO}`} startDate={startISO} endDate={endISO} />
      </Grid.Col>

      {/* Top Spending Tags chart in its own grid cell */}
      <Grid.Col span={{ base: 12, md: 6 }} className={classes.chartColumn}>
        <TopTagsSpendingChart key={`${startISO}-${endISO}`} startDate={startISO} endDate={endISO} />
      </Grid.Col>

      

      <Grid.Col span={12}>
        <DebtSnowballGanttChart currentFortnightId={pageData.fortnightId} />
      </Grid.Col>

      <Grid.Col span={12}>
        <DebtPayoffMilestones currentFortnightId={pageData.fortnightId} />
      </Grid.Col>
    </Grid>
  );
}
