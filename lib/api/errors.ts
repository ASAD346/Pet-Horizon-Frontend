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

  if (error instanceof ApiError) {
    if (error.isNetworkError || error.status === 0) {
      return "Connection lost. Please check your internet.";
    }
    if (error.isUnauthorized || error.status === 401) {
      return "Incorrect password or email. Please try again.";
    }
    if (error.isForbidden || error.status === 403) {
      return "You do not have permission to perform this action.";
    }
    if (error.status >= 500) {
      return "Our servers are busy. Please try again in a few moments.";
    }
    
    const msg = error.message || '';
    if (msg.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/) || msg.includes('server not running') || msg.includes('ECONNREFUSED') || msg.includes('Network Error')) {
      return "Connection lost. Please check your internet.";
    }
    return msg;
  }

  if (error instanceof Error) {
    const msg = error.message || '';
    if (msg.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/) || msg.includes('server not running') || msg.includes('ECONNREFUSED') || msg.includes('Network Error') || msg.toLowerCase().includes('network')) {
      return "Connection lost. Please check your internet.";
    }
    return msg;
  }

  const strErr = String(error);
  if (strErr.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/) || strErr.includes('server not running') || strErr.includes('ECONNREFUSED') || strErr.toLowerCase().includes('network')) {
    return "Connection lost. Please check your internet.";
  }

  return strErr;
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const handled = apiErrorHandler(error);
  if (handled && handled !== 'Something went wrong. Please try again.' && handled !== 'An unknown error occurred.') {
    return handled;
  }
  return fallback;
}
