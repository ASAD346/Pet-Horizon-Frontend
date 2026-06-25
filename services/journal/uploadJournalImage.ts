import { Platform } from 'react-native';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import { ApiError } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type { ApiJournalEntry } from '@/types/journal';

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
  return `journal-${Date.now()}.jpg`;
}

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
    formData.append('file', blob, fileNameFromUri(localUri));
  } else {
    formData.append('file', {
      uri: localUri,
      name: fileNameFromUri(localUri),
      type: guessMimeType(localUri),
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
