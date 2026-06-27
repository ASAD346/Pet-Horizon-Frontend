import { API_BASE_URL } from '@/constants/api';

/** Turn API image path (`/v1/uploads/...`) into a full URL for expo-image */
export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://')) {
    return path;
  }
  
  const origin = API_BASE_URL.replace(/\/v1\/?$/, '');
  let relativePath = path;
  if (relativePath.startsWith('/uploads/')) {
    relativePath = `/v1${relativePath}`;
  } else if (relativePath.startsWith('uploads/')) {
    relativePath = `/v1/${relativePath}`;
  }
  
  return `${origin}${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`;
}
