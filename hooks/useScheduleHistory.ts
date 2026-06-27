import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DatePreset, DateRange } from '@/components/ui/DateFilterBar';
import { getPresetRange } from '@/components/ui/DateFilterBar';
import type {
  ScheduleHistoryStatus,
  ScheduleHistoryType,
  ScheduleHistoryItem,
} from '@/services/schedules/scheduleHistoryApi';
import { fetchScheduleHistory } from '@/services/schedules/scheduleHistoryApi';

// ─── per-type fallback imports ─────────────────────────────────────────────────
import { fetchFeedingSchedules } from '@/services/schedules/feedingApi';
import { fetchWalkSchedules } from '@/services/schedules/walkApi';
import { fetchMedicineSchedules } from '@/services/schedules/medicineApi';
import { fetchVaccinationSchedules } from '@/services/schedules/vaccinationApi';
import { fetchGroomingRecords } from '@/services/grooming/groomingApi';

const PAGE_SIZE = 20;

export interface ScheduleHistoryFilters {
  status: ScheduleHistoryStatus;
  type: ScheduleHistoryType;
  datePreset: DatePreset;
  customRange?: DateRange;
  search: string;
}

export interface ScheduleHistoryStats {
  total: number;
  pending: number;
  done: number;
  skipped: number;
  disabled: number;
}

function toIso(date: Date): string {
  return date.toISOString().split('T')[0];
}

function resolveStatus(item: any): ScheduleHistoryItem['status'] {
  if (item.isActive === false) return 'disabled';
  if (item.status === 'skipped') return 'skipped';
  if (item.status === 'done' || item.isComplete === true || item.completedAt) return 'done';
  return 'pending';
}

function normaliseSchedules(
  items: any[],
  kind: ScheduleHistoryItem['kind'],
): ScheduleHistoryItem[] {
  return items.map((item) => ({
    _id: item._id ?? item.id ?? '',
    kind,
    title:
      item.title || item.name || item.mealType || item.medicationName ||
      item.vaccineName || item.groomingType || kind,
    subtitle: item.notes || item.note || item.amount || item.dosage || item.duration || '',
    timeOfDay: item.timeOfDay || item.time || undefined,
    status: resolveStatus(item),
    date:
      item.date || item.scheduleDate || item.startDate ||
      item.metadata?.dueDate || item.metadata?.scheduledDate || undefined,
    petName: item.petName || undefined,
    notes: item.notes || item.note || undefined,
    createdAt: item.createdAt || undefined,
  }));
}

/** Stage 1: filter by date + type + search (NOT status) */
function applyBaseFilters(
  items: ScheduleHistoryItem[],
  filters: ScheduleHistoryFilters,
): ScheduleHistoryItem[] {
  const range = getPresetRange(filters.datePreset, filters.customRange);
  const start = range.startDate.getTime();
  const end = range.endDate.getTime();

  return items.filter((item) => {
    // Type filter
    if (filters.type !== 'all' && item.kind !== filters.type) return false;

    // Date filter (skip if 'all' to show everything)
    if (filters.datePreset !== 'all' && item.date) {
      const d = new Date(item.date).getTime();
      if (d < start || d > end) return false;
    }

    // Search filter
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const searchable = [item.title, item.subtitle, item.petName, item.notes]
        .filter(Boolean).join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    return true;
  });
}

/** Stage 2: filter by status */
function applyStatusFilter(
  items: ScheduleHistoryItem[],
  status: ScheduleHistoryStatus,
): ScheduleHistoryItem[] {
  if (status === 'all') return items;
  return items.filter((item) => item.status === status);
}

function computeStats(items: ScheduleHistoryItem[]): ScheduleHistoryStats {
  return {
    total: items.length,
    pending: items.filter((i) => i.status === 'pending' || i.status === 'upcoming').length,
    done: items.filter((i) => i.status === 'done').length,
    skipped: items.filter((i) => i.status === 'skipped').length,
    disabled: items.filter((i) => i.status === 'disabled').length,
  };
}

