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
import { Palette, Radius, Spacing } from '@/constants/theme';
import { AppText } from './AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';

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
// Automatically switches between Free (solid #5CB35D) and Premium (deep
// emerald gradient #0A2419 → #1A5C35) based on the user's premiumStatus.
// Zero gold, zero mustard. Only GREEN. Always.
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

// ── Tier color constants ────────────────────────────────────────────────────
/** Free tier: solid brand green */
const FREE_GREEN = '#5CB35D';
/** Premium tier: deep emerald gradient (dark forest → rich emerald) */
const PREMIUM_GRADIENT: readonly [string, string, string] = ['#0A2419', '#114227', '#1A5C35'];
/** Shared accent for outline/text variants */
const ACCENT_GREEN = '#114227';

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

  // For outline/text: accent shifts to deep emerald when premium
  const accentColor = isPremium ? ACCENT_GREEN : FREE_GREEN;

  if (variant === 'outline') {
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
            backgroundColor: 'transparent',
            borderColor: accentColor,
            borderWidth: 1.5,
            opacity: disabled ? 0.5 : 1,
          },
          animatedStyle,
          style,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={accentColor} />
        ) : (
          <View style={customStyles.innerRow}>
            {icon}
            <AppText
              variant="body"
              weight="800"
              color={accentColor}
              style={[customStyles.label, textStyle]}
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

  if (variant === 'text') {
    return (
      <AnimatedTouchableOpacity
        activeOpacity={0.75}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled || isLoading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        style={[customStyles.base, { backgroundColor: 'transparent', opacity: disabled ? 0.5 : 1 }, animatedStyle, style]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={accentColor} />
        ) : (
          <View style={customStyles.innerRow}>
            {icon}
            <AppText
              variant="body"
              weight="800"
              color={accentColor}
              style={[customStyles.label, textStyle]}
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

  // ── variant === 'primary' ─────────────────────────────────────────────────
  const innerContent = isLoading ? (
    <ActivityIndicator size="small" color="#FFFFFF" />
  ) : (
    <View style={customStyles.innerRow}>
      {icon}
      <AppText
        variant="body"
        weight="800"
        color="#FFFFFF"
        style={[customStyles.label, textStyle]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </AppText>
    </View>
  );

  if (isPremium) {
    // Premium: deep emerald gradient
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

  // Free: solid standard green
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
          backgroundColor: FREE_GREEN,
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
    borderRadius: 14,
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

