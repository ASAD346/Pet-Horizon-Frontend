import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProfileScreenHeaderProps {
  title: string;
  onBack: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
  rightDisabled?: boolean;
}

const GREEN = '#2E7D32';
const GREEN_MUTED = 'rgba(46,125,50,0.12)';

export function ProfileScreenHeader({
  title,
  onBack,
  rightLabel,
  onRightPress,
  rightDisabled,
}: ProfileScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={16} color="#0E3821" />
      </Pressable>

      <AppText variant="h3" weight="800" color="#0E3821" style={styles.title} numberOfLines={1}>
        {title}
      </AppText>

      {rightLabel ? (
        <Pressable
          onPress={onRightPress}
          disabled={rightDisabled}
          style={[styles.rightBtn, rightDisabled && styles.rightBtnDisabled]}
        >
          <AppText
            variant="bodySmall"
            weight="800"
            color={rightDisabled ? '#94A3B8' : GREEN}
          >
            {rightLabel}
          </AppText>
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: ProfileTheme.background,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2EBE2',
    ...Platform.select({
      ios: { shadowColor: '#0E3821', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    marginHorizontal: Spacing.sm,
  },
  placeholder: {
    width: 40,
  },
  rightBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: GREEN_MUTED,
  },
  rightBtnDisabled: {
    backgroundColor: '#F1F5F9',
  },
});
