import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type { ApiJournalEntry, CreateJournalRequest, JournalListResponse } from '@/types/journal';

const SCOPE = 'JournalAPI';

export async function fetchJournalEntries(
  token: string,
  petId: string,
  page = 1,
  limit = 100,
): Promise<JournalListResponse> {
  log.info(SCOPE, 'GET /journal', { petId, page, limit });
  try {
    const query = `?petId=${encodeURIComponent(petId)}&page=${page}&limit=${limit}`;
    const data = await apiRequest<JournalListResponse>(`${API_ENDPOINTS.journal.list}${query}`, {
      token,
    });
    log.ok(SCOPE, 'Journal loaded', { petId, count: data.items?.length ?? 0, total: data.total });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Journal load failed', { petId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function createJournalEntry(
  token: string,
  payload: CreateJournalRequest,
): Promise<ApiJournalEntry> {
  log.info(SCOPE, 'POST /journal', { petId: payload.petId, activityType: payload.activityType });
  try {
    const data = await apiRequest<ApiJournalEntry>(API_ENDPOINTS.journal.create, {
      method: 'POST',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Journal entry created', { id: data._id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Create journal failed', getErrorMessage(error));
    throw error;
  }
}

export async function updateJournalEntry(
  token: string,
  entryId: string,
  payload: { note?: string; activityType?: string; imagePath?: string | null },
): Promise<ApiJournalEntry> {
  log.info(SCOPE, 'PUT /journal/:id', { entryId });
  try {
    const data = await apiRequest<ApiJournalEntry>(API_ENDPOINTS.journal.byId(entryId), {
      method: 'PUT',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Journal entry updated', { entryId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Update journal failed', getErrorMessage(error));
    throw error;
  }
}

export async function deleteJournalEntry(
  token: string,
  entryId: string,
): Promise<{ message: string }> {
  log.info(SCOPE, 'DELETE /journal/:id', { entryId });
  try {
    const data = await apiRequest<{ message: string }>(API_ENDPOINTS.journal.byId(entryId), {
      method: 'DELETE',
      token,
    });
    log.ok(SCOPE, 'Journal entry deleted', { entryId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Delete journal failed', getErrorMessage(error));
    throw error;
  }
}
