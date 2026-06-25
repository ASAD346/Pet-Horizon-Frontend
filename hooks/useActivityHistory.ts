import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DatePreset, DateRange } from '@/components/ui/DateFilterBar';
import { getPresetRange } from '@/components/ui/DateFilterBar';
import type { ActivityType, ActivityStatus } from '@/services/journal/activityHistoryApi';
import { fetchActivityHistory } from '@/services/journal/activityHistoryApi';
import type { ApiJournalEntry } from '@/types/journal';

const PAGE_SIZE = 20;

export interface ActivityHistoryFilters {
  type: ActivityType;
  status: ActivityStatus;
  datePreset: DatePreset;
  customRange?: DateRange;
}

function toIso(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isEntrySkipped(entry: ApiJournalEntry): boolean {
  const note = (entry.note || '').toLowerCase();
  return note.startsWith('skipped');
}

function applyClientFilters(
  items: ApiJournalEntry[],
  filters: ActivityHistoryFilters,
): ApiJournalEntry[] {
  const range = getPresetRange(filters.datePreset, filters.customRange);
  const start = range.startDate.getTime();
  const end = range.endDate.getTime();

  return items.filter((item) => {
    // Type filter
    if (filters.type !== 'all') {
      const t = (item.activityType || '').toLowerCase();
      const f = filters.type.toLowerCase();
      if (!t.includes(f)) return false;
    }

    // Status filter
    if (filters.status === 'skipped' && !isEntrySkipped(item)) return false;
    if (filters.status === 'completed' && isEntrySkipped(item)) return false;

    // Date filter
    const ts = new Date(item.createdAt).getTime();
    if (ts < start || ts > end) return false;

    return true;
  });
}

export function useActivityHistory(
  token: string | null,
  petId: string | null | undefined,
  filters: ActivityHistoryFilters,
) {
  const [page, setPage] = useState(1);

  const range = getPresetRange(filters.datePreset, filters.customRange);

  const query = useQuery({
    queryKey: ['activityHistory', petId, filters.type, filters.status, filters.datePreset, filters.customRange, page],
    queryFn: async () => {
      if (!token || !petId) return null;
      return fetchActivityHistory(token, {
        petId,
        type: filters.type,
        status: filters.status,
        startDate: toIso(range.startDate),
        endDate: toIso(range.endDate),
        page,
        limit: PAGE_SIZE,
      });
    },
    enabled: Boolean(token && petId),
    staleTime: 1000 * 60 * 2,
  });

  // Apply client-side filtering as a safety net (in case server ignores some params)
  const rawItems: ApiJournalEntry[] = query.data?.items ?? [];
  const items = applyClientFilters(rawItems, filters);
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
