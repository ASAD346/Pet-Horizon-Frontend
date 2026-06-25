import { Platform } from 'react-native';

export const Palette = {
  primary: {
    base: '#1A2B4E', // Deep Navy from Logo
    light: '#F0F3FA',
    contrast: '#FFFFFF',
  },
  secondary: {
    base: '#E67E22', // Warm Organic Amber/Orange
    light: '#FFF5EB',
    contrast: '#FFFFFF',
  },
  success: '#2E7D32', // Premium Deep Brand Green
  successLight: '#E8F5E9',
  error: '#D32F2F', // Clean error red
  errorLight: '#FFEBEE',
  warning: '#F57C00',
  warningLight: '#FFF3E0',
  info: '#1976D2',
  infoLight: '#E3F2FD',
  white: '#FFFFFF',
  black: '#121212',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  // Premium Gold Accents
  premium: {
    gold: '#D4A017',
    goldLight: '#FFFDF0',
    emerald: '#184F2E',
    emeraldLight: '#E8F6EE',
  }
};

export const Colors = {
  light: {
    background: Palette.white,
    surface: Palette.gray[50],
    text: Palette.gray[900],
    textSecondary: Palette.gray[600],
    primary: Palette.primary.base,
    secondary: Palette.secondary.base,
    border: Palette.gray[200],
    tint: Palette.primary.base,
    icon: Palette.gray[600],
    tabIconDefault: Palette.gray[400],
    tabIconSelected: Palette.primary.base,
  },
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    text: Palette.white,
    textSecondary: Palette.gray[400],
    primary: Palette.primary.base,
    secondary: Palette.secondary.base,
    border: Palette.gray[800],
    tint: Palette.white,
    icon: Palette.gray[400],
    tabIconDefault: Palette.gray[600],
    tabIconSelected: Palette.white,
  },
};

/** Platform font stacks used by template screens */
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 999,
};

/** Login screen design tokens (matches Pet Horizon mockup) */
export const LoginTheme = {
  green: '#2E7D32',
  greenDark: '#1B5E20',
  charcoal: '#212121',
  inputBg: '#F5F5F5',
  inputPlaceholder: '#757575',
  tagline: '#757575',
  petLabel: '#9E9E9E',
  brandPet: '#7BA3C4',
  brandHorizon: '#1A2B4E',
  screenBg: '#FAFAFA',
  dividerLine: '#E0E0E0',
  buttonShadow: '#1B5E20',
  footerText: '#616161',
} as const;

/** Home dashboard design tokens */
export const HomeTheme = {
  background: '#F5F6F8',
  cardGreen: '#2E7D32',
  cardGreenDark: '#1B5E20',
  warningBg: '#FFFDE7',
  warningAccent: '#F57C00',
  infoBg: '#E3F2FD',
  infoAccent: '#1976D2',
  teal: '#00695C',
  surface: '#FFFFFF',
  surfaceMuted: '#F5F5F5',
  text: '#212121',
  textMuted: '#616161',
  green: '#2E7D32',
  white: '#FFFFFF',
  badgeRed: '#D32F2F',
  dividerOnGreen: 'rgba(255,255,255,0.2)',
  tagOnGreen: 'rgba(255,255,255,0.15)',
} as const;

/** Pet Journal screen design tokens */
export const JournalTheme = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  navy: '#1A2B4E',
  text: '#212121',
  textMuted: '#616161',
  textLight: '#9E9E9E',
  border: '#EEEEEE',
  chipBg: '#F5F5F5',
  timelineLine: '#E0E0E0',
  food: '#E53935',
  foodBg: '#FFEBEE',
  walk: '#F57C00',
  walkBg: '#FFF3E0',
  medicine: '#1E88E5',
  medicineBg: '#E3F2FD',
  grooming: '#D81B60',
  groomingBg: '#FCE4F0',
  completed: '#2E7D32',
  photoPlaceholder: '#EEEEEE',
} as const;
