import { Platform } from 'react-native';

/**
 * API configuration — single place for base URL and route paths.
 *
 * Base URL: set EXPO_PUBLIC_API_URL in `.env` (see `.env.example`).
 * Paths: must match Pet-Horizon-Backend `src/routes/index.js` (+ `/v1` prefix).
 */

function getDevApiBaseUrl(): string {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/v1';
  }
  return 'http://localhost:3000/v1';
}

/** Root API URL including `/v1` — no trailing slash */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ??
  (__DEV__ ? getDevApiBaseUrl() : 'https://your-api.example.com/v1');

/**
 * Relative paths (appended to API_BASE_URL).
 * Group by feature as the app grows.
 */
export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    verifyEmail: '/auth/verify-email',
    resendVerification: '/auth/resend-verification',
    login: '/auth/login',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  users: {
    byId: (userId: string) => `/users/${userId}`,
    avatar: '/users/avatar',
    changePassword: '/users/change-password',
    deviceToken: '/users/device-token',
  },
  pets: {
    list: '/pets',
    create: '/pets',
    byId: (petId: string) => `/pets/${petId}`,
    image: (petId: string) => `/pets/${petId}/image`,
    active: '/pets/active',
    setActive: (petId: string) => `/pets/active/${petId}`,
    species: '/species',
    breeds: '/breeds',
    permissionsMe: (petId: string) => `/pets/${petId}/permissions/me`,
  },
  dashboard: {
    status: '/dashboard/status',
    upcomingTasks: '/dashboard/upcoming-tasks',
  },
  schedules: {
    today: '/schedules/today',
    list: '/schedules',
    feeding: '/schedules/feeding',
    feedingById: (id: string) => `/schedules/feeding/${id}`,
    feedingComplete: (id: string) => `/schedules/feeding/${id}/complete`,
    feedingSkip: (id: string) => `/schedules/feeding/${id}/skip`,
    walk: '/schedules/walk',
    walkById: (id: string) => `/schedules/walk/${id}`,
    walkComplete: (id: string) => `/schedules/walk/${id}/complete`,
    walkReschedule: (id: string) => `/schedules/walk/${id}/reschedule`,
    walkStats: '/schedules/walk/stats',
    medicine: '/schedules/medicine',
    medicineById: (id: string) => `/schedules/medicine/${id}`,
    medicineComplete: (id: string) => `/schedules/medicine/${id}/complete`,
    medicineRefill: (id: string) => `/schedules/medicine/${id}/refill`,
    medicineLowStock: '/schedules/medicine/low-stock',
    medicineHistory: (id: string) => `/schedules/medicine/${id}/history`,
  },
  grooming: {
    list: '/grooming',
    create: '/grooming',
    types: '/grooming/types',
    upcoming: '/grooming/upcoming',
    alerts: '/grooming/alerts',
    byId: (id: string) => `/grooming/${id}`,
    complete: (id: string) => `/grooming/${id}/complete`,
  },
  notifications: {
    list: '/notifications',
    markAllRead: '/notifications/mark-all-read',
    markRead: (id: string) => `/notifications/${id}/read`,
  },
} as const;
