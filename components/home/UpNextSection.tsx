import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { AppText } from '../ui/AppText';
import { Skeleton } from '@/components/ui/skeletons';
import { ColorIconBadge } from './ColorIconBadge';
import { SectionHeader } from './SectionHeader';
import { homePillCard } from './homeStyles';
import { formatTimeHHmmDisplay } from '@/lib/feeding/feedingForm';
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
  isPremium?: boolean;
}

function dashboardTaskCaption(task: DashboardTask): string {
  if (task.timeOfDay) return formatTimeHHmmDisplay(task.timeOfDay);
  if (task.scheduledDate) return new Date(task.scheduledDate).toLocaleDateString();
  return 'Upcoming';
}

function dashboardTaskIcon(task: DashboardTask): 'silverware-fork-knife' | 'walk' | 'pill' | 'content-cut' | 'needle' | 'shower' {
  const category = task.category?.toLowerCase() ?? '';
  const title = task.title?.toLowerCase() ?? '';
  if (category === 'feeding' || category === 'food') return 'silverware-fork-knife';
  if (category === 'walk' || category === 'walks') return 'walk';
  if (category === 'medicine') return 'pill';
  if (category === 'vaccination') return 'needle';
  if (title.includes('bath') || title.includes('shower') || title.includes('wash')) return 'shower';
  if (task.source === 'grooming' || category === 'grooming') return 'content-cut';
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

interface DashboardTaskCardProps {
  task: DashboardTask;
  onLog?: (id: string) => void | Promise<void>;
  isPremium?: boolean;
}

const DashboardTaskCard = React.memo(function DashboardTaskCard({ task, onLog, isPremium = false }: DashboardTaskCardProps) {
  const [busy, setBusy] = useState(false);
  const iconColor = isPremium ? '#184F2E' : '#2E7D32';
  const iconBg = isPremium ? 'rgba(212, 160, 23, 0.08)' : 'rgba(46, 125, 50, 0.06)';

  const handlePress = async () => {
    if (!onLog || busy) return;
    setBusy(true);
    try {
      await onLog(task.id);
    } catch (e: any) {
      Alert.alert('Action Failed', e?.message || 'Could not perform this action.');
    } finally {
      setBusy(false);
    }
  };

  const cardBorderColor = isPremium
    ? 'rgba(212, 160, 23, 0.35)'  // Gold trim for premium
    : 'rgba(46, 125, 50, 0.12)';  // Soft green border

  return (
    <View style={[homePillCard.card, styles.card, { borderWidth: 1, borderColor: cardBorderColor }]}>
      <ColorIconBadge
        color={iconColor}
        backgroundColor={iconBg}
        materialIcon={dashboardTaskIcon(task)}
        size={36}
        iconSize={18}
      />
      <View style={styles.textBlock}>
        <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
          {task.title ? task.title.charAt(0).toUpperCase() + task.title.slice(1) : ''}
        </AppText>
        <AppText variant="caption" color={HomeTheme.textMuted}>
          {dashboardTaskCaption(task)}
        </AppText>
      </View>
      {onLog ? (
        <TouchableOpacity
          style={[styles.logBtn, { backgroundColor: iconColor }]}
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
});

export const UpNextSection = React.memo(function UpNextSection({
  loading = false,
  onLogFeeding,
  onLogWalk,
  onLogMedicine,
  onLogGrooming,
  onLogVaccination,
  dashboardTasks = [],
  isPremium = false,
}: UpNextSectionProps) {
  if (dashboardTasks.length === 0 && !loading) {
    return null;
  }

  return (
    <View style={styles.section}>
      <SectionHeader title="Up Next" />
      {loading ? (
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: Spacing.lg }}>
          <Skeleton width={180} height={90} borderRadius={Radius.md} />
          <Skeleton width={180} height={90} borderRadius={Radius.md} />
        </View>
      ) : (
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
                isPremium={isPremium}
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.md,
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
