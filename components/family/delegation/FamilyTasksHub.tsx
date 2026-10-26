import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { TeamGoalCard } from './TeamGoalCard';
import { ActiveSwapBanner } from './ActiveSwapBanner';
import { DoubleCareBanner } from './DoubleCareBanner';
import { DelegationTaskCard } from './DelegationTaskCard';
import { HouseholdLeaderboard } from './HouseholdLeaderboard';
import { SwapRequestSheet } from './SwapRequestSheet';
import { FlexibleWindowPickerModal } from './FlexibleWindowPickerModal';
import { AssignMemberModal } from './AssignMemberModal';
import { CompleteTaskModal } from './CompleteTaskModal';
import { EditGoalsModal } from './EditGoalsModal';
import { useToast } from '@/hooks/useToast';
import {
  fetchCaretakers,
  fetchDelegationTasks,
  updateTaskWindowApi,
  assignTaskApi,
  requestSwapApi,
  acceptSwapApi,
  acquireLockApi,
  completeTaskApi,
  fetchFamilyGoalsAndStats,
  updateFamilyGoalsApi,
} from '@/services/family/delegationApi';
import type {
  DelegationTask,
  FamilyCaretaker,
  FamilyGoalStats,
  TimeWindowConfig,
  TimingMode,
} from '@/types/delegation';

interface FamilyTasksHubProps {
  token: string | null;
  petId: string | null;
  currentUserId?: string;
  isOwner?: boolean;
  isPremium?: boolean;
  familyName?: string;
  onUpgradePress?: () => void;
}

type FilterTab = 'all' | 'mine' | 'unassigned';