export function useScheduleHistory(
  token: string | null,
  petId: string | null | undefined,
  filters: ScheduleHistoryFilters,
) {
  const [page, setPage] = useState(1);
  const [serverFailed, setServerFailed] = useState(false);

  useEffect(() => {
    setServerFailed(false);
    setPage(1);
  }, [token, petId]);

  const range = getPresetRange(filters.datePreset, filters.customRange);

  // 1. Try dedicated /schedules/history endpoint
  const serverQuery = useQuery({
    queryKey: ['scheduleHistory', petId, filters, page],
    queryFn: async () => {
      if (!token || !petId) return null;
      try {
        return await fetchScheduleHistory(token, {
          petId,
          status: filters.status,
          type: filters.type,
          startDate: filters.datePreset !== 'all' ? toIso(range.startDate) : undefined,
          endDate: filters.datePreset !== 'all' ? toIso(range.endDate) : undefined,
          search: filters.search,
          page,
          limit: PAGE_SIZE,
        });
      } catch {
        setServerFailed(true);
        return null;
      }
    },
    enabled: Boolean(token && petId),
    staleTime: 1000 * 60 * 2,
  });

  // 2. Per-type fallback
  const fallbackQuery = useQuery({
    queryKey: ['scheduleHistoryFallback', petId],
    queryFn: async () => {
      if (!token || !petId) return [];
      const [feeding, walks, medicine, vaccination, grooming] = await Promise.allSettled([
        fetchFeedingSchedules(token, petId),
        fetchWalkSchedules(token, petId),
        fetchMedicineSchedules(token, petId),
        fetchVaccinationSchedules(token, petId),
        fetchGroomingRecords(token, petId),
      ]);
      const safe = <T,>(r: PromiseSettledResult<T[]>): T[] =>
        r.status === 'fulfilled' ? r.value : [];
      return [
        ...normaliseSchedules(safe(feeding), 'feeding'),
        ...normaliseSchedules(safe(walks), 'walk'),
        ...normaliseSchedules(safe(medicine), 'medicine'),
        ...normaliseSchedules(safe(vaccination), 'vaccination'),
        ...normaliseSchedules(safe(grooming), 'grooming'),
      ];
    },
    enabled: Boolean(token && petId && serverFailed),
    staleTime: 1000 * 60 * 2,
  });

  const isLoading =
    serverQuery.isLoading || (serverFailed && fallbackQuery.isLoading);

  // Compute stats and paginated items
  const { items, stats, total, hasMore } = useMemo(() => {
    if (serverQuery.data) {
      // Server returns pre-filtered data — stats are approximate
      const serverStats: ScheduleHistoryStats = {
        total: serverQuery.data.total,
        pending: serverQuery.data.items.filter((i) => i.status === 'pending').length,
        done: serverQuery.data.items.filter((i) => i.status === 'done').length,
        skipped: serverQuery.data.items.filter((i) => i.status === 'skipped').length,
        disabled: serverQuery.data.items.filter((i) => i.status === 'disabled').length,
      };
      return {
        items: serverQuery.data.items,
        stats: serverStats,
        total: serverQuery.data.total,
        hasMore: serverQuery.data.hasMore,
      };
    }

    if (fallbackQuery.data) {
      // Client-side: apply base filters first, compute stats, then apply status filter
      const baseFiltered = applyBaseFilters(fallbackQuery.data, filters);
      const stats = computeStats(baseFiltered);
      const statusFiltered = applyStatusFilter(baseFiltered, filters.status);
      const sliced = statusFiltered.slice(0, page * PAGE_SIZE);
      return {
        items: sliced,
        stats,
        total: statusFiltered.length,
        hasMore: sliced.length < statusFiltered.length,
      };
    }

    return {
      items: [],
      stats: { total: 0, pending: 0, done: 0, skipped: 0, disabled: 0 },
      total: 0,
      hasMore: false,
    };
  }, [serverQuery.data, fallbackQuery.data, filters, page]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) setPage((p) => p + 1);
  }, [isLoading, hasMore]);

  const resetPage = useCallback(() => setPage(1), []);

  return {
    items,
    stats,
    total,
    hasMore,
    isLoading,
    error: serverQuery.error ?? fallbackQuery.error,
    loadMore,
    resetPage,
    refetch: serverFailed ? fallbackQuery.refetch : serverQuery.refetch,
  };
}
