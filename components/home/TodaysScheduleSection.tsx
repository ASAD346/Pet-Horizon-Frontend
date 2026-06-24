import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { ColorIconBadge } from './ColorIconBadge';
import { SectionHeader } from './SectionHeader';
import { homePillCard } from './homeStyles';
import {
  feedingScheduleColors,
  feedingScheduleSubtitle,
  feedingScheduleTitle,
  sortFeedingByTime,
} from '@/lib/feeding/feedingDisplay';
import {
  groomingDueTodayOrOverdue,
  groomingRecordColors,
  groomingRecordSubtitle,
  groomingRecordTitle,
  groomingSortKey,
} from '@/lib/grooming/groomingDisplay';
import {
  medicineScheduleColors,
  medicineScheduleSubtitle,
  medicineScheduleTitle,
  sortMedicineByTime,
} from '@/lib/medicine/medicineDisplay';
import {
  sortWalkByTime,
  walkScheduleColors,
  walkScheduleSubtitle,
  walkScheduleTitle,
} from '@/lib/walk/walkDisplay';
import {
  vaccinationDueTodayOrOverdue,
  vaccinationScheduleColors,
  vaccinationScheduleSubtitle,
  vaccinationScheduleTitle,
  vaccinationSortKey,
} from '@/lib/vaccination/vaccinationDisplay';
import type { FeedingScheduleItem } from '@/types/feeding';
import type { GroomingRecord } from '@/types/grooming';
import type { MedicineScheduleItem } from '@/types/medicine';
import type { VaccinationScheduleItem } from '@/types/vaccination';
import type { WalkScheduleItem } from '@/types/walk';
import { HomeTheme, Spacing, Radius } from '../../constants/theme';

type ScheduleRow =
  | { kind: 'feeding'; item: FeedingScheduleItem }
  | { kind: 'walk'; item: WalkScheduleItem }
  | { kind: 'medicine'; item: MedicineScheduleItem }
  | { kind: 'grooming'; item: GroomingRecord }
  | { kind: 'vaccination'; item: VaccinationScheduleItem };

interface TodaysScheduleSectionProps {
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
  onCompleteFeeding?: (scheduleId: string) => void | Promise<void>;
  onSkipFeeding?: (scheduleId: string) => void | Promise<void>;
  onCompleteWalk?: (scheduleId: string) => void | Promise<void>;
  onCompleteMedicine?: (scheduleId: string) => void | Promise<void>;
  onCompleteGrooming?: (recordId: string) => void | Promise<void>;
  onManageGrooming?: (recordId: string) => void | Promise<void>;
  onCompleteVaccination?: (scheduleId: string) => void | Promise<void>;
  isPremium?: boolean;
}

