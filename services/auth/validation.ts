export interface LoginFieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginForm(email: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return errors;
}

export function hasFieldErrors(errors: LoginFieldErrors): boolean {
  return Boolean(errors.email || errors.password);
}

export interface SignupFieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export interface VerifyEmailFieldErrors {
  email?: string;
  otp?: string;
}

export function validateSignupForm(
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string,
): SignupFieldErrors {
  const errors: SignupFieldErrors = {};
  const trimmedName = fullName.trim();
  const trimmedEmail = email.trim();

  if (!trimmedName) {
    errors.fullName = 'Full name is required';
  } else if (trimmedName.length < 2) {
    errors.fullName = 'Enter your full name';
  }

  if (!trimmedEmail) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

export function hasSignupFieldErrors(errors: SignupFieldErrors): boolean {
  return Boolean(errors.fullName || errors.email || errors.password || errors.confirmPassword);
}

export function validateEmailOnly(email: string): string | undefined {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return 'Email is required';
  }
  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return 'Enter a valid email address';
  }
  return undefined;
}

export function validateVerifyEmailForm(email: string, otp: string): VerifyEmailFieldErrors {
  const errors: VerifyEmailFieldErrors = {};
  const trimmedEmail = email.trim();
  const trimmedOtp = otp.trim();

  if (!trimmedEmail) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address';
  }

  if (!trimmedOtp) {
    errors.otp = 'Verification code is required';
  } else if (!/^\d{6}$/.test(trimmedOtp)) {
    errors.otp = 'Enter the 6-digit code from your email';
  }

  return errors;
}

export function hasVerifyEmailFieldErrors(errors: VerifyEmailFieldErrors): boolean {
  return Boolean(errors.email || errors.otp);
}

export interface ForgotPasswordFieldErrors {
  email?: string;
}

export interface ResetPasswordFieldErrors {
  email?: string;
  otp?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function validateForgotPasswordForm(email: string): ForgotPasswordFieldErrors {
  const errors: ForgotPasswordFieldErrors = {};
  const emailError = validateEmailOnly(email);
  if (emailError) {
    errors.email = emailError;
  }
  return errors;
}

export function hasForgotPasswordFieldErrors(errors: ForgotPasswordFieldErrors): boolean {
  return Boolean(errors.email);
}

export function validateResetPasswordForm(
  email: string,
  otp: string,
  newPassword: string,
  confirmPassword: string,
): ResetPasswordFieldErrors {
  const errors: ResetPasswordFieldErrors = {};
  const trimmedEmail = email.trim();
  const trimmedOtp = otp.trim();

  if (!trimmedEmail) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address';
  }

  if (!trimmedOtp) {
    errors.otp = 'Reset code is required';
  } else if (!/^\d{6}$/.test(trimmedOtp)) {
    errors.otp = 'Enter the 6-digit code from your email';
  }

  if (!newPassword) {
    errors.newPassword = 'New password is required';
  } else if (newPassword.length < 6) {
    errors.newPassword = 'Password must be at least 6 characters';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

export function hasResetPasswordFieldErrors(errors: ResetPasswordFieldErrors): boolean {
  return Boolean(errors.email || errors.otp || errors.newPassword || errors.confirmPassword);
}
