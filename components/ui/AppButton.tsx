import React from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle 
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
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
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
    scale.value = withSpring(0.96);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
          bg: Palette.secondary.base, 
          text: Palette.secondary.contrast,
          border: 'transparent' 
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
      case 'sm': return { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 };
      case 'lg': return { paddingVertical: 18, paddingHorizontal: 32, fontSize: 18 };
      case 'md':
      default: return { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16 };
    }
  };

  const { bg, text, border } = getVariantStyles();
  const { paddingVertical, paddingHorizontal } = getSizeStyles();

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.8}
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
          paddingVertical,
          paddingHorizontal,
          opacity: disabled ? 0.6 : 1,
        },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={text} />
      ) : (
        <>
          {icon}
          <AppText
            variant="body"
            weight="600"
            color={text}
            style={[styles.text, textStyle]}
          >
            {title}
          </AppText>
        </>
      )}
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
});
