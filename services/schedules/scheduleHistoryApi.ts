import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';

const SCOPE = 'ScheduleHistoryAPI';

export type ScheduleHistoryStatus =
  | 'all'
  | 'pending'
  | 'done'
  | 'skipped'
  | 'upcoming'
  | 'disabled';

export type ScheduleHistoryType =
  | 'all'
  | 'feeding'
  | 'walk'
  | 'medicine'
  | 'grooming'
  | 'vaccination';

export interface ScheduleHistoryParams {
  petId: string;
  status?: ScheduleHistoryStatus;
  type?: ScheduleHistoryType;
  startDate?: string;   // ISO date string
  endDate?: string;     // ISO date string
  search?: string;
  page?: number;
  limit?: number;
  isHistoryTab?: boolean;
}

export interface ScheduleHistoryItem {
  _id: string;
  kind: 'feeding' | 'walk' | 'medicine' | 'grooming' | 'vaccination';
  title: string;
  subtitle?: string;
  timeOfDay?: string;
  status: 'pending' | 'done' | 'skipped' | 'upcoming' | 'disabled';
  date?: string;
  petName?: string;
  notes?: string;
  createdAt?: string;
}

export interface ScheduleHistoryResponse {
  items: ScheduleHistoryItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  stats?: {
    total: number;
    pending: number;
    done: number;
    skipped: number;
    disabled: number;
  };
}

/**
 * Fetch paginated schedule history.
 *
 * Falls back to per-type endpoints if the server doesn't have a dedicated /schedules/history.
 * The caller handles the fallback: if the main request 404s we compose per-type data.
 */
export async function fetchScheduleHistory(
  token: string,
  params: ScheduleHistoryParams,
): Promise<ScheduleHistoryResponse> {
  const {
    petId,
    status = 'all',
    type = 'all',
    startDate,
    endDate,
    search = '',
    page = 1,
    limit = 20,
    isHistoryTab,
  } = params;

  log.info(SCOPE, 'GET /schedules/history', { petId, status, type, page });

  const qp = new URLSearchParams({
    petId,
    page: String(page),
    limit: String(limit),
  });
  if (status !== 'all') qp.set('status', status);
  if (type !== 'all') qp.set('type', type);
  if (startDate) qp.set('startDate', startDate);
  if (endDate) qp.set('endDate', endDate);
  if (search.trim()) qp.set('search', search.trim());
  if (isHistoryTab) qp.set('isHistoryTab', 'true');

  try {
    const data = await apiRequest<ScheduleHistoryResponse>(
      `${API_ENDPOINTS.schedules.list}/history?${qp.toString()}`,
      { token },
    );
    log.ok(SCOPE, 'Schedule history loaded', { total: data.total });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Schedule history failed', getErrorMessage(error));
    throw error;
  }
}
