import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AppText } from '../ui/AppText';
import { ColorIconBadge } from './ColorIconBadge';
import { SectionHeader } from './SectionHeader';
import { homePillCard } from './homeStyles';
import {
  feedingScheduleColors,
  feedingScheduleTitle,
  pendingFeedingSchedules,
} from '@/lib/feeding/feedingDisplay';
import { formatTimeHHmmDisplay } from '@/lib/feeding/feedingForm';
import {
  groomingRecordColors,
  groomingRecordTitle,
  groomingSortKey,
  pendingGroomingRecords,
} from '@/lib/grooming/groomingDisplay';
import { formatDateLabel } from '@/lib/grooming/groomingForm';
import {
  medicineScheduleColors,
  medicineScheduleTitle,
  pendingMedicineSchedules,
} from '@/lib/medicine/medicineDisplay';
import {
  pendingWalkSchedules,
  walkScheduleColors,
  walkScheduleTitle,
} from '@/lib/walk/walkDisplay';
import {
  pendingVaccinationSchedules,
  vaccinationDueDate,
  vaccinationScheduleColors,
  vaccinationScheduleTitle,
  vaccinationSortKey,
} from '@/lib/vaccination/vaccinationDisplay';
import type { FeedingScheduleItem } from '@/types/feeding';
import type { GroomingRecord } from '@/types/grooming';
import type { MedicineScheduleItem } from '@/types/medicine';
import type { VaccinationScheduleItem } from '@/types/vaccination';
import type { WalkScheduleItem } from '@/types/walk';
import type { DashboardTask } from '@/types/dashboard';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';

type PendingRow =
  | { kind: 'feeding'; item: FeedingScheduleItem }
  | { kind: 'walk'; item: WalkScheduleItem }
  | { kind: 'medicine'; item: MedicineScheduleItem }
  | { kind: 'grooming'; item: GroomingRecord }
  | { kind: 'vaccination'; item: VaccinationScheduleItem };

