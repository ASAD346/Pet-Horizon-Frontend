import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from '@/types/auth';

const SCOPE = 'AuthAPI';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function loginWithEmailPassword(payload: LoginRequest): Promise<LoginResponse> {
  const email = normalizeEmail(payload.email);
  log.info(SCOPE, 'POST /auth/login', { email });
  try {
    const data = await apiRequest<LoginResponse>(API_ENDPOINTS.auth.login, {
      method: 'POST',
      body: { email, password: payload.password },
    });
    log.ok(SCOPE, 'Login success', { userId: data.user._id, email: data.user.email });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Login failed', { email, error: getErrorMessage(error) });
    throw error;
  }
}

export async function registerAccount(payload: RegisterRequest): Promise<RegisterResponse> {
  const email = normalizeEmail(payload.email);
  log.info(SCOPE, 'POST /auth/register', { email });
  try {
    const data = await apiRequest<RegisterResponse>(API_ENDPOINTS.auth.register, {
      method: 'POST',
      body: {
        fullName: payload.fullName.trim(),
        email,
        password: payload.password,
      },
    });
    log.ok(SCOPE, 'Register success', { userId: data.userId, emailVerificationRequired: data.emailVerificationRequired });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Register failed', { email, error: getErrorMessage(error) });
    throw error;
  }
}

export async function verifyEmail(payload: VerifyEmailRequest): Promise<VerifyEmailResponse> {
  const email = normalizeEmail(payload.email);
  log.info(SCOPE, 'POST /auth/verify-email', { email });
  try {
    const data = await apiRequest<VerifyEmailResponse>(API_ENDPOINTS.auth.verifyEmail, {
      method: 'POST',
      body: { email, otp: payload.otp.trim() },
    });
    log.ok(SCOPE, 'Verify email success', { email });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Verify email failed', { email, error: getErrorMessage(error) });
    throw error;
  }
}

export async function resendVerificationEmail(email: string): Promise<ResendVerificationResponse> {
  const normalized = normalizeEmail(email);
  log.info(SCOPE, 'POST /auth/resend-verification', { email: normalized });
  try {
    const data = await apiRequest<ResendVerificationResponse>(API_ENDPOINTS.auth.resendVerification, {
      method: 'POST',
      body: { email: normalized },
    });
    log.ok(SCOPE, 'Resend verification sent', { email: normalized });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Resend verification failed', { email: normalized, error: getErrorMessage(error) });
    throw error;
  }
}
