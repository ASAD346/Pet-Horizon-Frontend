import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';

interface HomeHeaderProps {
  userName?: string;
  dateLabel?: string;
  notificationCount?: number;
}

export function HomeHeader({
  userName = 'Sarah',
  dateLabel = 'Monday, May 15th',
  notificationCount = 3,
}: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <AppText variant="h3" weight="800" color={HomeTheme.text} style={styles.greeting}>
          Good morning, {userName}!
        </AppText>
        <AppText variant="bodySmall" color={HomeTheme.textMuted}>
          {dateLabel}
        </AppText>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
          <Ionicons name="search" size={20} color={HomeTheme.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
          <Ionicons name="notifications-outline" size={20} color={HomeTheme.text} />
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <AppText variant="caption" weight="700" color={HomeTheme.white} style={styles.badgeText}>
                {notificationCount}
              </AppText>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const iconShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  android: { elevation: 3 },
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  textBlock: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  greeting: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: HomeTheme.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    ...iconShadow,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: HomeTheme.badgeRed,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
  },
});
