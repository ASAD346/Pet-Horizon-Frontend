import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import { ApiError } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type { ApiUser } from '@/types/auth';

function guessMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  return 'image/jpeg';
}

function fileNameFromUri(uri: string): string {
  const segment = uri.split('/').pop();
  if (segment && segment.includes('.')) return segment;
  return `avatar-${Date.now()}.jpg`;
}

export async function uploadUserAvatar(token: string, localUri: string): Promise<ApiUser> {
  const url = `${API_BASE_URL}${API_ENDPOINTS.users.avatar}`;
  log.info('UserAPI', 'POST /users/avatar');

  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    name: fileNameFromUri(localUri),
    type: guessMimeType(localUri),
  } as unknown as Blob);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    let message = 'Failed to upload profile photo';
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      message = body.error ?? body.message ?? message;
    } catch {
      // ignore parse error
    }
    log.fail('UserAPI', 'Avatar upload failed', message);
    throw new ApiError(message, response.status);
  }

  const user = (await response.json()) as ApiUser;
  log.ok('UserAPI', 'Avatar uploaded');
  return user;
}
