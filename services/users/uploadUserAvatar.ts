import { Platform } from 'react-native';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import { ApiError } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type { ApiUser } from '@/types/auth';
import { prepareImageForUpload } from '@/lib/uploadUtils';

export async function uploadUserAvatar(token: string, localUri: string): Promise<ApiUser> {
  const url = `${API_BASE_URL}${API_ENDPOINTS.users.avatar}`;
  log.info('UserAPI', 'POST /users/avatar');

  const formData = new FormData();
  if (Platform.OS === 'web') {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const seg = localUri.split('/').pop() ?? `avatar-${Date.now()}.jpg`;
    formData.append('file', blob, seg);
  } else {
    const file = await prepareImageForUpload(localUri, 'avatar');
    log.info('UserAPI', 'Avatar prepared', { name: file.name, type: file.type, uri: file.uri.slice(0, 60) });
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
  }

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

