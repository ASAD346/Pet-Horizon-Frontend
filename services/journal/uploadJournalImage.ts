import { Platform } from 'react-native';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import { ApiError } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { prepareImageForUpload } from '@/lib/uploadUtils';
import type { ApiJournalEntry } from '@/types/journal';

export async function uploadJournalImage(
  token: string,
  entryId: string,
  localUri: string,
): Promise<ApiJournalEntry> {
  const url = `${API_BASE_URL}${API_ENDPOINTS.journal.image(entryId)}`;
  log.info('JournalAPI', 'POST /journal/:id/image', { entryId });

  const formData = new FormData();
  if (Platform.OS === 'web') {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const seg = localUri.split('/').pop() ?? `journal-${Date.now()}.jpg`;
    formData.append('file', blob, seg);
  } else {
    const file = await prepareImageForUpload(localUri, 'journal');
    log.info('JournalAPI', 'Journal image prepared', { name: file.name, type: file.type, uri: file.uri.slice(0, 60) });
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
    let message = 'Failed to upload journal photo';
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      message = body.error ?? body.message ?? message;
    } catch {
      // ignore parse error
    }
    log.fail('JournalAPI', 'Journal image upload failed', { entryId, message });
    throw new ApiError(message, response.status);
  }

  const entry = (await response.json()) as ApiJournalEntry;
  log.ok('JournalAPI', 'Journal image uploaded', { entryId });
  return entry;
}
