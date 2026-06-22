import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';

interface HeaderActionButtonsProps {
  notificationCount?: number;
  onJournalPress?: () => void;
  onNotificationsPress?: () => void;
  showJournal?: boolean;
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

export function HeaderActionButtons({
  notificationCount = 0,
  onJournalPress,
  onNotificationsPress,
  showJournal = true,
}: HeaderActionButtonsProps) {
  const badgeLabel = notificationCount > 99 ? '99+' : String(notificationCount);

  return (
    <View style={styles.actions}>
      {showJournal && onJournalPress ? (
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.8}
          onPress={onJournalPress}
          accessibilityLabel="Open pet journal"
        >
          <MaterialCommunityIcons name="notebook-outline" size={22} color={HomeTheme.text} />
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        style={styles.iconBtn}
        activeOpacity={0.8}
        onPress={onNotificationsPress}
        accessibilityLabel="Open notifications"
        disabled={!onNotificationsPress}
      >
        <Ionicons name="notifications-outline" size={20} color={HomeTheme.text} />
        {notificationCount > 0 ? (
          <View style={styles.badge}>
            <AppText variant="caption" weight="700" color={HomeTheme.white} style={styles.badgeText}>
              {badgeLabel}
            </AppText>
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
