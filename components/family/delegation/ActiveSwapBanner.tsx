import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { DelegationTask } from '@/types/delegation';

interface ActiveSwapBannerProps {
  pendingSwaps: DelegationTask[];
  onAcceptSwap: (task: DelegationTask) => void;
}

export function ActiveSwapBanner({ pendingSwaps, onAcceptSwap }: ActiveSwapBannerProps) {
  if (!pendingSwaps || pendingSwaps.length === 0) return null;

  return (
    <View style={styles.container}>
      {pendingSwaps.map((task) => (
        <View key={task._id} style={styles.card}>
          <View style={styles.leftBar} />
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <View style={styles.pillBadge}>
                <Ionicons name="swap-horizontal" size={13} color="#D84315" />
                <AppText variant="caption" weight="800" color="#D84315" style={{ fontSize: 11 }}>
                  SWAP NEEDED
                </AppText>
              </View>
              <AppText variant="caption" color={Palette.gray[600]}>
                {task.timingMode === 'window'
                  ? `${task.window?.startTime} – ${task.window?.endTime}`
                  : task.exactTime}
              </AppText>
            </View>

            <AppText variant="bodySmall" weight="700" color={Palette.gray[900]} style={styles.title}>
              {task.activeSwap?.requestedByName || 'Family Member'} requested cover for{' '}
              <AppText variant="bodySmall" weight="800" color="#184F2E">
                {task.title || task.category}
              </AppText>
            </AppText>

            {task.activeSwap?.note ? (
              <AppText variant="caption" color={Palette.gray[600]} style={styles.note}>
                “{task.activeSwap.note}”
              </AppText>
            ) : null}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.coverButton}
                activeOpacity={0.8}
                onPress={() => onAcceptSwap(task)}
              >
                <Ionicons name="hand-right" size={13} color="#FFFFFF" />
                <AppText variant="caption" weight="800" color="#FFFFFF">
                  I Can Cover
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: '#FFF8F0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    flexDirection: 'row',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#E67E22',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: { elevation: 2 },
    }),
  },
  leftBar: {
    width: 4,
    backgroundColor: '#E67E22',
  },
  content: {
    flex: 1,
    padding: Spacing.md - 2,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFE0B2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  title: {
    lineHeight: 18,
  },
  note: {
    fontStyle: 'italic',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  coverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E67E22',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
});
