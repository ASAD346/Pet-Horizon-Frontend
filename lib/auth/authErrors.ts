import { ApiError } from '@/lib/api/errors';

export function getAuthSignupErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return error.message;
    }
    if (error.status === 409) {
      return 'This email is already registered. Try logging in instead.';
    }
    return error.message;
  }
  return 'Unable to create your account. Please try again.';
}

export function getAuthVerifyEmailErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return error.message;
    }
    return error.message;
  }
  return 'Unable to verify your email. Please try again.';
}

export function getAuthGoogleErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError || error.code === 'TIMEOUT') {
      return 'Could not reach the server. Check your connection and try again.';
    }
    if (error.status === 503) {
      return 'Google sign-in is not configured on the server yet. Please try email login.';
    }
    if (error.status === 404) {
      return 'Google sign-in is not available on the server yet. Ask the developer to redeploy the backend with the latest code.';
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unable to sign in with Google. Please try again.';
}

export function getAuthLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError || error.code === 'TIMEOUT') {
      return 'Could not reach the server. Check your connection and try again.';
    }
    if (error.isUnauthorized) {
      return 'Incorrect email or password. Please try again.';
    }
    if (error.isForbidden) {
      return error.message;
    }
    return error.message;
  }
  return 'Unable to sign in. Please try again.';
}

export function getAuthForgotPasswordErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return error.message;
    }
    return error.message;
  }
  return 'Unable to send a reset code. Please try again.';
}

export function getAuthResetPasswordErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return error.message;
    }
    if (error.status === 400) {
      return error.message || 'Invalid or expired reset code. Request a new one.';
    }
    return error.message;
  }
  return 'Unable to reset your password. Please try again.';
}
