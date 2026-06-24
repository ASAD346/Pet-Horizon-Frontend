import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Spacing, Radius } from '@/constants/theme';
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
      <TouchableOpacity 
        style={styles.backButtonContainer} 
        onPress={onBack} 
        hitSlop={12} 
        activeOpacity={0.7}
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={22} color={ProfileTheme.green} />
      </TouchableOpacity>

      <AppText variant="h3" weight="800" color={ProfileTheme.text} style={styles.title} numberOfLines={1}>
        {title}
      </AppText>

      {rightLabel && onRightPress ? (
        <TouchableOpacity
          style={styles.rightButton}
          onPress={onRightPress}
          disabled={rightDisabled}
          activeOpacity={0.7}
          hitSlop={12}
        >
          <AppText
            variant="body"
            weight="800"
            color={rightDisabled ? HomeTheme.textMuted : ProfileTheme.green}
          >
            {rightLabel}
          </AppText>
        </TouchableOpacity>
      ) : (
        <View style={styles.sidePlaceholder} />
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
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F3E8',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#1B5E20',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  backButtonContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(46, 125, 50, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightButton: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sidePlaceholder: {
    width: 38,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 0.1,
  },
});

