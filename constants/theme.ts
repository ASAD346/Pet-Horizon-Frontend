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
