import { API_BASE_URL } from '@/constants/api';
import { ApiError } from '@/lib/api/errors';
import { store } from '@/redux/store';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

interface ApiErrorBody {
  error?: string;
  message?: string;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ApiErrorBody;
    return data.error ?? data.message ?? response.statusText ?? 'Request failed';
  } catch {
    return response.statusText || 'Request failed';
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    token,
    headers = {},
    timeoutMs = 30000,
  } = options;

  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Retrieve isolated activePetId from Redux store
  const state = store.getState();
  const activePetId = state.auth.user?.activePetId;

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (activePetId) {
    requestHeaders['x-active-pet-id'] = activePetId;
    requestHeaders['X-Active-Pet-Id'] = activePetId;
  }

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      throw new ApiError(message, response.status);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      const hint = __DEV__ ? ` (${API_BASE_URL})` : '';
      throw new ApiError(
        `Request timed out. Is the API running? On a real phone, set EXPO_PUBLIC_API_URL to your PC IP in .env${hint}`,
        0,
        'TIMEOUT',
      );
    }

    const hint = __DEV__ ? ` API: ${API_BASE_URL}` : '';
    throw new ApiError(
      `Unable to reach the server.${hint}`,
      0,
      'NETWORK',
    );
  }
}
