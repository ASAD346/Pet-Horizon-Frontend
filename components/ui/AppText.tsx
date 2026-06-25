import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface AppTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption';
  weight?: '400' | '500' | '600' | '700' | '800';
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export function AppText({
  variant = 'body',
  weight,
  color,
  align,
  style,
  children,
  ...props
}: AppTextProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const textColor = color || Colors[theme].text;

  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'h1': return { fontSize: 28, fontWeight: weight || '700', lineHeight: 34, letterSpacing: -0.5 };
      case 'h2': return { fontSize: 22, fontWeight: weight || '700', lineHeight: 28, letterSpacing: -0.3 };
      case 'h3': return { fontSize: 18, fontWeight: weight || '600', lineHeight: 24, letterSpacing: -0.2 };
      case 'bodySmall': return { fontSize: 13, lineHeight: 18 };
      case 'caption': return { fontSize: 11, lineHeight: 15, letterSpacing: 0.1 };
      case 'body':
      default: return { fontSize: 15, lineHeight: 22, letterSpacing: -0.1 };
    }
  };

  return (
    <Text
      style={[
        getVariantStyle(),
        { color: textColor, textAlign: align, fontWeight: weight },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
