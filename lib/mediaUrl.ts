import { API_BASE_URL } from '@/constants/api';

/** Turn API image path (`/v1/uploads/...`) into a full URL for expo-image */
export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://')) {
    return path;
  }
  const origin = API_BASE_URL.replace(/\/v1\/?$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}
