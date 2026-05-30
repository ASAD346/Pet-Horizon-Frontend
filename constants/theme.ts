import { Platform } from 'react-native';

export const Palette = {
  primary: {
    base: '#1A2B4E', // Deep Navy from Logo
    light: '#E6EBF5',
    contrast: '#FFFFFF',
  },
  secondary: {
    base: '#F48024', // Warm Orange from Paw Icon
    light: '#FFF4EB',
    contrast: '#FFFFFF',
  },
  success: '#5BB060', // The Green from your new image
  error: '#FF5252',
  white: '#FFFFFF',
  black: '#121212',
  gray: {
    50: '#FDFDFD',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
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

/** Platform font stacks used by template screens (e.g. explore) */
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
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 30,
  full: 999,
};

/** Login screen design tokens (matches Pet Horizon mockup) */
export const LoginTheme = {
  green: '#5CB35D',
  greenDark: '#4A9E4B',
  charcoal: '#3A3A3A',
  inputBg: '#DCDCDC',
  inputPlaceholder: '#6B6B6B',
  tagline: '#9E9E9E',
  petLabel: '#B0B0B0',
  brandPet: '#7BA3C4',
  brandHorizon: '#1A2B4E',
  screenBg: '#F5F6F8',
  dividerLine: '#5CB35D',
  buttonShadow: '#3D7A3E',
  footerText: '#FFFFFF',
} as const;

/** Home dashboard design tokens */
export const HomeTheme = {
  background: '#F5F6F8',
  cardGreen: '#5CB35D',
  cardGreenDark: '#4A9E4B',
  warningBg: '#FEF9D7',
  warningAccent: '#F0C419',
  infoBg: '#E8F4FD',
  infoAccent: '#5B9BD5',
  teal: '#4DB6AC',
  surface: '#FFFFFF',
  surfaceMuted: '#EBEBEB',
  text: '#1A1A1A',
  textMuted: '#757575',
  green: '#5CB35D',
  white: '#FFFFFF',
  badgeRed: '#E53935',
  dividerOnGreen: 'rgba(255,255,255,0.35)',
  tagOnGreen: 'rgba(255,255,255,0.25)',
} as const;

/** Pet Journal screen design tokens */
export const JournalTheme = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  navy: '#1A2B4E',
  text: '#1A1A1A',
  textMuted: '#757575',
  textLight: '#9E9E9E',
  border: '#E8E8E8',
  chipBg: '#F0F0F0',
  timelineLine: '#E0E0E0',
  food: '#E57373',
  foodBg: '#FFEBEE',
  walk: '#F5A623',
  walkBg: '#FFF8E1',
  medicine: '#5B9BD5',
  medicineBg: '#E3F2FD',
  grooming: '#E91E8C',
  groomingBg: '#FCE4F0',
  completed: '#5CB35D',
  photoPlaceholder: '#EEEEEE',
} as const;
