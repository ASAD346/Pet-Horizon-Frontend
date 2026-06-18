import React from 'react';
import { View, StyleSheet, Platform, type ViewStyle, type StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { LoginTheme, Radius } from '@/constants/theme';

const FRAME_SIZE = 112;
const LOGO_SIZE = 76;

interface AuthLogoMarkProps {
  size?: 'default' | 'compact';
  style?: StyleProp<ViewStyle>;
}

export function AuthLogoMark({ size = 'default', style }: AuthLogoMarkProps) {
  const compact = size === 'compact';
  const frame = compact ? 88 : FRAME_SIZE;
  const logo = compact ? 60 : LOGO_SIZE;

  return (
    <View
      style={[
        styles.frame,
        {
          width: frame,
          height: frame,
          borderRadius: frame / 2,
        },
        style,
      ]}
    >
      <Image
        source={require('../../assets/images/logo.png')}
        style={{ width: logo, height: logo }}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(92, 179, 93, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 5 },
    }),
  },
});
