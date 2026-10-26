import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { JournalTheme, Palette, Radius, Spacing } from '@/constants/theme';
import type { DelegationTask, TaskCategory } from '@/types/delegation';
import { resolveMediaUrl } from '@/lib/mediaUrl';

interface DelegationTaskCardProps {
  task: DelegationTask;
  currentUserId?: string;
  onAssignPress: (task: DelegationTask) => void;
  onWindowPress: (task: DelegationTask) => void;
  onSwapPress: (task: DelegationTask) => void;
  onCompletePress: (task: DelegationTask) => void;
  onTakeChorePress: (task: DelegationTask) => void;
}

const CATEGORY_STYLES: Record<
  TaskCategory,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  feeding: { label: 'Feeding', icon: 'restaurant-outline', color: '#D32F2F', bg: '#FFEBEE' },
  walk: { label: 'Walk & Exercise', icon: 'paw-outline', color: '#E65100', bg: '#FFF3E0' },
  medicine: { label: 'Medication', icon: 'medkit-outline', color: '#1565C0', bg: '#E3F2FD' },
  grooming: { label: 'Grooming', icon: 'cut-outline', color: '#C2185B', bg: '#FCE4EC' },
  vaccination: { label: 'Vaccination', icon: 'shield-checkmark-outline', color: '#6A1B9A', bg: '#F3E5F5' },
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
  const categoryConfig = CATEGORY_STYLES[task.category] || CATEGORY_STYLES.feeding;
  const isCompleted = Boolean(task.completion?.isCompleted);
  const isAssigned = Boolean(task.assignment?.userId);
  const isAssignedToMe = Boolean(currentUserId && task.assignment?.userId === currentUserId);
  const isLockedByOther = Boolean(task.isLockedByOther);

  const windowLabel = task.timingMode === 'window'
    ? `${task.window?.preset ? `${task.window.preset.charAt(0).toUpperCase() + task.window.preset.slice(1)} • ` : ''}${task.window?.startTime || '--:--'} – ${task.window?.endTime || '--:--'}`
    : task.exactTime || 'Scheduled';

  const avatarMedia = resolveMediaUrl(task.assignment?.avatarUrl);

  return (
    <View style={[styles.card, isCompleted && styles.cardCompleted]}>
      {/* 4px Left Organic Accent Bar */}
      <View
        style={[
          styles.leftAccentBar,
          { backgroundColor: isCompleted ? Palette.success : categoryConfig.color },
        ]}
      />

      <View style={styles.inner}>
        {/* Top Meta Line: Category Badge + Time Window Pill */}
        <View style={styles.topMetaRow}>
          <View style={[styles.categoryPill, { backgroundColor: categoryConfig.bg }]}>
            <Ionicons name={categoryConfig.icon} size={13} color={categoryConfig.color} />
            <AppText variant="caption" weight="800" color={categoryConfig.color} style={{ fontSize: 11 }}>
              {categoryConfig.label}
            </AppText>
          </View>

          {/* Time Window Pill */}
          <TouchableOpacity
            style={[styles.windowPill, isCompleted && styles.windowPillCompleted]}
            onPress={() => onWindowPress(task)}
            activeOpacity={0.7}
            disabled={isCompleted}
          >
            <Ionicons
              name={task.timingMode === 'window' ? 'hourglass-outline' : 'alarm-outline'}
              size={12}
              color={isCompleted ? Palette.gray[500] : '#B78103'}
            />
            <AppText
              variant="caption"
              weight="700"
              color={isCompleted ? Palette.gray[600] : '#8D6E63'}
              style={{ fontSize: 11 }}
            >
              {windowLabel}
            </AppText>
            {!isCompleted ? (
              <Ionicons name="chevron-down" size={11} color="#B78103" />
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Task Title */}
        <AppText
          variant="body"
          weight="800"
          color={isCompleted ? Palette.gray[500] : Palette.gray[900]}
          style={[styles.title, isCompleted && styles.titleCompleted]}
        >
          {task.title || categoryConfig.label}
        </AppText>

        {/* Caretaker Assignment & Swap Status */}
        <View style={styles.assigneeLine}>
          <TouchableOpacity
            style={[
              styles.assigneeChip,
              isAssignedToMe && styles.assigneeChipMe,
              !isAssigned && styles.assigneeChipUnassigned,
            ]}
            onPress={() => onAssignPress(task)}
            activeOpacity={0.75}
            disabled={isCompleted}
          >
            {isAssigned ? (
              avatarMedia ? (
                <Image source={{ uri: avatarMedia }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <View style={[styles.avatarFallback, isAssignedToMe && { backgroundColor: '#184F2E' }]}>
                  <AppText variant="caption" weight="800" color={isAssignedToMe ? '#FFFFFF' : '#184F2E'} style={{ fontSize: 10 }}>
                    {task.assignment.name.charAt(0).toUpperCase()}
                  </AppText>
                </View>
              )
            ) : (
              <View style={styles.unassignedIcon}>
                <Ionicons name="person-add" size={11} color="#E67E22" />
              </View>
            )}

            <AppText
              variant="caption"
              weight="700"
              color={isAssignedToMe ? '#184F2E' : !isAssigned ? '#B78103' : Palette.gray[800]}
              numberOfLines={1}
            >
              {isAssignedToMe ? 'Assigned to You' : task.assignment?.name || 'Open to Family'}
            </AppText>

            {!isCompleted ? (
              <Ionicons name="swap-vertical" size={11} color={Palette.gray[400]} />
            ) : null}
          </TouchableOpacity>

          {/* Pending Swap Tag */}
          {task.activeSwap?.isRequested ? (
            <View style={styles.swapRequestedTag}>
              <Ionicons name="swap-horizontal" size={12} color="#D84315" />
              <AppText variant="caption" weight="800" color="#D84315" style={{ fontSize: 11 }}>
                Swap Requested
              </AppText>
            </View>
          ) : null}
        </View>

        {/* Real-time concurrency lock alert */}
        {isLockedByOther ? (
          <View style={styles.lockNotice}>
            <Ionicons name="hand-right" size={13} color="#E65100" />
            <AppText variant="caption" weight="700" color="#E65100">
              {task.inProgressLock?.lockedByName || 'A family member'} is doing this right now
            </AppText>
          </View>
        ) : null}

        {/* Footer: Completed vs Active actions */}
        {isCompleted ? (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={17} color={Palette.success} />
            <AppText variant="caption" weight="700" color={Palette.success}>
              Completed by {task.completion?.performedBy?.name || 'Family Member'}
              {task.completion?.wasCovered ? ' (Covered)' : ''}
            </AppText>
          </View>
        ) : (
          <View style={styles.actionRow}>
            {isAssignedToMe && !isLockedByOther ? (
              <TouchableOpacity
                style={styles.requestSwapBtn}
                onPress={() => onSwapPress(task)}
                activeOpacity={0.7}
              >
                <Ionicons name="swap-horizontal" size={14} color="#E67E22" />
                <AppText variant="caption" weight="700" color="#E67E22">
                  Request Swap
                </AppText>
              </TouchableOpacity>
            ) : !isAssigned ? (
              <TouchableOpacity
                style={styles.takeChoreBtn}
                onPress={() => onTakeChorePress(task)}
                activeOpacity={0.75}
              >
                <Ionicons name="hand-right-outline" size={13} color="#184F2E" />
                <AppText variant="caption" weight="800" color="#184F2E">
                  I'll Take This
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    overflow: 'hidden',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm + 4,
    ...Platform.select({
      ios: {
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  cardCompleted: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E8E8E8',
    opacity: 0.88,
  },
  leftAccentBar: {
    width: 4,
  },
  inner: {
    flex: 1,
    padding: Spacing.md,
    gap: 8,
  },
  topMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  windowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  windowPillCompleted: {
    backgroundColor: '#EEEEEE',
    borderColor: '#E0E0E0',
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
  },
  assigneeLine: {
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
    paddingRight: 10,
    paddingLeft: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  assigneeChipMe: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  assigneeChipUnassigned: {
    backgroundColor: '#FFF8F0',
    borderColor: '#FFE0B2',
  },
  avatarImg: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  avatarFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unassignedIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFE0B2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapRequestedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FBE9E7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: '#FFCCBC',
  },
  lockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#EEEEEE',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#EEEEEE',
  },
  requestSwapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  takeChoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  markDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2E7D32',
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: Radius.full,
    ...Platform.select({
      ios: {
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  markDoneDisabled: {
    backgroundColor: Palette.gray[400],
  },
});
