import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DatePreset, DateRange } from '@/components/ui/DateFilterBar';
import { getPresetRange } from '@/components/ui/DateFilterBar';
import type { ActivityType, ActivityStatus } from '@/services/journal/activityHistoryApi';
import { fetchActivityHistory } from '@/services/journal/activityHistoryApi';
import type { ApiJournalEntry } from '@/types/journal';

const PAGE_SIZE = 30;

export interface ActivityHistoryFilters {
  type: ActivityType;
  status: ActivityStatus;
  datePreset: DatePreset;
  customRange?: DateRange;
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isEntrySkipped(entry: ApiJournalEntry): boolean {
  return (entry.note || '').toLowerCase().startsWith('skipped');
}

function applyClientFilters(
  items: ApiJournalEntry[],
  filters: ActivityHistoryFilters,
): ApiJournalEntry[] {
  return items.filter((item) => {
    // Type filter
    if (filters.type !== 'all') {
      const t = (item.activityType || '').toLowerCase();
      const f = filters.type.toLowerCase();
      if (!t.includes(f)) return false;
    }

    // Status filter
    const skipped = isEntrySkipped(item);
    if (filters.status === 'skipped' && !skipped) return false;
    if (filters.status === 'completed' && skipped) return false;

    // Date filter — skip entirely for 'all' preset
    if (filters.datePreset !== 'all') {
      const range = getPresetRange(filters.datePreset, filters.customRange);
      const ts = new Date(item.createdAt).getTime();
      if (ts < range.startDate.getTime() || ts > range.endDate.getTime()) return false;
    }

    return true;
  });
}

export function useActivityHistory(
  token: string | null,
  petId: string | null | undefined,
  filters: ActivityHistoryFilters,
) {
  const [page, setPage] = useState(1);

  const range = filters.datePreset !== 'all'
    ? getPresetRange(filters.datePreset, filters.customRange)
    : null;

  const query = useQuery({
    queryKey: ['activityHistory', petId, filters.type, filters.status, filters.datePreset, page,
      filters.customRange?.startDate?.toISOString(), filters.customRange?.endDate?.toISOString()],
    queryFn: async () => {
      if (!token || !petId) return null;
      return fetchActivityHistory(token, {
        petId,
        type: filters.type,
        status: filters.status,
        // For 'all' preset, don't send date params → server returns everything
        startDate: range ? toIso(range.startDate) : undefined,
        endDate: range ? toIso(range.endDate) : undefined,
        page,
        limit: PAGE_SIZE,
      });
    },
    enabled: Boolean(token && petId),
    staleTime: 1000 * 60 * 2,
  });

  // Apply client-side filtering as safety net
  const rawItems: ApiJournalEntry[] = query.data?.items ?? [];
  const items = useMemo(() => applyClientFilters(rawItems, filters), [rawItems, filters]);

  const total = query.data?.total ?? 0;
  const hasMore = query.data?.hasMore ?? false;

  const loadMore = useCallback(() => {
    if (!query.isLoading && hasMore) setPage((p) => p + 1);
  }, [query.isLoading, hasMore]);

  const resetPage = useCallback(() => setPage(1), []);

  return {
    items,
    total,
    hasMore,
    isLoading: query.isLoading,
    error: query.error,
    loadMore,
    resetPage,
    refetch: query.refetch,
  };
}
