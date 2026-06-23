import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { AppText } from '../ui/AppText';
import { ColorIconBadge } from './ColorIconBadge';
import { SectionHeader } from './SectionHeader';
import { homePillCard } from './homeStyles';
import { feedingScheduleColors } from '@/lib/feeding/feedingDisplay';
import { formatTimeHHmmDisplay } from '@/lib/feeding/feedingForm';
import { groomingRecordColors } from '@/lib/grooming/groomingDisplay';
import { walkScheduleColors } from '@/lib/walk/walkDisplay';
import type { FeedingScheduleItem } from '@/types/feeding';
import type { WalkScheduleItem } from '@/types/walk';
import type { DashboardTask } from '@/types/dashboard';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';

interface UpNextSectionProps {
  loading?: boolean;
  onLogFeeding?: (scheduleId: string) => void | Promise<void>;
  onLogWalk?: (scheduleId: string) => void | Promise<void>;
  onLogMedicine?: (scheduleId: string) => void | Promise<void>;
  onLogGrooming?: (recordId: string) => void | Promise<void>;
  onLogVaccination?: (scheduleId: string) => void | Promise<void>;
  dashboardTasks?: DashboardTask[];
}

function dashboardTaskCaption(task: DashboardTask): string {
  if (task.timeOfDay) return formatTimeHHmmDisplay(task.timeOfDay);
  if (task.scheduledDate) return new Date(task.scheduledDate).toLocaleDateString();
  return 'Upcoming';
}

function dashboardTaskIcon(task: DashboardTask): 'silverware-fork-knife' | 'walk' | 'pill' | 'content-cut' | 'needle' {
  const category = task.category?.toLowerCase() ?? '';
  if (category === 'feeding' || category === 'food') return 'silverware-fork-knife';
  if (category === 'walk' || category === 'walks') return 'walk';
  if (category === 'medicine') return 'pill';
  if (category === 'vaccination') return 'needle';
  if (task.source === 'grooming') return 'content-cut';
  return 'silverware-fork-knife';
}

function dashboardTaskHandler(
  task: DashboardTask,
  handlers: Pick<
    UpNextSectionProps,
    'onLogFeeding' | 'onLogWalk' | 'onLogMedicine' | 'onLogGrooming' | 'onLogVaccination'
  >,
) {
  if (task.source === 'grooming') return handlers.onLogGrooming;
  const category = task.category?.toLowerCase() ?? '';
  if (category === 'feeding' || category === 'food') return handlers.onLogFeeding;
  if (category === 'walk' || category === 'walks') return handlers.onLogWalk;
  if (category === 'medicine') return handlers.onLogMedicine;
  if (category === 'vaccination') return handlers.onLogVaccination;
  return handlers.onLogFeeding;
}

// Subcomponent for Dashboard Task Cards with independent loading
interface DashboardTaskCardProps {
  task: DashboardTask;
  onLog?: (id: string) => void | Promise<void>;
}

function DashboardTaskCard({ task, onLog }: DashboardTaskCardProps) {
  const [busy, setBusy] = useState(false);
  const colors =
    task.source === 'grooming'
      ? groomingRecordColors()
      : task.category === 'walk'
        ? walkScheduleColors({} as WalkScheduleItem)
        : feedingScheduleColors({} as FeedingScheduleItem);

  const handlePress = async () => {
    if (!onLog) return;
    setBusy(true);
    try {
      await onLog(task.id);
    } catch (e: any) {
      Alert.alert('Action Failed', e?.message || 'Could not perform this action.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[homePillCard.card, styles.card]}>
      <ColorIconBadge
        color={colors.color}
        backgroundColor={colors.bg}
        materialIcon={dashboardTaskIcon(task)}
        size={46}
        iconSize={22}
      />
      <View style={styles.textBlock}>
        <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
          {task.title}
        </AppText>
        <AppText variant="caption" color={HomeTheme.textMuted}>
          {dashboardTaskCaption(task)}
        </AppText>
      </View>
      {onLog ? (
        <TouchableOpacity
          style={styles.logBtn}
          activeOpacity={0.85}
          disabled={busy}
          onPress={handlePress}
        >
          {busy ? (
            <ActivityIndicator size="small" color={HomeTheme.white} />
          ) : (
            <AppText variant="caption" weight="800" color={HomeTheme.white}>
              LOG
            </AppText>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function UpNextSection({
  loading = false,
  onLogFeeding,
  onLogWalk,
  onLogMedicine,
  onLogGrooming,
  onLogVaccination,
  dashboardTasks = [],
}: UpNextSectionProps) {
  if (dashboardTasks.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <SectionHeader title="Up Next" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dashboardTasks.map((task) => {
          const onLog = dashboardTaskHandler(task, {
            onLogFeeding,
            onLogWalk,
            onLogMedicine,
            onLogGrooming,
            onLogVaccination,
          });
          return (
            <DashboardTaskCard
              key={`${task.source}-${task.id}`}
              task={task}
              onLog={onLog}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  loader: {
    marginVertical: Spacing.sm,
  },
  scrollContent: {
    paddingRight: Spacing.sm,
    paddingBottom: Spacing.xs,
    gap: Spacing.sm,
    alignItems: 'stretch',
  },
  card: {
    width: 260,
    marginBottom: Spacing.xs,
    marginRight: Spacing.sm,
    alignSelf: 'stretch',
  },
  textBlock: {
    flex: 1,
    marginLeft: Spacing.sm,
    gap: 2,
  },
  logBtn: {
    backgroundColor: HomeTheme.cardGreen,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    minWidth: 52,
    alignItems: 'center',
  },
});
