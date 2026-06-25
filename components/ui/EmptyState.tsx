import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { Radius, Spacing, HomeTheme } from '../../constants/theme';

interface EmptyStateProps {
  icon: string;
  iconType?: 'ionicons' | 'mci';
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon,
  iconType = 'ionicons',
  title,
  description,
  actionLabel,
  onActionPress,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Decorative Outer Ring */}
      <View style={styles.iconWrapper}>
        <View style={styles.iconCircle}>
          {iconType === 'mci' ? (
            <MaterialCommunityIcons name={icon as any} size={36} color={HomeTheme.cardGreen} />
          ) : (
            <Ionicons name={icon as any} size={36} color={HomeTheme.cardGreen} />
          )}
        </View>
      </View>

      <AppText variant="body" weight="800" color={HomeTheme.text} style={styles.title}>
        {title}
      </AppText>
      
      <AppText variant="bodySmall" color={HomeTheme.textMuted} style={styles.description}>
        {description}
      </AppText>

      {actionLabel && onActionPress && (
        <AppButton
          title={actionLabel}
          onPress={onActionPress}
          variant="outline"
          size="sm"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl + 8,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.12)',
    shadowColor: '#1A2B4E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(46, 125, 50, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: '85%',
    marginBottom: Spacing.lg,
  },
  button: {
    borderColor: HomeTheme.cardGreen,
    paddingHorizontal: Spacing.lg,
  },
});
