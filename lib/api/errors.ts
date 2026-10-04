export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

export function apiErrorHandler(error: unknown): string {
  if (!error) return 'Something went wrong. Please try again.';

  let msg = '';
  let status = 0;

  if (error instanceof ApiError) {
    status = error.status;
    msg = error.message || '';
  } else if (error instanceof Error) {
    msg = error.message || '';
  } else if (typeof error === 'string') {
    msg = error;
  } else if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, any>;
    msg = obj.message || obj.error || JSON.stringify(error);
    if (typeof obj.status === 'number') status = obj.status;
  } else {
    msg = String(error);
  }

  const lower = msg.toLowerCase();

  // 1. Check for network / connection / timeout issues
  if (
    status === 0 ||
    lower.includes('network request failed') ||
    lower.includes('network error') ||
    lower.includes('failed to fetch') ||
    lower.includes('connection lost') ||
    lower.includes('unable to reach') ||
    lower.includes('unable to connect') ||
    lower.includes('econnrefused') ||
    lower.includes('econnreset') ||
    lower.includes('enotfound') ||
    lower.includes('etimedout') ||
    lower.includes('timeout') ||
    lower.includes('aborterror') ||
    msg.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/) ||
    lower.includes('localhost') ||
    lower.includes('http://') ||
    lower.includes('https://')
  ) {
    return 'Connection lost. Please check your internet connection and try again.';
  }

  // 2. Check for auth / session expiration
  if (
    status === 401 ||
    lower.includes('jwt expired') ||
    lower.includes('jwt malformed') ||
    lower.includes('invalid token') ||
    lower.includes('token expired') ||
    lower.includes('session expired') ||
    lower.includes('unauthorized') ||
    lower.includes('not authenticated')
  ) {
    return 'Your session has expired. Please log in again.';
  }

  // 3. Check for permission / forbidden
  if (status === 403 || lower.includes('forbidden') || lower.includes('permission denied')) {
    return 'You do not have permission to perform this action.';
  }

  // 4. Check for not found
  if (status === 404 || lower.includes('not found') || lower.includes('does not exist')) {
    return 'The requested item could not be found.';
  }

  // 5. Check for server-side / database / runtime technical errors
  if (
    status >= 500 ||
    lower.includes('internal server error') ||
    lower.includes('mongoservererror') ||
    lower.includes('mongoerror') ||
    lower.includes('casterror') ||
    lower.includes('e11000') ||
    lower.includes('typeerror') ||
    lower.includes('syntaxerror') ||
    lower.includes('referenceerror') ||
    lower.includes('stack trace') ||
    lower.includes('at async') ||
    lower.includes('status code')
  ) {
    return 'Our services are temporarily busy. Please try again in a few moments.';
  }

  // 6. Clean up raw technical error prefixes
  let cleaned = msg
    .replace(/^Error:\s*/i, '')
    .replace(/^ApiError:\s*/i, '')
    .replace(/^Request failed:\s*/i, '')
    .trim();

  if (!cleaned || cleaned.length < 3) {
    return 'Something went wrong. Please try again.';
  }

  return cleaned;
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const handled = apiErrorHandler(error);
  if (handled && handled !== 'Something went wrong. Please try again.' && handled !== 'An unknown error occurred.') {
    return handled;
  }
  return fallback;
}
