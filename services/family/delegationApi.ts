import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type {
  DelegationTask,
  FamilyCaretaker,
  FamilyGoalStats,
  TimeWindowConfig,
  TimingMode,
} from '@/types/delegation';

const SCOPE = 'DelegationAPI';

export async function fetchCaretakers(token: string, petId: string): Promise<FamilyCaretaker[]> {
  try {
    const res = await apiRequest<{ caretakers: FamilyCaretaker[] }>(
      API_ENDPOINTS.delegation.caretakers(petId),
      { token }
    );
    return res.caretakers || [];
  } catch (error) {
    log.fail(SCOPE, 'fetchCaretakers failed', { petId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function fetchDelegationTasks(
  token: string,
  petId: string,
  date?: string
): Promise<DelegationTask[]> {
  try {
    const res = await apiRequest<{ tasks: DelegationTask[] }>(
      API_ENDPOINTS.delegation.tasks(petId, date),
      { token }
    );
    return res.tasks || [];
  } catch (error) {
    log.fail(SCOPE, 'fetchDelegationTasks failed', { petId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function updateTaskWindowApi(
  token: string,
  petId: string,
  taskId: string,
  payload: { timingMode?: TimingMode; exactTime?: string; window?: Partial<TimeWindowConfig> }
): Promise<DelegationTask> {
  try {
    const data = await apiRequest<DelegationTask>(
      API_ENDPOINTS.delegation.updateWindow(petId, taskId),
      {
        method: 'PATCH',
        token,
        body: payload,
      }
    );
    return data;
  } catch (error) {
    log.fail(SCOPE, 'updateTaskWindow failed', { taskId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function assignTaskApi(
  token: string,
  petId: string,
  taskId: string,
  targetUserId: string | null
): Promise<DelegationTask> {
  try {
    const data = await apiRequest<DelegationTask>(
      API_ENDPOINTS.delegation.assignTask(petId, taskId),
      {
        method: 'PATCH',
        token,
        body: { targetUserId },
      }
    );
    return data;
  } catch (error) {
    log.fail(SCOPE, 'assignTask failed', { taskId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function requestSwapApi(
  token: string,
  petId: string,
  taskId: string,
  payload: { targetUserId?: string | null; note?: string }
): Promise<DelegationTask> {
  try {
    const data = await apiRequest<DelegationTask>(
      API_ENDPOINTS.delegation.requestSwap(petId, taskId),
      {
        method: 'POST',
        token,
        body: payload,
      }
    );
    return data;
  } catch (error) {
    log.fail(SCOPE, 'requestSwap failed', { taskId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function acceptSwapApi(
  token: string,
  petId: string,
  taskId: string
): Promise<DelegationTask> {
  try {
    const data = await apiRequest<DelegationTask>(
      API_ENDPOINTS.delegation.acceptSwap(petId, taskId),
      {
        method: 'POST',
        token,
      }
    );
    return data;
  } catch (error) {
    log.fail(SCOPE, 'acceptSwap failed', { taskId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function acquireLockApi(
  token: string,
  petId: string,
  taskId: string
): Promise<DelegationTask> {
  try {
    const data = await apiRequest<DelegationTask>(
      API_ENDPOINTS.delegation.lock(petId, taskId),
      {
        method: 'POST',
        token,
      }
    );
    return data;
  } catch (error) {
    log.fail(SCOPE, 'acquireLock failed', { taskId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function releaseLockApi(
  token: string,
  petId: string,
  taskId: string
): Promise<DelegationTask> {
  try {
    const data = await apiRequest<DelegationTask>(
      API_ENDPOINTS.delegation.unlock(petId, taskId),
      {
        method: 'POST',
        token,
      }
    );
    return data;
  } catch (error) {
    log.fail(SCOPE, 'releaseLock failed', { taskId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function completeTaskApi(
  token: string,
  petId: string,
  taskId: string,
  payload: {
    walkMetrics?: { durationMinutes?: number; distanceKm?: number };
    notes?: string;
    status?: 'done' | 'skipped' | 'missed';
  } = {}
): Promise<DelegationTask> {
  try {
    const data = await apiRequest<DelegationTask>(
      API_ENDPOINTS.delegation.complete(petId, taskId),
      {
        method: 'POST',
        token,
        body: payload,
      }
    );
    return data;
  } catch (error) {
    log.fail(SCOPE, 'completeTask failed', { taskId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function fetchFamilyGoalsAndStats(
  token: string,
  petId: string
): Promise<FamilyGoalStats> {
  try {
    const data = await apiRequest<FamilyGoalStats>(
      API_ENDPOINTS.delegation.stats(petId),
      { token }
    );
    return data;
  } catch (error) {
    log.fail(SCOPE, 'fetchFamilyGoalsAndStats failed', { petId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function updateFamilyGoalsApi(
  token: string,
  petId: string,
  payload: {
    weeklyTargetMinutes?: number;
    weeklyTargetKm?: number;
    dailyMinimumWalkCount?: number;
    period?: 'daily' | 'weekly';
  }
): Promise<any> {
  try {
    const data = await apiRequest<any>(
      API_ENDPOINTS.delegation.goals(petId),
      {
        method: 'PUT',
        token,
        body: payload,
      }
    );
    return data;
  } catch (error) {
    log.fail(SCOPE, 'updateFamilyGoals failed', { petId, error: getErrorMessage(error) });
    throw error;
  }
}
