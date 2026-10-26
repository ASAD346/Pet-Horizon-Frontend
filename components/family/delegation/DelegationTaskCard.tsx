import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { JournalTheme, Palette, Radius, Spacing } from '@/constants/theme';
import type { DelegationTask, TaskCategory } from '@/types/delegation';

interface DelegationTaskCardProps {
  task: DelegationTask;
  currentUserId?: string;
  onAssignPress: (task: DelegationTask) => void;
  onWindowPress: (task: DelegationTask) => void;
  onSwapPress: (task: DelegationTask) => void;
  onCompletePress: (task: DelegationTask) => void;
  onTakeChorePress: (task: DelegationTask) => void;
}

const CATEGORY_COLORS: Record<TaskCategory, { bar: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  feeding: { bar: JournalTheme.food, bg: JournalTheme.foodBg, icon: 'restaurant-outline' },
  walk: { bar: JournalTheme.walk, bg: JournalTheme.walkBg, icon: 'paw-outline' },
  medicine: { bar: JournalTheme.medicine, bg: JournalTheme.medicineBg, icon: 'medkit-outline' },
  grooming: { bar: JournalTheme.grooming, bg: JournalTheme.groomingBg, icon: 'cut-outline' },
  vaccination: { bar: '#7B1FA2', bg: '#F3E5F5', icon: 'shield-checkmark-outline' },
};

