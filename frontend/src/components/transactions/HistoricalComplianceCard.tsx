import { Badge, Card, Group, Progress, Stack, Text } from '@mantine/core';

interface ComplianceData {
  done: number;
  total: number;
  percentage: number;
}

interface VarianceData {
  variance: number;
  percentageVar: number;
}

interface HistoricalComplianceCardProps {
  visible: boolean;
  compliance: ComplianceData;
  variance: VarianceData;
}

export function HistoricalComplianceCard({ visible, compliance, variance }: HistoricalComplianceCardProps) {
  if (!visible) return null;

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder bg="blue.0">
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Text size="sm" fw={600}>
            📋 Fortnight Compliance Summary
          </Text>
          <Badge color="cyan" variant="light">
            Historical
          </Badge>
        </Group>
        <Group gap="lg" wrap="wrap">
          <Stack gap={4}>
            <Text size="xs" c="dimmed">
              Debt Payment Completion
            </Text>
            <Group gap="xs">
              <Progress
                value={compliance.percentage}
                size="sm"
                radius="md"
                style={{ flex: 1, minWidth: 150 }}
                color={compliance.percentage === 100 ? 'green' : compliance.percentage >= 80 ? 'yellow' : 'orange'}
              />
              <Text size="sm" fw={600}>
                {compliance.percentage}%
              </Text>
            </Group>
          </Stack>
          <Stack gap={4}>
            <Text size="xs" c="dimmed">
              Budget Variance
            </Text>
            <Text size="sm" fw={600}>
              {variance.variance === 0
                ? 'On budget'
                : variance.variance < 0
                  ? `${variance.percentageVar}% under`
                  : `${variance.percentageVar}% over`}
            </Text>
          </Stack>
        </Group>
      </Stack>
    </Card>
  );
}
