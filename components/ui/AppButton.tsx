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
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';

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
  accessibilityLabel?: string;
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
  accessibilityLabel,
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
          text: Palette.gray[700], 
          border: Palette.gray[300] 
        };
      case 'ghost':
        return { 
          bg: 'transparent', 
          text: Palette.gray[600], 
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
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      hitSlop={height < 44 ? { top: (44 - height) / 2, bottom: (44 - height) / 2, left: 8, right: 8 } : undefined}
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

// ---------------------------------------------------------------------------
// CustomButton — Tier-aware, unified design-system button
// Automatically switches between Free (solid #114227) and Premium (emerald-gold
// gradient) styles based on the active user's premiumStatus.
// Use this everywhere you previously used local inline button styling.
// ---------------------------------------------------------------------------

export interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'text';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

const PREMIUM_GRADIENT = ['#0E3821', '#1A5C35', '#C8940E'] as const;
const FREE_GREEN = '#114227';

export function CustomButton({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  accessibilityLabel,
}: CustomButtonProps) {
  const { user } = useAuth();
  const isPremium = user?.premiumStatus === 'premium';

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled || isLoading) return;
    scale.value = withSpring(0.96);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Resolve per-variant, per-tier token values
  const resolvedColors = (() => {
    if (variant === 'outline') {
      const accent = isPremium ? '#C8940E' : FREE_GREEN;
      return { bg: 'transparent', text: accent, border: accent };
    }
    if (variant === 'text') {
      return { bg: 'transparent', text: isPremium ? '#C8940E' : FREE_GREEN, border: 'transparent' };
    }
    // primary
    return { bg: isPremium ? 'transparent' : FREE_GREEN, text: '#FFFFFF', border: 'transparent' };
  })();

  const { bg, text, border } = resolvedColors;
  const isGradient = variant === 'primary' && isPremium;

  const innerContent = isLoading ? (
    <ActivityIndicator size="small" color={text} />
  ) : (
    <View style={customStyles.innerRow}>
      {icon}
      <AppText
        variant="body"
        weight="600"
        color={text}
        style={[customStyles.label, textStyle]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </AppText>
    </View>
  );

  if (isGradient) {
    return (
      <AnimatedTouchableOpacity
        activeOpacity={0.85}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled || isLoading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        style={[customStyles.base, { opacity: disabled ? 0.5 : 1 }, animatedStyle, style]}
      >
        <LinearGradient
          colors={PREMIUM_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={customStyles.gradient}
        >
          {innerContent}
        </LinearGradient>
      </AnimatedTouchableOpacity>
    );
  }

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.85}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled || isLoading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={[
        customStyles.base,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        animatedStyle,
        style,
      ]}
    >
      {innerContent}
    </AnimatedTouchableOpacity>
  );
}

const customStyles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    textAlign: 'center',
  },
});

