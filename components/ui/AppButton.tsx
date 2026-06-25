import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  StyleProp,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { Palette, Radius, Spacing } from '../../constants/theme';
import { AppText } from './AppText';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: AppButtonProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.96);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return { 
          bg: Palette.primary.light, 
          text: Palette.primary.base,
          border: 'transparent' 
        };
      case 'success':
        return {
          bg: Palette.success,
          text: Palette.white,
          border: 'transparent',
        };
      case 'danger':
        return {
          bg: Palette.error,
          text: Palette.white,
          border: 'transparent',
        };
      case 'outline':
        return { 
          bg: 'transparent', 
          text: Palette.primary.base, 
          border: Palette.primary.base 
        };
      case 'ghost':
        return { 
          bg: 'transparent', 
          text: Palette.primary.base, 
          border: 'transparent' 
        };
      case 'primary':
      default:
        return { 
          bg: Palette.primary.base, 
          text: Palette.primary.contrast, 
          border: 'transparent' 
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm': 
        return { 
          height: 38,
          paddingHorizontal: Spacing.md, 
          fontSize: 14,
          weight: '600' as const
        };
      case 'lg': 
        return { 
          height: 56,
          paddingHorizontal: Spacing.xl, 
          fontSize: 17,
          weight: '700' as const
        };
      case 'md':
      default: 
        return { 
          height: 48,
          paddingHorizontal: Spacing.lg, 
          fontSize: 15,
          weight: '600' as const
        };
    }
  };

  const { bg, text, border } = getVariantStyles();
  const { height, paddingHorizontal, fontSize, weight } = getSizeStyles();

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.85}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          height,
          paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
        },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={text} />
      ) : (
        <View style={styles.content}>
          {icon}
          <AppText
            variant="body"
            weight={weight}
            color={text}
            style={[
              styles.text,
              { fontSize },
              textStyle
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </AppText>
        </View>
      )}
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md, // Consistent modern radius
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    textAlign: 'center',
  },
});