interface UpNextSectionProps {
  feedingSchedules: FeedingScheduleItem[];
  walkSchedules?: WalkScheduleItem[];
  medicineSchedules?: MedicineScheduleItem[];
  groomingRecords?: GroomingRecord[];
  vaccinationSchedules?: VaccinationScheduleItem[];
  loading?: boolean;
  feedingActionId?: string | null;
  walkActionId?: string | null;
  medicineActionId?: string | null;
  groomingActionId?: string | null;
  vaccinationActionId?: string | null;
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

function rowSortKey(row: PendingRow): number {
  if (row.kind === 'grooming') return groomingSortKey(row.item);
  if (row.kind === 'vaccination') return vaccinationSortKey(row.item);
  const [h, m] = row.item.timeOfDay.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function mergePendingRows(
  feedingSchedules: FeedingScheduleItem[],
  walkSchedules: WalkScheduleItem[],
  medicineSchedules: MedicineScheduleItem[],
  groomingRecords: GroomingRecord[],
  vaccinationSchedules: VaccinationScheduleItem[],
 ): PendingRow[] {
  const rows: PendingRow[] = [
    ...pendingFeedingSchedules(feedingSchedules).map((item) => ({ kind: 'feeding' as const, item })),
    ...pendingWalkSchedules(walkSchedules).map((item) => ({ kind: 'walk' as const, item })),
    ...pendingMedicineSchedules(medicineSchedules).map((item) => ({ kind: 'medicine' as const, item })),
    ...pendingGroomingRecords(groomingRecords).map((item) => ({ kind: 'grooming' as const, item })),
    ...pendingVaccinationSchedules(vaccinationSchedules).map((item) => ({
      kind: 'vaccination' as const,
      item,
    })),
  ];
  return rows.sort((a, b) => rowSortKey(a) - rowSortKey(b));
}

function rowColors(row: PendingRow) {
  if (row.kind === 'feeding') return feedingScheduleColors(row.item);
  if (row.kind === 'walk') return walkScheduleColors(row.item);
  if (row.kind === 'medicine') return medicineScheduleColors();
  if (row.kind === 'vaccination') return vaccinationScheduleColors();
  return groomingRecordColors();
}

function rowTitle(row: PendingRow) {
  if (row.kind === 'feeding') return feedingScheduleTitle(row.item);
  if (row.kind === 'walk') return walkScheduleTitle(row.item);
  if (row.kind === 'medicine') return medicineScheduleTitle(row.item);
  if (row.kind === 'vaccination') return vaccinationScheduleTitle(row.item);
  return groomingRecordTitle(row.item);
}

function rowCaption(row: PendingRow) {
  if (row.kind === 'grooming') {
    if (row.item.scheduledDate) {
      return formatDateLabel(new Date(row.item.scheduledDate));
    }
    return 'No date set';
  }
  if (row.kind === 'vaccination') {
    const due = vaccinationDueDate(row.item);
    if (due) return formatDateLabel(due);
    return 'No date set';
  }
  return formatTimeHHmmDisplay(row.item.timeOfDay);
}

function rowIcon(row: PendingRow): 'silverware-fork-knife' | 'walk' | 'pill' | 'content-cut' | 'needle' {
  if (row.kind === 'feeding') return 'silverware-fork-knife';
  if (row.kind === 'walk') return 'walk';
  if (row.kind === 'medicine') return 'pill';
  if (row.kind === 'vaccination') return 'needle';
  return 'content-cut';
}

function rowLogBtnStyle(row: PendingRow) {
  if (row.kind === 'feeding') return styles.logBtn;
  if (row.kind === 'walk') return [styles.logBtn, styles.logBtnWalk];
  if (row.kind === 'medicine') return [styles.logBtn, styles.logBtnMedicine];
  if (row.kind === 'vaccination') return [styles.logBtn, styles.logBtnVaccination];
  return [styles.logBtn, styles.logBtnGrooming];
}

function rowOnLog(
  row: PendingRow,
  onLogFeeding?: (id: string) => void | Promise<void>,
  onLogWalk?: (id: string) => void | Promise<void>,
  onLogMedicine?: (id: string) => void | Promise<void>,
  onLogGrooming?: (id: string) => void | Promise<void>,
  onLogVaccination?: (id: string) => void | Promise<void>,
) {
  if (row.kind === 'feeding') return onLogFeeding;
  if (row.kind === 'walk') return onLogWalk;
  if (row.kind === 'medicine') return onLogMedicine;
  if (row.kind === 'vaccination') return onLogVaccination;
  return onLogGrooming;
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
    } catch (e) {
      // error handled by parent
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

// Subcomponent for Pending Row Cards with independent loading
interface PendingRowCardProps {
  row: PendingRow;
  onLogFeeding?: (id: string) => void | Promise<void>;
  onLogWalk?: (id: string) => void | Promise<void>;
  onLogMedicine?: (id: string) => void | Promise<void>;
  onLogGrooming?: (id: string) => void | Promise<void>;
  onLogVaccination?: (id: string) => void | Promise<void>;
}

function PendingRowCard({
  row,
  onLogFeeding,
  onLogWalk,
  onLogMedicine,
  onLogGrooming,
  onLogVaccination,
}: PendingRowCardProps) {
  const [busy, setBusy] = useState(false);
  const colors = rowColors(row);
  const onLog = rowOnLog(
    row,
    onLogFeeding,
    onLogWalk,
    onLogMedicine,
    onLogGrooming,
    onLogVaccination,
  );

  const handlePress = async () => {
    if (!onLog) return;
    setBusy(true);
    try {
      await onLog(row.item._id);
    } catch (e) {
      // error handled by parent
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[homePillCard.card, styles.card]}>
      <ColorIconBadge
        color={colors.color}
        backgroundColor={colors.bg}
        materialIcon={rowIcon(row)}
        size={46}
        iconSize={22}
      />
      <View style={styles.textBlock}>
        <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
          {rowTitle(row)}
        </AppText>
        <AppText variant="caption" color={HomeTheme.textMuted}>
          {rowCaption(row)}
        </AppText>
      </View>
      {onLog ? (
        <TouchableOpacity
          style={rowLogBtnStyle(row)}
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
  feedingSchedules,
  walkSchedules = [],
  medicineSchedules = [],
  groomingRecords = [],
  vaccinationSchedules = [],
  loading = false,
  onLogFeeding,
  onLogWalk,
  onLogMedicine,
  onLogGrooming,
  onLogVaccination,
  dashboardTasks = [],
}: UpNextSectionProps) {
  const pending = useMemo(
    () =>
      mergePendingRows(
        feedingSchedules,
        walkSchedules,
        medicineSchedules,
        groomingRecords,
        vaccinationSchedules,
      ),
    [feedingSchedules, walkSchedules, medicineSchedules, groomingRecords, vaccinationSchedules],
  );

  const hasLocalSchedules =
    feedingSchedules.length > 0 ||
    walkSchedules.length > 0 ||
    medicineSchedules.length > 0 ||
    groomingRecords.length > 0 ||
    vaccinationSchedules.length > 0;

  const useDashboard = !hasLocalSchedules && dashboardTasks.length > 0;
  const showLoading = loading && pending.length === 0 && dashboardTasks.length === 0;

  if (showLoading) {
    return (
      <View style={styles.section}>
        <SectionHeader title="Up Next" />
        <View style={[homePillCard.card, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="small" color="#5CB35D" style={{ marginRight: Spacing.sm }} />
          <AppText variant="bodySmall" color={HomeTheme.textMuted}>
            Loading tasks…
          </AppText>
        </View>
      </View>
    );
  }

  if (!useDashboard && pending.length === 0) {
    return null;
  }

  if (useDashboard && dashboardTasks.length === 0) {
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
        {useDashboard
          ? dashboardTasks.map((task) => {
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
            })
          : pending.map((row) => (
              <PendingRowCard
                key={`${row.kind}-${row.item._id}`}
                row={row}
                onLogFeeding={onLogFeeding}
                onLogWalk={onLogWalk}
                onLogMedicine={onLogMedicine}
                onLogGrooming={onLogGrooming}
                onLogVaccination={onLogVaccination}
              />
            ))}
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
  logBtnWalk: {
    backgroundColor: '#5CB35D',
  },
  logBtnMedicine: {
    backgroundColor: '#5B9BD5',
  },
  logBtnGrooming: {
    backgroundColor: '#E91E8C',
  },
  logBtnVaccination: {
    backgroundColor: '#673AB7',
  },
});
