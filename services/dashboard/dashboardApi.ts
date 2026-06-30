import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type { DashboardStatus, DashboardTask, UnifiedDashboardData } from '@/types/dashboard';

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
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localDate = new Date().toISOString().split('T')[0];
  const offset = new Date().getTimezoneOffset();
  const queryParams = `?timezone=${encodeURIComponent(timezone)}&localDate=${localDate}&date=${localDate}&offset=${offset}`;
  
  log.info(SCOPE, `GET /dashboard/upcoming-tasks${queryParams}`);
  try {
    const data = await apiRequest<DashboardTask[]>(`${API_ENDPOINTS.dashboard.upcomingTasks}${queryParams}`, { token });
    log.ok(SCOPE, 'Upcoming tasks loaded', { count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Upcoming tasks failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchUnifiedDashboard(token: string, clientDate?: string): Promise<UnifiedDashboardData> {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localDate = new Date().toISOString().split('T')[0];
  const offset = new Date().getTimezoneOffset();
  let queryParams = `?timezone=${encodeURIComponent(timezone)}&localDate=${localDate}&date=${localDate}&offset=${offset}`;
  if (clientDate) {
    queryParams += `&clientDate=${encodeURIComponent(clientDate)}`;
  }

  log.info(SCOPE, `GET /dashboard${queryParams}`);
  try {
    const data = await apiRequest<UnifiedDashboardData>(`${API_ENDPOINTS.dashboard.unified}${queryParams}`, { token });
    log.ok(SCOPE, 'Unified dashboard loaded');
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Unified dashboard loading failed', getErrorMessage(error));
    throw error;
  }
}