export function DelegationTaskCard({
  task,
  currentUserId,
  onAssignPress,
  onWindowPress,
  onSwapPress,
  onCompletePress,
  onTakeChorePress,
}: DelegationTaskCardProps) {
  const categoryConfig = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.feeding;
  const isCompleted = Boolean(task.completion?.isCompleted);
  const isAssigned = Boolean(task.assignment?.userId);
  const isAssignedToMe = Boolean(currentUserId && task.assignment?.userId === currentUserId);
  const isLockedByOther = Boolean(task.isLockedByOther);

  const windowLabel = task.timingMode === 'window'
    ? `${task.window?.preset ? `${task.window.preset.charAt(0).toUpperCase() + task.window.preset.slice(1)} • ` : ''}${task.window?.startTime || '--:--'} – ${task.window?.endTime || '--:--'}`
    : task.exactTime || 'Scheduled';

  return (
    <View style={[styles.card, isCompleted && styles.cardCompleted]}>
      {/* 4px Left Category Status Bar */}
      <View style={[styles.leftBar, { backgroundColor: isCompleted ? Palette.success : categoryConfig.bar }]} />

      <View style={styles.cardContent}>
        {/* Top Meta Row: Time Window Badge & Category Icon */}
        <View style={styles.metaRow}>
          <TouchableOpacity
            style={[styles.windowBadge, isCompleted && styles.windowBadgeCompleted]}
            onPress={() => onWindowPress(task)}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={13} color={isCompleted ? Palette.gray[600] : '#B78103'} />
            <AppText
              variant="caption"
              weight="700"
              color={isCompleted ? Palette.gray[600] : '#795548'}
            >
              {windowLabel}
            </AppText>
            {!isCompleted ? (
              <Ionicons name="chevron-down" size={12} color="#B78103" />
            ) : null}
          </TouchableOpacity>

          <View style={[styles.categoryIconWrap, { backgroundColor: categoryConfig.bg }]}>
            <Ionicons name={categoryConfig.icon} size={15} color={categoryConfig.bar} />
          </View>
        </View>

        {/* Title */}
        <AppText
          variant="body"
          weight="800"
          color={isCompleted ? Palette.gray[500] : Palette.gray[900]}
          style={[styles.title, isCompleted && styles.titleCompleted]}
        >
          {task.title || task.category.charAt(0).toUpperCase() + task.category.slice(1)}
        </AppText>

        {/* Assignee Chip */}
        <View style={styles.assigneeRow}>
          <TouchableOpacity
            style={[styles.assigneeChip, isAssignedToMe && styles.assigneeChipMe]}
            onPress={() => onAssignPress(task)}
            activeOpacity={0.7}
            disabled={isCompleted}
          >
            {isAssigned ? (
              task.assignment.avatarUrl ? (
                <Image source={{ uri: task.assignment.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <AppText variant="caption" weight="800" color={Palette.primary.base}>
                    {task.assignment.name.charAt(0).toUpperCase()}
                  </AppText>
                </View>
              )
            ) : (
              <View style={styles.unassignedAvatar}>
                <Ionicons name="person-add-outline" size={12} color={Palette.secondary.base} />
              </View>
            )}

            <View style={styles.assigneeTextWrap}>
              <AppText variant="caption" weight="700" color={isAssignedToMe ? Palette.primary.base : Palette.gray[700]}>
                {isAssignedToMe ? 'Assigned to You' : task.assignment?.name || 'Open to Family'}
              </AppText>
            </View>

            {!isCompleted ? (
              <Ionicons name="swap-vertical" size={12} color={Palette.gray[400]} />
            ) : null}
          </TouchableOpacity>

          {/* Active Swap Indicator */}
          {task.activeSwap?.isRequested ? (
            <View style={styles.swapRequestedTag}>
              <Ionicons name="swap-horizontal" size={11} color="#D84315" />
              <AppText variant="caption" weight="700" color="#D84315">
                Swap Pending
              </AppText>
            </View>
          ) : null}
        </View>

        {/* Real-time lock indicator */}
        {isLockedByOther ? (
          <View style={styles.lockRow}>
            <Ionicons name="lock-closed" size={12} color="#E65100" />
            <AppText variant="caption" weight="700" color="#E65100">
              {task.inProgressLock?.lockedByName || 'A family member'} is doing this right now
            </AppText>
          </View>
        ) : null}

        {/* Footer Actions */}
        {isCompleted ? (
          <View style={styles.completedFooter}>
            <Ionicons name="checkmark-circle" size={16} color={Palette.success} />
            <AppText variant="caption" weight="700" color={Palette.success}>
              Completed by {task.completion?.performedBy?.name || 'Family member'}
              {task.completion?.wasCovered ? ' (Covered)' : ''}
            </AppText>
          </View>
        ) : (
          <View style={styles.actionFooter}>
            {isAssignedToMe && !isLockedByOther ? (
              <TouchableOpacity
                style={styles.ghostSwapBtn}
                onPress={() => onSwapPress(task)}
                activeOpacity={0.7}
              >
                <Ionicons name="swap-horizontal" size={14} color={Palette.secondary.base} />
                <AppText variant="caption" weight="700" color={Palette.secondary.base}>
                  Request Swap
                </AppText>
              </TouchableOpacity>
            ) : !isAssigned ? (
              <TouchableOpacity
                style={styles.takeChoreBtn}
                onPress={() => onTakeChorePress(task)}
                activeOpacity={0.7}
              >
                <Ionicons name="hand-right-outline" size={13} color={Palette.primary.base} />
                <AppText variant="caption" weight="700" color={Palette.primary.base}>
                  Take Chore
                </AppText>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            <TouchableOpacity
              style={[
                styles.markDoneBtn,
                isLockedByOther && styles.markDoneDisabled,
              ]}
              onPress={() => onCompletePress(task)}
              activeOpacity={0.8}
              disabled={isLockedByOther}
            >
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              <AppText variant="caption" weight="800" color="#FFFFFF">
                Mark Done
              </AppText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    flexDirection: 'row',
    overflow: 'hidden',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm + 4,
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  cardCompleted: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E8E8E8',
    opacity: 0.85,
  },
  leftBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: Spacing.md,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  windowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 0.5,
    borderColor: '#FFE082',
  },
  windowBadgeCompleted: {
    backgroundColor: '#EEEEEE',
    borderColor: '#E0E0E0',
  },
  categoryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  assigneeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  assigneeChipMe: {
    backgroundColor: '#F0F3FA',
    borderColor: '#D4DCED',
  },
  avatarImg: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  avatarFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unassignedAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFE8D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assigneeTextWrap: {
    maxWidth: 160,
  },
  swapRequestedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FBE9E7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  completedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#EEEEEE',
  },
  actionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#EEEEEE',
  },
  ghostSwapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  takeChoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F3FA',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
  },
  markDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.success,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    ...Platform.select({
      ios: {
        shadowColor: Palette.success,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  markDoneDisabled: {
    backgroundColor: Palette.gray[400],
  },
});
