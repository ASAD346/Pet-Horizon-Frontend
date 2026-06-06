import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';

interface ExpenseTrackerHeaderProps {
  notificationCount?: number;
  onJournalPress?: () => void;
  onNotificationsPress?: () => void;
}

export function ExpenseTrackerHeader({
  notificationCount = 0,
  onJournalPress,
  onNotificationsPress,
}: ExpenseTrackerHeaderProps) {
  return (
    <View style={styles.container}>
      <AppText variant="h3" weight="800" color={HomeTheme.text} style={styles.title}>
        Expense Tracker
      </AppText>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.8}
          onPress={onJournalPress}
          accessibilityLabel="Open pet journal"
        >
          <MaterialCommunityIcons name="notebook-outline" size={22} color={HomeTheme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.8}
          onPress={onNotificationsPress}
        >
          <Ionicons name="notifications-outline" size={20} color={HomeTheme.text} />
          {notificationCount > 0 ? (
            <View style={styles.badge}>
              <AppText variant="caption" weight="700" color={HomeTheme.white} style={styles.badgeText}>
                {notificationCount}
              </AppText>
            </View>
          ) : null}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: {
    flex: 1,
    fontSize: 24,
    lineHeight: 30,
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
