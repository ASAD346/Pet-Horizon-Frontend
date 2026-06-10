import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { apiFormRequest } from '@/lib/api/formRequest';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type {
  ActivityEntry,
  ActivityTimelineResponse,
  CreateActivityRequest,
  UpdateActivityRequest,
} from '@/types/activity';

const SCOPE = 'ActivityAPI';

export async function fetchActivityTimeline(
  token: string,
  petId: string,
  options?: { date?: string; category?: string },
): Promise<ActivityTimelineResponse> {
  const params = new URLSearchParams();
  if (options?.date) params.set('date', options.date);
  if (options?.category) params.set('category', options.category);
  const query = params.toString() ? `?${params.toString()}` : '';
  log.info(SCOPE, 'GET activity-timeline', { petId, ...options });
  try {
    const data = await apiRequest<ActivityTimelineResponse>(
      `${API_ENDPOINTS.activity.timeline(petId)}${query}`,
      { token },
    );
    log.ok(SCOPE, 'Timeline loaded', { petId, count: data.entries?.length ?? 0 });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Timeline load failed', { petId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function createActivityEntry(
  token: string,
  petId: string,
  payload: CreateActivityRequest,
  imageUris: string[] = [],
): Promise<ActivityEntry> {
  log.info(SCOPE, 'POST activity-timeline', { petId, category: payload.category });
  try {
    const data = await apiFormRequest<ActivityEntry>(API_ENDPOINTS.activity.timeline(petId), {
      method: 'POST',
      token,
      fields: {
        category: payload.category,
        title: payload.title,
        description: payload.description,
        date: payload.date,
      },
      imageUris,
    });
    log.ok(SCOPE, 'Activity created', { id: data._id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Create activity failed', getErrorMessage(error));
    throw error;
  }
}

export async function updateActivityEntry(
  token: string,
  petId: string,
  entryId: string,
  payload: UpdateActivityRequest,
  imageUris: string[] = [],
): Promise<ActivityEntry> {
  log.info(SCOPE, 'PUT activity-timeline/:id', { petId, entryId });
  try {
    const data = await apiFormRequest<ActivityEntry>(API_ENDPOINTS.activity.entry(petId, entryId), {
      method: 'PUT',
      token,
      fields: {
        category: payload.category,
        title: payload.title,
        description: payload.description,
        date: payload.date,
      },
      imageUris,
    });
    log.ok(SCOPE, 'Activity updated', { entryId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Update activity failed', getErrorMessage(error));
    throw error;
  }
}

export async function completeActivityEntry(
  token: string,
  petId: string,
  entryId: string,
  completionNote?: string,
  imageUris: string[] = [],
): Promise<ActivityEntry> {
  log.info(SCOPE, 'POST activity-timeline/:id/complete', { petId, entryId });
  try {
    const data = await apiFormRequest<ActivityEntry>(API_ENDPOINTS.activity.complete(petId, entryId), {
      method: 'POST',
      token,
      fields: { completionNote },
      imageUris,
    });
    log.ok(SCOPE, 'Activity completed', { entryId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Complete activity failed', getErrorMessage(error));
    throw error;
  }
}

export async function deleteActivityEntry(
  token: string,
  petId: string,
  entryId: string,
): Promise<void> {
  log.info(SCOPE, 'DELETE activity-timeline/:id', { petId, entryId });
  try {
    await apiRequest(API_ENDPOINTS.activity.entry(petId, entryId), {
      method: 'DELETE',
      token,
    });
    log.ok(SCOPE, 'Activity deleted', { entryId });
  } catch (error) {
    log.fail(SCOPE, 'Delete activity failed', getErrorMessage(error));
    throw error;
  }
}
