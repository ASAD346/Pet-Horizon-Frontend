import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import type { InProgressLock } from '@/types/delegation';

interface DoubleCareBannerProps {
  locks: { taskTitle: string; lock: InProgressLock }[];
  onDismiss?: () => void;
}

export function DoubleCareBanner({ locks, onDismiss }: DoubleCareBannerProps) {
  if (!locks || locks.length === 0) return null;

  return (
    <View style={styles.container}>
      {locks.map(({ taskTitle, lock }, idx) => (
        <View key={idx} style={styles.bannerRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="hand-right" size={16} color="#E65100" />
            <View style={styles.pulseDot} />
          </View>
          <View style={styles.textContainer}>
            <AppText variant="bodySmall" weight="700" color="#E65100">
              {lock.lockedByName || 'A family member'} is doing this right now
            </AppText>
            <AppText variant="caption" color="#B78103">
              Currently handling “{taskTitle}”. Actions locked to prevent duplicate care.
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFE8A1',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E65100',
  },
  textContainer: {
    flex: 1,
  },
});
