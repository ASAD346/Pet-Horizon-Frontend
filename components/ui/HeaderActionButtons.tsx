import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { useDebouncedCallback } from '@/hooks/useDebounce';

interface HeaderActionButtonsProps {
  notificationCount?: number;
  onJournalPress?: () => void;
  onNotificationsPress?: () => void;
  onQrScanPress?: () => void;
  showJournal?: boolean;
  /** When true, renders icon buttons as dark-themed (white icons on navy) */
  dark?: boolean;
}

export function HeaderActionButtons({
  notificationCount = 0,
  onJournalPress,
  onNotificationsPress,
  onQrScanPress,
  showJournal = true,
  dark = false,
}: HeaderActionButtonsProps) {
  const badgeLabel = notificationCount > 99 ? '99+' : String(notificationCount);
  const btnStyle = dark ? styles.iconBtnDark : styles.iconBtnLight;
  const iconColor = dark ? '#FFFFFF' : HomeTheme.text;

  const [isLocked, setIsLocked] = useState(false);

  const handlePress = (cb?: () => void) => {
    if (!cb || isLocked) return;
    setIsLocked(true);
    try {
      cb();
    } finally {
      setTimeout(() => {
        setIsLocked(false);
      }, 1000);
    }
  };

  return (
    <View style={styles.actions} pointerEvents={isLocked ? 'none' : 'auto'}>
      {onQrScanPress ? (
        <TouchableOpacity
          style={[styles.iconBtn, btnStyle]}
          activeOpacity={0.75}
          onPress={() => handlePress(onQrScanPress)}
          disabled={isLocked}
          accessibilityLabel="Scan invite QR code"
        >
          <Ionicons name="qr-code-outline" size={18} color={iconColor} />
        </TouchableOpacity>
      ) : null}

      {showJournal && onJournalPress ? (
        <TouchableOpacity
          style={[styles.iconBtn, btnStyle]}
          activeOpacity={0.75}
          onPress={() => handlePress(onJournalPress)}
          disabled={isLocked}
          accessibilityLabel="Open pet journal"
        >
          <MaterialCommunityIcons name="notebook-outline" size={20} color={iconColor} />
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={[styles.iconBtn, btnStyle]}
        activeOpacity={0.75}
        onPress={() => handlePress(onNotificationsPress)}
        accessibilityLabel="Open notifications"
        disabled={!onNotificationsPress || isLocked}
      >
        <Ionicons name="notifications-outline" size={20} color={iconColor} />
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

const baseIconBtn = {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  iconBtn: {
    ...baseIconBtn,
  },
  // Light mode: white card with border
  iconBtnLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    ...Platform.select({
      ios: {
        shadowColor: '#2D7A2D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  // Dark mode: translucent white on navy
  iconBtnDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 8,
    lineHeight: 10,
  },
});
