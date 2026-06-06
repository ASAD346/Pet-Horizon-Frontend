import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type { DashboardStatus, DashboardTask } from '@/types/dashboard';

const SCOPE = 'DashboardAPI';

export async function fetchDashboardStatus(token: string): Promise<DashboardStatus> {
  log.info(SCOPE, 'GET /dashboard/status');
  try {
    const data = await apiRequest<DashboardStatus>(API_ENDPOINTS.dashboard.status, { token });
    log.ok(SCOPE, 'Dashboard status loaded', { petId: data.petId, plan: data.plan });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Dashboard status failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchUpcomingTasks(token: string): Promise<DashboardTask[]> {
  log.info(SCOPE, 'GET /dashboard/upcoming-tasks');
  try {
    const data = await apiRequest<DashboardTask[]>(API_ENDPOINTS.dashboard.upcomingTasks, { token });
    log.ok(SCOPE, 'Upcoming tasks loaded', { count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Upcoming tasks failed', getErrorMessage(error));
    throw error;
  }
}
