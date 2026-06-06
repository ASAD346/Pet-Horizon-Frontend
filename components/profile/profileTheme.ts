import { HomeTheme, LoginTheme } from '@/constants/theme';

export const ProfileTheme = {
  background: HomeTheme.background,
  surface: HomeTheme.surface,
  text: HomeTheme.text,
  textMuted: HomeTheme.textMuted,
  purple: '#6B4EAA',
  purpleDark: '#563D8A',
  purpleLight: '#F3EEFC',
  green: HomeTheme.cardGreen,
  navy: LoginTheme.brandHorizon,
  border: '#E8E8E8',
  premiumGradientStart: '#7C5CBF',
  premiumGradientEnd: '#563D8A',
} as const;

export const TAB_BAR_CLEARANCE = 100;

export function formatPlanPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function planPeriodLabel(planId: string, periodDays: number): string {
  if (planId === 'yearly' || periodDays >= 365) return '/billed annually';
  if (planId === 'family_hub') return '/yr';
  return '/mo';
}

export function planFeatureLabel(planId: string): string {
  switch (planId) {
    case 'monthly':
      return 'Flexible monthly billing';
    case 'yearly':
      return 'Best value for solo pet parents';
    case 'family_hub':
      return 'Up to 6 accounts';
    default:
      return 'Premium features unlocked';
  }
}
