import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';

interface FamilyHubHeaderProps {
  notificationCount?: number;
}

export function FamilyHubHeader({ notificationCount = 0 }: FamilyHubHeaderProps) {
  return (
    <View style={styles.container}>
      <AppText variant="h3" weight="800" color={HomeTheme.text}>
        Family Hub
      </AppText>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} accessibilityLabel="Search">
          <Ionicons name="search-outline" size={20} color={HomeTheme.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} accessibilityLabel="Notifications">
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
  android: { elevation: 2 },
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: HomeTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...iconShadow,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
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
