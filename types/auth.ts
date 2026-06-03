export interface UserSettings {
  notificationsEnabled?: boolean;
  darkMode?: boolean;
  language?: string;
}

export interface ApiUser {
  _id: string;
  fullName?: string;
  email: string;
  profileImage?: string | null;
  activePetId?: string | null;
  emailVerified?: boolean;
  premiumStatus?: 'free' | 'premium';
  settings?: UserSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: ApiUser;
}

export interface AuthSession {
  token: string;
  user: ApiUser;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  userId: string;
  emailVerificationRequired: boolean;
  message: string;
  emailSent?: boolean;
  devOtp?: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface ResendVerificationResponse {
  message: string;
  expiresInMinutes?: number;
  devOtp?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  emailConfigured?: boolean;
  emailProvider?: string;
  emailSent?: boolean;
  emailError?: string;
  expiresInMinutes?: number;
  devOtp?: string;
  hint?: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}
