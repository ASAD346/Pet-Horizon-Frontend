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
      case 'h1': return { fontSize: 32, fontWeight: weight || '700', lineHeight: 40 };
      case 'h2': return { fontSize: 24, fontWeight: weight || '700', lineHeight: 32 };
      case 'h3': return { fontSize: 20, fontWeight: weight || '600', lineHeight: 28 };
      case 'bodySmall': return { fontSize: 14, lineHeight: 20 };
      case 'caption': return { fontSize: 12, lineHeight: 16 };
      case 'body':
      default: return { fontSize: 16, lineHeight: 24 };
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
