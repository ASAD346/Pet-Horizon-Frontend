import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type { ApiJournalEntry } from '@/types/journal';

const SCOPE = 'ActivityHistoryAPI';

export type ActivityType =
  | 'all'
  | 'Feeding'
  | 'Walk'
  | 'Medicine'
  | 'Grooming'
  | 'Vaccination';

export type ActivityStatus = 'all' | 'completed' | 'skipped';

export interface ActivityHistoryParams {
  petId: string;
  type?: ActivityType;
  status?: ActivityStatus;
  startDate?: string;   // ISO date string
  endDate?: string;     // ISO date string
  page?: number;
  limit?: number;
}

export interface ActivityHistoryResponse {
  items: ApiJournalEntry[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/**
 * Fetch paginated activity history from the journal endpoint.
 * Supports type, date range, and pagination filters.
 */
export async function fetchActivityHistory(
  token: string,
  params: ActivityHistoryParams,
): Promise<ActivityHistoryResponse> {
  const {
    petId,
    type = 'all',
    status = 'all',
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = params;

  log.info(SCOPE, 'GET /journal (activity history)', { petId, type, page });

  const qp = new URLSearchParams({
    petId,
    page: String(page),
    limit: String(limit),
  });
  if (type !== 'all') qp.set('activityType', type);
  if (status !== 'all') qp.set('status', status);
  if (startDate) qp.set('startDate', startDate);
  if (endDate) qp.set('endDate', endDate);

  try {
    const raw = await apiRequest<any>(
      `${API_ENDPOINTS.journal.list}?${qp.toString()}`,
      { token },
    );

    // Handle both paginated { items, total } and raw array responses
    if (Array.isArray(raw)) {
      return {
        items: raw as ApiJournalEntry[],
        page,
        limit,
        total: raw.length,
        hasMore: false,
      };
    }

    const response = raw as { items?: ApiJournalEntry[]; total?: number };
    const items = response.items ?? [];
    const total = response.total ?? items.length;
    return {
      items,
      page,
      limit,
      total,
      hasMore: page * limit < total,
    };
  } catch (error) {
    log.fail(SCOPE, 'Activity history failed', getErrorMessage(error));
    throw error;
  }
}