function rowSortKey(row: ScheduleRow): number {
  if (row.kind === 'grooming') return groomingSortKey(row.item);
  if (row.kind === 'vaccination') return vaccinationSortKey(row.item);
  const [h, m] = row.item.timeOfDay.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function mergeScheduleRows(
  feedingSchedules: FeedingScheduleItem[],
  walkSchedules: WalkScheduleItem[],
  medicineSchedules: MedicineScheduleItem[],
  groomingRecords: GroomingRecord[],
  vaccinationSchedules: VaccinationScheduleItem[],
): ScheduleRow[] {
  const rows: ScheduleRow[] = [
    ...sortFeedingByTime(feedingSchedules).map((item) => ({ kind: 'feeding' as const, item })),
    ...sortWalkByTime(walkSchedules).map((item) => ({ kind: 'walk' as const, item })),
    ...sortMedicineByTime(medicineSchedules).map((item) => ({ kind: 'medicine' as const, item })),
    ...groomingDueTodayOrOverdue(groomingRecords).map((item) => ({ kind: 'grooming' as const, item })),
    ...vaccinationDueTodayOrOverdue(vaccinationSchedules).map((item) => ({
      kind: 'vaccination' as const,
      item,
    })),
  ];
  return rows.sort((a, b) => rowSortKey(a) - rowSortKey(b));
}

function rowColors(row: ScheduleRow) {
  if (row.kind === 'feeding') return feedingScheduleColors(row.item);
  if (row.kind === 'walk') return walkScheduleColors(row.item);
  if (row.kind === 'medicine') return medicineScheduleColors();
  if (row.kind === 'vaccination') return vaccinationScheduleColors();
  return groomingRecordColors();
}

function rowTitle(row: ScheduleRow) {
  if (row.kind === 'feeding') return feedingScheduleTitle(row.item);
  if (row.kind === 'walk') return walkScheduleTitle(row.item);
  if (row.kind === 'medicine') return medicineScheduleTitle(row.item);
  if (row.kind === 'vaccination') return vaccinationScheduleTitle(row.item);
  return groomingRecordTitle(row.item);
}

function rowSubtitle(row: ScheduleRow) {
  if (row.kind === 'feeding') return feedingScheduleSubtitle(row.item);
  if (row.kind === 'walk') return walkScheduleSubtitle(row.item);
  if (row.kind === 'medicine') return medicineScheduleSubtitle(row.item);
  if (row.kind === 'vaccination') return vaccinationScheduleSubtitle(row.item);
  return groomingRecordSubtitle(row.item);
}

function rowIcon(
  row: ScheduleRow,
): 'silverware-fork-knife' | 'walk' | 'pill' | 'content-cut' | 'needle' {
  if (row.kind === 'feeding') return 'silverware-fork-knife';
  if (row.kind === 'walk') return 'walk';
  if (row.kind === 'medicine') return 'pill';
  if (row.kind === 'vaccination') return 'needle';
  return 'content-cut';
}

function rowIsDone(row: ScheduleRow) {
  if (row.kind === 'grooming') return !!row.item.performedAt;
  if (row.kind === 'vaccination') return row.item.isActive === false || !!row.item.metadata?.administeredDate;
  return row.item.status === 'done' || row.item.isComplete === true || !!row.item.completedAt;
}

function rowIsSkipped(row: ScheduleRow) {
  if (row.kind === 'grooming' || row.kind === 'vaccination') return false;
  return row.item.status === 'skipped';
}

function rowId(row: ScheduleRow) {
  return row.item._id;
}

function rowOnComplete(
  row: ScheduleRow,
  onCompleteFeeding?: (id: string) => void | Promise<void>,
  onCompleteWalk?: (id: string) => void | Promise<void>,
  onCompleteMedicine?: (id: string) => void | Promise<void>,
  onCompleteGrooming?: (id: string) => void | Promise<void>,
  onCompleteVaccination?: (id: string) => void | Promise<void>,
) {
  if (row.kind === 'feeding') return onCompleteFeeding;
  if (row.kind === 'walk') return onCompleteWalk;
  if (row.kind === 'medicine') return onCompleteMedicine;
  if (row.kind === 'vaccination') return onCompleteVaccination;
  return onCompleteGrooming;
}

// Subcomponent for individual rows to handle independent Skip/Done busy indicators
interface ScheduleRowCardProps {
  row: ScheduleRow;
  onCompleteFeeding?: (id: string) => void | Promise<void>;
  onSkipFeeding?: (id: string) => void | Promise<void>;
  onCompleteWalk?: (id: string) => void | Promise<void>;
  onCompleteMedicine?: (id: string) => void | Promise<void>;
  onCompleteGrooming?: (id: string) => void | Promise<void>;
  onManageGrooming?: (id: string) => void | Promise<void>;
  onCompleteVaccination?: (id: string) => void | Promise<void>;
  isPremium?: boolean;
}

const ScheduleRowCard = React.memo(function ScheduleRowCard({
  row,
  onCompleteFeeding,
  onSkipFeeding,
  onCompleteWalk,
  onCompleteMedicine,
  onCompleteGrooming,
  onManageGrooming,
  onCompleteVaccination,
  isPremium = false,
}: ScheduleRowCardProps) {
  const [completeBusy, setCompleteBusy] = useState(false);
  const [skipBusy, setSkipBusy] = useState(false);

  const isDone = rowIsDone(row);
  const isSkipped = rowIsSkipped(row);
  const colors = rowColors(row);

  const cardBorderColor = isPremium
    ? 'rgba(212, 160, 23, 0.35)'  // Gold trim for premium
    : 'rgba(46, 125, 50, 0.12)';  // Soft green border

  const onComplete = rowOnComplete(
    row,
    onCompleteFeeding,
    onCompleteWalk,
    onCompleteMedicine,
    onCompleteGrooming,
    onCompleteVaccination,
  );

  const handleComplete = async () => {
    if (!onComplete) return;
    setCompleteBusy(true);
    try {
      await onComplete(rowId(row));
    } catch (e: any) {
      Alert.alert('Action Failed', e?.message || 'Could not complete the schedule.');
    } finally {
      setCompleteBusy(false);
    }
  };

  const handleSkip = async () => {
    if (!onSkipFeeding) return;
    setSkipBusy(true);
    try {
      await onSkipFeeding(rowId(row));
    } catch (e: any) {
      Alert.alert('Action Failed', e?.message || 'Could not skip the schedule.');
    } finally {
      setSkipBusy(false);
    }
  };

  const busy = completeBusy || skipBusy;

  const iconColor = isPremium ? '#184F2E' : '#2E7D32';
  const iconBg = isPremium ? 'rgba(212, 160, 23, 0.08)' : 'rgba(46, 125, 50, 0.06)';

  return (
    <View style={[homePillCard.card, { borderWidth: 1, borderColor: cardBorderColor }]}>
      {isDone ? (
        <ColorIconBadge color={iconColor} completed size={44} iconSize={24} shape="circle" />
      ) : (
        <ColorIconBadge
          color={iconColor}
          backgroundColor={iconBg}
          materialIcon={rowIcon(row)}
          size={44}
          iconSize={22}
        />
      )}
      <View style={styles.textBlock}>
        <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
          {rowTitle(row)}
        </AppText>
        <AppText variant="caption" color={HomeTheme.textMuted}>
          {rowSubtitle(row)}
        </AppText>
      </View>
      {isDone ? (
        <View style={styles.checks}>
          <Ionicons name="checkmark" size={16} color={HomeTheme.cardGreen} />
          <Ionicons name="checkmark" size={16} color={HomeTheme.cardGreen} style={styles.checkOverlap} />
        </View>
      ) : isSkipped ? (
        <AppText variant="caption" weight="600" color={HomeTheme.textMuted}>
          Skipped
        </AppText>
      ) : row.kind === 'feeding' && (onComplete || onSkipFeeding) ? (
        <View style={styles.actionRow}>
          {onSkipFeeding ? (
            <TouchableOpacity
              style={styles.skipBtn}
              activeOpacity={0.85}
              disabled={busy}
              onPress={handleSkip}
            >
              {skipBusy ? (
                <ActivityIndicator size="small" color="#7A869A" />
              ) : (
                <AppText variant="caption" weight="800" color="#7A869A">
                  Skip
                </AppText>
              )}
            </TouchableOpacity>
          ) : null}
          {onComplete ? (
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: isPremium ? '#D4A017' : '#3A8F3B', borderColor: isPremium ? '#D4A017' : '#3A8F3B' }]}
              activeOpacity={0.85}
              disabled={busy}
              onPress={handleComplete}
            >
              {completeBusy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <AppText variant="caption" weight="800" color="#FFFFFF">
                  Done
                </AppText>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      ) : row.kind === 'grooming' && (onManageGrooming || onComplete) ? (
        <View style={styles.actionRow}>
          {onManageGrooming ? (
            <TouchableOpacity
              style={styles.skipBtn}
              activeOpacity={0.85}
              onPress={() => onManageGrooming(rowId(row))}
            >
              <Ionicons name="settings-outline" size={16} color="#7A869A" />
            </TouchableOpacity>
          ) : null}
          {onComplete ? (
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: isPremium ? '#D4A017' : '#3A8F3B', borderColor: isPremium ? '#D4A017' : '#3A8F3B' }]}
              activeOpacity={0.85}
              disabled={busy}
              onPress={handleComplete}
            >
              {completeBusy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <AppText variant="caption" weight="800" color="#FFFFFF">
                  Done
                </AppText>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      ) : onComplete ? (
        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: isPremium ? '#D4A017' : '#3A8F3B', borderColor: isPremium ? '#D4A017' : '#3A8F3B' }]}
          activeOpacity={0.85}
          disabled={busy}
          onPress={handleComplete}
        >
          {completeBusy ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <AppText variant="caption" weight="800" color="#FFFFFF">
              Done
            </AppText>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

function parseDateString(str: string | undefined | null): Date | null {
  if (!str) return null;
  const parts = str.split('T')[0].split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const date = new Date(y, m, d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isScheduleActiveToday(row: ScheduleRow): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const item = row.item as any;

  // 1. Explicit single date check
  const explicitDateStr = item.date || item.scheduleDate || item.metadata?.dueDate || item.metadata?.scheduledDate;
  const explicitDate = parseDateString(explicitDateStr);
  
  if (explicitDate) {
    return explicitDate.getTime() === today.getTime();
  }

  // 2. Date Range check
  const startDate = parseDateString(item.startDate);
  const endDate = parseDateString(item.endDate);

  if (startDate && today.getTime() < startDate.getTime()) {
    return false;
  }

  if (endDate && today.getTime() > endDate.getTime()) {
    return false;
  }

  // 3. Days of Week check (for Medicine, or if other items have it)
  const meta = item.metadata;
  if (meta && 'daysOfWeek' in meta && Array.isArray(meta.daysOfWeek) && meta.daysOfWeek.length > 0) {
    const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const todayDayCode = DAY_CODES[today.getDay()];
    if (!meta.daysOfWeek.includes(todayDayCode)) {
      return false;
    }
  }

  return true;
}

export function TodaysScheduleSection({
  feedingSchedules,
  walkSchedules = [],
  medicineSchedules = [],
  groomingRecords = [],
  vaccinationSchedules = [],
  loading = false,
  onCompleteFeeding,
  onSkipFeeding,
  onCompleteWalk,
  onCompleteMedicine,
  onCompleteGrooming,
  onManageGrooming,
  onCompleteVaccination,
  isPremium = false,
}: TodaysScheduleSectionProps) {
  const items = useMemo(
    () =>
      mergeScheduleRows(
        feedingSchedules,
        walkSchedules,
        medicineSchedules,
        groomingRecords,
        vaccinationSchedules,
      ).filter((row) => !rowIsDone(row) && !rowIsSkipped(row) && isScheduleActiveToday(row)),
    [feedingSchedules, walkSchedules, medicineSchedules, groomingRecords, vaccinationSchedules],
  );

  const cardBorderColor = isPremium
    ? 'rgba(212, 160, 23, 0.35)'  // Gold trim for premium
    : 'rgba(46, 125, 50, 0.12)';  // Soft green border

  return (
    <View style={styles.section}>
      <SectionHeader title="Today's Schedule" actionLabel="SEE ALL" onActionPress={() => {}} />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color={HomeTheme.green} />
        </View>
      ) : items.length === 0 ? (
        <View style={[homePillCard.card, styles.emptyCard, { borderWidth: 1, borderColor: cardBorderColor }]}>
          <AppText variant="bodySmall" color={HomeTheme.textMuted}>
            No schedules yet. Use Quick Actions to add one.
          </AppText>
        </View>
      ) : (
        items.map((row) => (
          <ScheduleRowCard
            key={`${row.kind}-${rowId(row)}`}
            row={row}
            onCompleteFeeding={onCompleteFeeding}
            onSkipFeeding={onSkipFeeding}
            onCompleteWalk={onCompleteWalk}
            onCompleteMedicine={onCompleteMedicine}
            onCompleteGrooming={onCompleteGrooming}
            onManageGrooming={onManageGrooming}
            onCompleteVaccination={onCompleteVaccination}
            isPremium={isPremium}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.md,
  },
  loader: {
    marginVertical: Spacing.md,
  },
  emptyCard: {
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    marginLeft: Spacing.sm,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    alignSelf: 'center',
  },
  checks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkOverlap: {
    marginLeft: -8,
  },
  doneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 58,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(122, 134, 154, 0.05)',
    borderColor: 'rgba(122, 134, 154, 0.15)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
});
