import { ActionIcon, Group, Select } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import type { ForthnightSummaryDTO } from '../api/types.js';

interface FortnightSelectorProps {
  selectedFortnightId: string | null;
  onFortnightChange: (fortnightId: string, startDate: string, endDate: string) => void;
}

/**
 * FortnightSelector: Dropdown and navigation for selecting fortnights.
 * Fetches available fortnights from API and allows prev/next navigation.
 * Displays format: "1/3 - 1/17"
 */
export function FortnightSelector({
  selectedFortnightId,
  onFortnightChange,
}: FortnightSelectorProps) {
  const [fortnights, setFortnights] = useState<ForthnightSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFortnights();
  }, []);

  const loadFortnights = async () => {
    try {
      setLoading(true);
      const data = await api.listFortnights();
      setFortnights(data);
      
      // Default to most recent fortnight if none selected
      if (!selectedFortnightId && data.length > 0) {
        const latest = data[0];
        onFortnightChange(latest.id, latest.periodStart, latest.periodEnd);
      }
    } catch (error) {
      console.error('Failed to load fortnights:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFortnightLabel = (fortnight: ForthnightSummaryDTO): string => {
    const start = new Date(fortnight.periodStart);
    const end = new Date(fortnight.periodEnd);
    
    const startMonth = start.getMonth() + 1;
    const startDay = start.getDate();
    const endMonth = end.getMonth() + 1;
    const endDay = end.getDate();
    
    return `${startMonth}/${startDay} - ${endMonth}/${endDay}`;
  };

  const handleSelectChange = (value: string | null) => {
    if (!value) return;
    
    const fortnight = fortnights.find((f) => f.id === value);
    if (fortnight) {
      onFortnightChange(fortnight.id, fortnight.periodStart, fortnight.periodEnd);
    }
  };

  const handlePrevious = () => {
    if (!selectedFortnightId || fortnights.length === 0) return;
    
    const currentIndex = fortnights.findIndex((f) => f.id === selectedFortnightId);
    if (currentIndex < fortnights.length - 1) {
      const prevFortnight = fortnights[currentIndex + 1];
      onFortnightChange(prevFortnight.id, prevFortnight.periodStart, prevFortnight.periodEnd);
    }
  };

  const handleNext = () => {
    if (!selectedFortnightId || fortnights.length === 0) return;
    
    const currentIndex = fortnights.findIndex((f) => f.id === selectedFortnightId);
    if (currentIndex > 0) {
      const nextFortnight = fortnights[currentIndex - 1];
      onFortnightChange(nextFortnight.id, nextFortnight.periodStart, nextFortnight.periodEnd);
    }
  };

  const selectData = fortnights.map((f) => ({
    value: f.id,
    label: formatFortnightLabel(f),
  }));

  const currentIndex = selectedFortnightId
    ? fortnights.findIndex((f) => f.id === selectedFortnightId)
    : -1;

  return (
    <Group gap="xs">
      <ActionIcon
        variant="light"
        onClick={handlePrevious}
        disabled={loading || currentIndex >= fortnights.length - 1}
        aria-label="Previous fortnight"
      >
        <IconChevronLeft size={18} />
      </ActionIcon>

      <Select
        value={selectedFortnightId}
        onChange={handleSelectChange}
        data={selectData}
        placeholder="Select fortnight..."
        disabled={loading}
        style={{ width: 200 }}
        searchable
      />

      <ActionIcon
        variant="light"
        onClick={handleNext}
        disabled={loading || currentIndex <= 0}
        aria-label="Next fortnight"
      >
        <IconChevronRight size={18} />
      </ActionIcon>
    </Group>
  );
}
