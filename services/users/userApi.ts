import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type { ApiUser } from '@/types/auth';

const SCOPE = 'UserAPI';

export interface UpdateUserRequest {
  fullName?: string;
  settings?: ApiUser['settings'];
  preferredLanguage?: 'en' | 'de' | 'es' | 'fr' | 'it' | 'pt' | 'ru' | 'tr' | 'ar' | 'zh';
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeEmailResponse {
  message: string;
  emailConfigured?: boolean;
  emailSent?: boolean;
  devOtp?: string;
}

export async function fetchUserProfile(token: string, userId: string): Promise<ApiUser> {
  log.info(SCOPE, 'GET /users/:id', { userId });
  try {
    const data = await apiRequest<ApiUser>(API_ENDPOINTS.users.byId(userId), { token });
    log.ok(SCOPE, 'Profile loaded', { userId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Profile load failed', getErrorMessage(error));
    throw error;
  }
}

export async function updateUserProfile(
  token: string,
  userId: string,
  payload: UpdateUserRequest,
): Promise<ApiUser> {
  log.info(SCOPE, 'PUT /users/:id', { userId });
  try {
    const data = await apiRequest<ApiUser>(API_ENDPOINTS.users.byId(userId), {
      method: 'PUT',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Profile updated', { userId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Profile update failed', getErrorMessage(error));
    throw error;
  }
}

export async function changePassword(
  token: string,
  payload: ChangePasswordRequest,
): Promise<{ message: string }> {
  log.info(SCOPE, 'POST /users/change-password');
  try {
    const data = await apiRequest<{ message: string }>(API_ENDPOINTS.users.changePassword, {
      method: 'POST',
      token,
      body: {
        currentPassword: payload.currentPassword,
        newPassword: payload.newPassword,
      },
    });
    log.ok(SCOPE, 'Password changed');
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Change password failed', getErrorMessage(error));
    throw error;
  }
}

export async function requestEmailChange(token: string, newEmail: string): Promise<ChangeEmailResponse> {
  log.info(SCOPE, 'POST /users/change-email');
  try {
    const data = await apiRequest<ChangeEmailResponse>(API_ENDPOINTS.users.changeEmail, {
      method: 'POST',
      token,
      body: { newEmail: newEmail.trim() },
    });
    log.ok(SCOPE, 'Email change requested');
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Email change request failed', getErrorMessage(error));
    throw error;
  }
}

export async function verifyEmailChange(token: string, otp: string): Promise<{ message: string }> {
  log.info(SCOPE, 'POST /users/verify-email-change');
  try {
    const data = await apiRequest<{ message: string }>(API_ENDPOINTS.users.verifyEmailChange, {
      method: 'POST',
      token,
      body: { otp: otp.trim() },
    });
    log.ok(SCOPE, 'Email change verified');
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Email verify failed', getErrorMessage(error));
    throw error;
  }
}

export async function registerDeviceToken(
  token: string,
  fcmToken: string,
  platform: 'android' | 'ios',
): Promise<{ message: string }> {
  log.info(SCOPE, 'POST /users/device-token', { platform });
  try {
    const data = await apiRequest<{ message: string }>(API_ENDPOINTS.users.deviceToken, {
      method: 'POST',
      token,
      body: { fcmToken, platform },
    });
    log.ok(SCOPE, 'Device token saved');
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Device token registration failed', getErrorMessage(error));
    throw error;
  }
}

export async function deleteAccount(
  token: string,
  userId: string,
): Promise<{ message: string }> {
  log.info(SCOPE, 'DELETE /users/:id', { userId });
  try {
    const data = await apiRequest<{ message: string }>(API_ENDPOINTS.users.byId(userId), {
      method: 'DELETE',
      token,
    });
    log.ok(SCOPE, 'Account deleted successfully', { userId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Account deletion failed', getErrorMessage(error));
    throw error;
  }
}

export async function updateTimezone(token: string, timezone: string): Promise<ApiUser> {
  log.info(SCOPE, 'POST /user/update-timezone', { timezone });
  try {
    const data = await apiRequest<ApiUser>(API_ENDPOINTS.users.updateTimezone, {
      method: 'POST',
      token,
      body: { timezone },
    });
    log.ok(SCOPE, 'Timezone synchronized', { timezone });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Timezone sync failed', getErrorMessage(error));
    throw error;
  }
}

export async function patchUserProfile(
  token: string,
  payload: UpdateUserRequest,
): Promise<ApiUser> {
  log.info(SCOPE, 'PATCH /user/profile');
  try {
    const data = await apiRequest<ApiUser>(API_ENDPOINTS.users.patchProfile, {
      method: 'PATCH',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Profile patched');
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Profile patch failed', getErrorMessage(error));
    throw error;
  }
}
