/**
 * uploadUtils.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Shared helpers that fix profile/pet photo upload failures on Samsung, Xiaomi,
 * Oppo and other Android OEMs where expo-image-picker returns:
 *   • content:// URIs (no file extension → wrong MIME type detected)
 *   • High-res files that exceed server limits or time out
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Max file size in bytes before we re-compress (5 MB) */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Quality to use when re-compressing an oversized image */
const RECOMPRESS_QUALITY = 0.72;

/** Max dimension (width or height) to resize an oversized image to */
const MAX_DIMENSION = 1200;

// ─── MIME detection ───────────────────────────────────────────────────────────

/**
 * Reads the first few bytes of a local file and returns MIME type from
 * magic-byte signatures. Falls back to extension-based guessing on failure.
 */
async function detectMimeType(localUri: string): Promise<string> {
  if (Platform.OS === 'web') return guessMimeFromExtension(localUri);

  try {
    // Use the new File API to read a small chunk for magic-byte detection
    const file = new File(localUri);
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer, 0, Math.min(12, buffer.byteLength));

    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return 'image/jpeg';
    }
    // PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return 'image/png';
    }
    // WebP: 52 49 46 46 ?? ?? ?? ?? 57 45 42 50
    if (
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    ) {
      return 'image/webp';
    }
  } catch {
    // Fallback to extension if File API can't read (e.g. content:// without copy)
  }

  return guessMimeFromExtension(localUri);
}

function guessMimeFromExtension(uri: string): string {
  const lower = uri.toLowerCase().split('?')[0];
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

// ─── URI normalisation ────────────────────────────────────────────────────────

/**
 * On Android, expo-image-picker can return content:// URIs that can't be
 * directly handled by some upload paths. Copy to app cache and return
 * the file:// URI. On iOS/web the URI is returned as-is.
 */
async function normalizeUri(uri: string): Promise<string> {
  if (Platform.OS !== 'android') return uri;
  if (!uri.startsWith('content://')) return uri;

  try {
    const ext = uri.includes('.')
      ? (uri.split('.').pop()?.split('?')[0] ?? 'jpg')
      : 'jpg';
    const dest = new File(Paths.cache, `upload_${Date.now()}.${ext}`);
    const src = new File(uri);
    src.copy(dest);
    return dest.uri;
  } catch {
    // If copy fails, return original — RN fetch can handle many content:// URIs
    return uri;
  }
}

// ─── Size check & recompression ───────────────────────────────────────────────

/**
 * If the image at `uri` exceeds MAX_UPLOAD_BYTES, recompress via
 * expo-image-manipulator. Returns the (possibly new) URI safe to upload.
 */
async function ensureWithinSizeLimit(uri: string): Promise<string> {
  if (Platform.OS === 'web') return uri;

  try {
    const file = new File(uri);
    const size = file.size;

    if (size > 0 && size <= MAX_UPLOAD_BYTES) return uri;

    // Recompress via manipulateAsync (still fully supported in SDK 54)
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: MAX_DIMENSION } }],
      { compress: RECOMPRESS_QUALITY, format: SaveFormat.JPEG }
    );
    return result.uri;
  } catch {
    return uri;
  }
}

// ─── Filename helper ──────────────────────────────────────────────────────────

function buildFileName(uri: string, prefix: string, mime: string): string {
  const segment = uri.split('/').pop()?.split('?')[0] ?? '';
  // Use segment if it has a real extension (not just a numeric content:// ID)
  if (segment && segment.includes('.') && !segment.match(/^\d+$/)) {
    return segment;
  }
  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heic',
  };
  const ext = extMap[mime] ?? 'jpg';
  return `${prefix}-${Date.now()}.${ext}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface PreparedImageFile {
  uri: string;
  name: string;
  type: string;
}

/**
 * Prepares a local image URI for upload via FormData.
 *
 * Steps:
 * 1. Normalise content:// → file:// (Android)
 * 2. Re-compress if file exceeds 5 MB
 * 3. Detect MIME type from magic bytes (not just extension)
 * 4. Build a proper filename with the correct extension
 *
 * @param localUri  The URI returned by expo-image-picker
 * @param filePrefix  Prefix for the generated filename (e.g. 'avatar', 'pet')
 */
export async function prepareImageForUpload(
  localUri: string,
  filePrefix: string = 'image'
): Promise<PreparedImageFile> {
  const safeUri = await normalizeUri(localUri);
  const finalUri = await ensureWithinSizeLimit(safeUri);
  const mime = await detectMimeType(finalUri);
  const name = buildFileName(finalUri, filePrefix, mime);
  return { uri: finalUri, name, type: mime };
}
