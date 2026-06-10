import { API_BASE_URL } from '@/constants/api';
import { ApiError } from '@/lib/api/errors';

function guessMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  return 'image/jpeg';
}

function fileNameFromUri(uri: string, prefix: string): string {
  const segment = uri.split('/').pop();
  if (segment && segment.includes('.')) return segment;
  return `${prefix}-${Date.now()}.jpg`;
}

export async function apiFormRequest<T>(
  path: string,
  options: {
    method?: 'POST' | 'PUT';
    token?: string | null;
    fields?: Record<string, string | number | undefined | null>;
    imageUris?: string[];
    imageField?: string;
  } = {},
): Promise<T> {
  const { method = 'POST', token, fields = {}, imageUris = [], imageField = 'images' } = options;
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  }
  for (const uri of imageUris) {
    formData.append(imageField, {
      uri,
      name: fileNameFromUri(uri, imageField),
      type: guessMimeType(uri),
    } as unknown as Blob);
  }

  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      message = body.error ?? body.message ?? message;
    } catch {
      message = response.statusText || message;
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