export function FamilyTasksHub({
  token,
  petId,
  currentUserId,
  isOwner = false,
  isPremium = false,
  familyName = 'Household',
  onUpgradePress,
}: FamilyTasksHubProps) {
  const { showToast, showErrorToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [tasks, setTasks] = useState<DelegationTask[]>([]);
  const [caretakers, setCaretakers] = useState<FamilyCaretaker[]>([]);
  const [goalStats, setGoalStats] = useState<FamilyGoalStats | null>(null);

  // Active modal states
  const [selectedTask, setSelectedTask] = useState<DelegationTask | null>(null);
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [windowModalVisible, setWindowModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [editGoalsModalVisible, setEditGoalsModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load delegation data
  const loadData = useCallback(async () => {
    if (!token || !petId) return;
    try {
      const [fetchedTasks, fetchedCaretakers, fetchedStats] = await Promise.all([
        fetchDelegationTasks(token, petId),
        fetchCaretakers(token, petId),
        fetchFamilyGoalsAndStats(token, petId).catch(() => null),
      ]);
      setTasks(fetchedTasks);
      setCaretakers(fetchedCaretakers);
      if (fetchedStats) setGoalStats(fetchedStats);
    } catch (err: any) {
      // If error is 403 not premium, handled gracefully
      console.log('[FamilyTasksHub] load error', err?.message);
    } finally {
      setLoading(false);
    }
  }, [token, petId]);

  useEffect(() => {
    loadData();
    // Poll every 30s to keep anti-collision locks & swap requests fresh
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Derived arrays
  const pendingSwaps = useMemo(
    () => tasks.filter((t) => t.activeSwap?.isRequested && t.activeSwap?.status === 'pending'),
    [tasks]
  );

  const activeLocks = useMemo(
    () =>
      tasks
        .filter((t) => t.isLockedByOther && t.inProgressLock?.isLocked)
        .map((t) => ({ taskTitle: t.title || t.category, lock: t.inProgressLock })),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    if (filter === 'mine') {
      return tasks.filter((t) => t.assignment?.userId === currentUserId);
    }
    if (filter === 'unassigned') {
      return tasks.filter((t) => !t.assignment?.userId);
    }
    return tasks;
  }, [tasks, filter, currentUserId]);

  // Actions
  const handleAssignMember = async (targetUserId: string | null) => {
    if (!token || !petId || !selectedTask) return;
    setActionLoading(true);
    try {
      const updated = await assignTaskApi(token, petId, selectedTask._id, targetUserId);
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t)));
      setAssignModalVisible(false);
      setSelectedTask(null);
      showToast(targetUserId ? 'Chore assigned successfully!' : 'Chore is now open to all members.');
    } catch (err: any) {
      showErrorToast(err?.message || 'Failed to assign chore');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTakeChore = async (task: DelegationTask) => {
    if (!token || !petId || !currentUserId) return;
    try {
      const updated = await assignTaskApi(token, petId, task._id, currentUserId);
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t)));
      showToast('You took this chore! 🐾');
    } catch (err: any) {
      showErrorToast(err?.message || 'Failed to take chore');
    }
  };

  const handleSendSwapRequest = async (targetUserId: string | null, note: string) => {
    if (!token || !petId || !selectedTask) return;
    setActionLoading(true);
    try {
      const updated = await requestSwapApi(token, petId, selectedTask._id, { targetUserId, note });
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t)));
      setSwapModalVisible(false);
      setSelectedTask(null);
      showToast('Swap request sent to household!');
    } catch (err: any) {
      showErrorToast(err?.message || 'Failed to send swap request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptSwap = async (task: DelegationTask) => {
    if (!token || !petId) return;
    try {
      const updated = await acceptSwapApi(token, petId, task._id);
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t)));
      showToast('You accepted the swap! Task assigned to you. 🎉');
      loadData();
    } catch (err: any) {
      showErrorToast(err?.message || 'Failed to accept swap');
    }
  };

  const handleSaveWindow = async (timingMode: TimingMode, exactTime: string, window: TimeWindowConfig) => {
    if (!token || !petId || !selectedTask) return;
    setActionLoading(true);
    try {
      const updated = await updateTaskWindowApi(token, petId, selectedTask._id, { timingMode, exactTime, window });
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t)));
      setWindowModalVisible(false);
      setSelectedTask(null);
      showToast('Timing window updated!');
    } catch (err: any) {
      showErrorToast(err?.message || 'Failed to update window');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartComplete = async (task: DelegationTask) => {
    if (!token || !petId) return;
    setSelectedTask(task);

    // Try to acquire 10-minute in-progress lock
    try {
      await acquireLockApi(token, petId, task._id);
    } catch (err: any) {
      if (err?.status === 409) {
        showErrorToast(err.message);
        return;
      }
    }

    setCompleteModalVisible(true);
  };

  const handleFinishComplete = async (
    walkMetrics?: { durationMinutes: number; distanceKm: number },
    notes?: string
  ) => {
    if (!token || !petId || !selectedTask) return;
    setActionLoading(true);
    try {
      const updated = await completeTaskApi(token, petId, selectedTask._id, { walkMetrics, notes, status: 'done' });
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t)));
      setCompleteModalVisible(false);
      setSelectedTask(null);
      showToast('Chore completed & logged for the family! 🎉');
      loadData();
    } catch (err: any) {
      showErrorToast(err?.message || 'Failed to complete chore');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveGoals = async (goals: { weeklyTargetMinutes: number; weeklyTargetKm: number; dailyMinimumWalkCount: number }) => {
    if (!token || !petId) return;
    setActionLoading(true);
    try {
      await updateFamilyGoalsApi(token, petId, goals);
      setEditGoalsModalVisible(false);
      showToast('Walking goals updated!');
      loadData();
    } catch (err: any) {
      showErrorToast(err?.message || 'Failed to update goals');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleWrap}>
          <View style={styles.proPill}>
            <Ionicons name="sparkles" size={11} color="#D4A017" />
            <AppText variant="caption" weight="800" color="#D4A017">
              PRO SUITE
            </AppText>
          </View>
          <AppText variant="h3" weight="800" color={Palette.primary.base}>
            Family Chore Delegation
          </AppText>
          <AppText variant="caption" color={Palette.gray[600]}>
            Collaborative pet care, task swaps, and household activity goals
          </AppText>
        </View>
      </View>

      {/* Shared Walking Goal Card */}
      <TeamGoalCard
        stats={goalStats}
        isOwner={isOwner}
        onEditGoals={() => setEditGoalsModalVisible(true)}
      />

      {/* Active Swap Callout */}
      <ActiveSwapBanner pendingSwaps={pendingSwaps} onAcceptSwap={handleAcceptSwap} />

      {/* Double Care Real-Time Lock Banner */}
      <DoubleCareBanner locks={activeLocks} />

      {/* Segmented Filter Control */}
      <View style={styles.segmentedTabs}>
        <TouchableOpacity
          style={[styles.segmentBtn, filter === 'all' && styles.segmentBtnActive]}
          onPress={() => setFilter('all')}
          activeOpacity={0.8}
        >
          <AppText
            variant="caption"
            weight={filter === 'all' ? '800' : '600'}
            color={filter === 'all' ? '#184F2E' : Palette.gray[600]}
          >
            All Chores ({tasks.length})
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, filter === 'mine' && styles.segmentBtnActive]}
          onPress={() => setFilter('mine')}
          activeOpacity={0.8}
        >
          <AppText
            variant="caption"
            weight={filter === 'mine' ? '800' : '600'}
            color={filter === 'mine' ? '#184F2E' : Palette.gray[600]}
          >
            My Tasks
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, filter === 'unassigned' && styles.segmentBtnActive]}
          onPress={() => setFilter('unassigned')}
          activeOpacity={0.8}
        >
          <AppText
            variant="caption"
            weight={filter === 'unassigned' ? '800' : '600'}
            color={filter === 'unassigned' ? '#184F2E' : Palette.gray[600]}
          >
            Open to Family
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Task Cards List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Palette.primary.base} size="small" />
        </View>
      ) : filteredTasks.length > 0 ? (
        filteredTasks.map((task) => (
          <DelegationTaskCard
            key={task._id}
            task={task}
            currentUserId={currentUserId}
            onAssignPress={(t) => {
              setSelectedTask(t);
              setAssignModalVisible(true);
            }}
            onWindowPress={(t) => {
              setSelectedTask(t);
              setWindowModalVisible(true);
            }}
            onSwapPress={(t) => {
              setSelectedTask(t);
              setSwapModalVisible(true);
            }}
            onTakeChorePress={handleTakeChore}
            onCompletePress={handleStartComplete}
          />
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done-circle-outline" size={40} color={Palette.gray[400]} />
          <AppText variant="bodySmall" weight="700" color={Palette.gray[700]}>
            No chores in this view
          </AppText>
          <AppText variant="caption" color={Palette.gray[500]}>
            All pet care tasks for this filter have been handled!
          </AppText>
        </View>
      )}

      {/* Household Leaderboard */}
      <HouseholdLeaderboard stats={goalStats} familyName={familyName} />

      {/* Modals */}
      <SwapRequestSheet
        visible={swapModalVisible}
        task={selectedTask}
        caretakers={caretakers}
        currentUserId={currentUserId}
        onClose={() => {
          setSwapModalVisible(false);
          setSelectedTask(null);
        }}
        onSubmit={handleSendSwapRequest}
        submitting={actionLoading}
      />

      <FlexibleWindowPickerModal
        visible={windowModalVisible}
        task={selectedTask}
        onClose={() => {
          setWindowModalVisible(false);
          setSelectedTask(null);
        }}
        onSave={handleSaveWindow}
        saving={actionLoading}
      />

      <AssignMemberModal
        visible={assignModalVisible}
        task={selectedTask}
        caretakers={caretakers}
        onClose={() => {
          setAssignModalVisible(false);
          setSelectedTask(null);
        }}
        onAssign={handleAssignMember}
        assigning={actionLoading}
      />

      <CompleteTaskModal
        visible={completeModalVisible}
        task={selectedTask}
        onClose={() => {
          setCompleteModalVisible(false);
          setSelectedTask(null);
        }}
        onComplete={handleFinishComplete}
        completing={actionLoading}
      />

      <EditGoalsModal
        visible={editGoalsModalVisible}
        stats={goalStats}
        onClose={() => setEditGoalsModalVisible(false)}
        onSave={handleSaveGoals}
        saving={actionLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  titleWrap: {
    gap: 2,
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FFE082',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  segmentedTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(230, 240, 230, 0.75)',
    borderRadius: Radius.full,
    padding: 3,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#184F2E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  loadingWrap: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: 6,
    marginHorizontal: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.md,
  },
});
