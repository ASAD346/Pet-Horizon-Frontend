import { Platform } from 'react-native';

/**
 * API configuration — single place for base URL and route paths.
 *
 * Base URL: set EXPO_PUBLIC_API_URL in `.env` (see `.env.example`).
 * Paths: must match Pet-Horizon-Backend `src/routes/index.js` (+ `/v1` prefix).
 */

function getDevApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL || 'http://16.171.154.65/v1';
}

/** Root API URL including `/v1` — no trailing slash */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://16.171.154.65/v1';

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
    google: '/auth/google',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  users: {
    byId: (userId: string) => `/users/${userId}`,
    avatar: '/users/avatar',
    changePassword: '/users/change-password',
    changeEmail: '/users/change-email',
    verifyEmailChange: '/users/verify-email-change',
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
    unified: '/dashboard',
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
    vaccination: '/schedules/vaccination',
    vaccinationById: (id: string) => `/schedules/vaccination/${id}`,
    vaccinationComplete: (id: string) => `/schedules/vaccination/${id}/complete`,
    vaccinationHistory: '/schedules/vaccination/history',
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
    byId: (id: string) => `/notifications/${id}`,
  },
  invitations: {
    generate: '/invitations/generate',
    accept: '/invitations/accept',
    info: (token: string) => `/invitations/info/${token}`,
  },
  family: {
    membersByPet: (petId: string) => `/pets/${petId}/members`,
    removeMemberByPet: (petId: string, userId: string) => `/pets/${petId}/members/${userId}`,
    updateMemberPermissionsByPet: (petId: string, userId: string) =>
      `/pets/${petId}/members/${userId}/permissions`,
  },
  premium: {
    plans: '/premium/plans',
    subscribe: '/premium/subscribe',
    status: '/premium/status',
    cancel: '/premium/cancel',
  },
  payment: {
    invoices: '/payment/invoices',
    createPaymentIntent: '/payment/create-payment-intent',
    updatePaymentMethod: '/payment/update-payment-method',
  },
  journal: {
    list: '/journal',
    create: '/journal',
    byId: (id: string) => `/journal/${id}`,
    image: (id: string) => `/journal/${id}/image`,
  },
  expenses: {
    list: '/expenses',
    summary: '/expenses/summary',
    create: '/expenses',
    byId: (id: string) => `/expenses/${id}`,
  },
  budget: {
    list: '/budget',
    remaining: '/budget/remaining',
    create: '/budget',
    byId: (id: string) => `/budget/${id}`,
  },
  feedback: {
    submit: '/feedback',
  },
} as const;
