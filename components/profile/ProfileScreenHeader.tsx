import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Spacing } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';

interface ProfileScreenHeaderProps {
  title: string;
  onBack: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
  rightDisabled?: boolean;
}

export function ProfileScreenHeader({
  title,
  onBack,
  rightLabel,
  onRightPress,
  rightDisabled,
}: ProfileScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.sideBtn} onPress={onBack} hitSlop={12} accessibilityLabel="Go back">
        <Ionicons name="arrow-back" size={24} color={ProfileTheme.text} />
      </TouchableOpacity>
      <AppText variant="h3" weight="800" color={ProfileTheme.text} style={styles.title}>
        {title}
      </AppText>
      {rightLabel && onRightPress ? (
        <TouchableOpacity
          style={styles.sideBtn}
          onPress={onRightPress}
          disabled={rightDisabled}
          hitSlop={12}
        >
          <AppText
            variant="body"
            weight="700"
            color={rightDisabled ? HomeTheme.textMuted : ProfileTheme.green}
          >
            {rightLabel}
          </AppText>
        </TouchableOpacity>
      ) : (
        <View style={styles.sideBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sideBtn: {
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
});
