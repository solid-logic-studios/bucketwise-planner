import { ActionIcon, Box, Container, Group, Paper, Stack, Text, Title, Tooltip } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { IconQuestionMark } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { MortgageDTO, MortgageOverpaymentPlanDTO, ProfileDTO } from '../api/types';
import { ErrorAlert } from '../components/ErrorAlert';
import { useHelp } from '../components/help/useHelp.js';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MortgageOverpaymentChart } from '../components/charts/MortgageOverpaymentChart.js';
import { formatCurrency, formatPercent } from '../utils/formatters';

export function OwnHomeView() {
  const [mortgage, setMortgage] = useState<MortgageDTO | null>(null);
  const [plan, setPlan] = useState<MortgageOverpaymentPlanDTO | null>(null);
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { openHelp } = useHelp();
  useHotkeys([['mod+/', () => openHelp('ownhome')]]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Load profile, mortgage, and overpayment plan in parallel
      const [profileRes, mortgageRes] = await Promise.all([
        api.getProfile(),
        api.getMortgage(),
      ]);

      setProfile(profileRes);
      setMortgage(mortgageRes);

      // If mortgage exists, load overpayment plan using profile's FE amount
      if (mortgageRes) {
        const planRes = await api.getMortgageOverpaymentPlan(profileRes.defaultFireExtinguisherAmountCents);
        setPlan(planRes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mortgage data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  if (!mortgage) {
    return (
      <Container size="md" py="xl">
        <Paper p="xl" withBorder>
          <Stack gap="md">
            <Title order={2}>Own Your Home</Title>
            <Text c="dimmed">
              No mortgage configured yet. Add your mortgage details to see how Fire Extinguisher overpayments can
              accelerate your path to debt freedom and save on interest.
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  const feAmount = profile?.defaultFireExtinguisherAmountCents || 0;
  const timeSavedYears = plan ? (plan.timeSavedFortnights / 26).toFixed(1) : '0.0';
  const interestSaved = plan?.interestSavedCents || 0;

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1}>Own Your Home</Title>
            <Text c="dimmed" size="sm">
              Visualize how Fire Extinguisher overpayments accelerate mortgage payoff
            </Text>
          </div>
          <Tooltip label="Help (⌘/)">
            <ActionIcon variant="subtle" size="lg" onClick={() => openHelp('ownhome')}>
              <IconQuestionMark size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {/* Mortgage Summary */}
        <Paper p="md" withBorder>
          <Group justify="space-between">
            <Stack gap={4}>
              <Text size="sm" c="dimmed">Mortgage</Text>
              <Text size="lg" fw={600}>{mortgage.name}</Text>
            </Stack>
            <Stack gap={4} align="flex-end">
              <Text size="sm" c="dimmed">Current Balance</Text>
              <Text size="lg" fw={600}>{formatCurrency(mortgage.currentBalanceCents)}</Text>
            </Stack>
            <Stack gap={4} align="flex-end">
              <Text size="sm" c="dimmed">Interest Rate</Text>
              <Text size="lg" fw={600}>{formatPercent(mortgage.interestRate)}</Text>
            </Stack>
            <Stack gap={4} align="flex-end">
              <Text size="sm" c="dimmed">Minimum Payment</Text>
              <Text size="lg" fw={600}>{formatCurrency(mortgage.minimumPaymentCents)}/{mortgage.minPaymentFrequency === 'MONTHLY' ? 'month' : 'fortnight'}</Text>
            </Stack>
          </Group>
        </Paper>

        {/* Impact Summary */}
        {plan && (
          <Group grow>
            <Paper p="md" withBorder>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">Fire Extinguisher</Text>
                <Text size="xl" fw={700} c="teal.4">{formatCurrency(feAmount)}/fortnight</Text>
              </Stack>
            </Paper>
            <Paper p="md" withBorder>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">Time Saved</Text>
                <Text size="xl" fw={700} c="orange.4">{timeSavedYears} years</Text>
              </Stack>
            </Paper>
            <Paper p="md" withBorder>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">Interest Saved</Text>
                <Text size="xl" fw={700} c="green.4">{formatCurrency(interestSaved)}</Text>
              </Stack>
            </Paper>
          </Group>
        )}

        {/* Chart */}
        {plan && (
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Box>
                <Text size="lg" fw={600} mb={4}>Mortgage Payoff Timeline</Text>
                <Text size="sm" c="dimmed">
                  Comparison of minimum-only payments vs. adding Fire Extinguisher overpayments after credit cards are paid off
                </Text>
              </Box>
              <MortgageOverpaymentChart plan={plan} />
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
