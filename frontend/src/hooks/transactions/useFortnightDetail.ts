import { useCallback, useState } from 'react';
import { api } from '../../api/client.js';
import type { FortnightDetailDTO } from '../../api/types.js';

export const useFortnightDetail = () => {
  const [fortnightDetail, setFortnightDetail] = useState<FortnightDetailDTO | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string>();

  const loadFortnightDetail = useCallback(async (selectedFortnightId: string | null) => {
    if (!selectedFortnightId) return;

    setDetailLoading(true);
    setDetailError(undefined);

    try {
      const detail = await api.getFortnight(selectedFortnightId);
      setFortnightDetail(detail);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to load fortnight detail');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  return { fortnightDetail, detailLoading, detailError, loadFortnightDetail, setFortnightDetail } as const;
};
