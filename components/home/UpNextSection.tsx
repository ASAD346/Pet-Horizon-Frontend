import React, { useMemo } from 'react';
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
import type { FeedingScheduleItem } from '@/types/feeding';
import type { GroomingRecord } from '@/types/grooming';
import type { MedicineScheduleItem } from '@/types/medicine';
import type { WalkScheduleItem } from '@/types/walk';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';

type PendingRow =
  | { kind: 'feeding'; item: FeedingScheduleItem }
  | { kind: 'walk'; item: WalkScheduleItem }
  | { kind: 'medicine'; item: MedicineScheduleItem }
  | { kind: 'grooming'; item: GroomingRecord };

interface UpNextSectionProps {
  feedingSchedules: FeedingScheduleItem[];
  walkSchedules?: WalkScheduleItem[];
  medicineSchedules?: MedicineScheduleItem[];
  groomingRecords?: GroomingRecord[];
  loading?: boolean;
  feedingActionId?: string | null;
  walkActionId?: string | null;
  medicineActionId?: string | null;
  groomingActionId?: string | null;
  onLogFeeding?: (scheduleId: string) => void;
  onLogWalk?: (scheduleId: string) => void;
  onLogMedicine?: (scheduleId: string) => void;
  onLogGrooming?: (recordId: string) => void;
}

function rowSortKey(row: PendingRow): number {
  if (row.kind === 'grooming') return groomingSortKey(row.item);
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
): PendingRow[] {
  const rows: PendingRow[] = [
    ...pendingFeedingSchedules(feedingSchedules).map((item) => ({ kind: 'feeding' as const, item })),
    ...pendingWalkSchedules(walkSchedules).map((item) => ({ kind: 'walk' as const, item })),
    ...pendingMedicineSchedules(medicineSchedules).map((item) => ({ kind: 'medicine' as const, item })),
    ...pendingGroomingRecords(groomingRecords).map((item) => ({ kind: 'grooming' as const, item })),
  ];
  return rows.sort((a, b) => rowSortKey(a) - rowSortKey(b));
}

function rowColors(row: PendingRow) {
  if (row.kind === 'feeding') return feedingScheduleColors(row.item);
  if (row.kind === 'walk') return walkScheduleColors(row.item);
  if (row.kind === 'medicine') return medicineScheduleColors();
  return groomingRecordColors();
}

function rowTitle(row: PendingRow) {
  if (row.kind === 'feeding') return feedingScheduleTitle(row.item);
  if (row.kind === 'walk') return walkScheduleTitle(row.item);
  if (row.kind === 'medicine') return medicineScheduleTitle(row.item);
  return groomingRecordTitle(row.item);
}

function rowCaption(row: PendingRow) {
  if (row.kind === 'grooming') {
    if (row.item.scheduledDate) {
      return formatDateLabel(new Date(row.item.scheduledDate));
    }
    return 'No date set';
  }
  return formatTimeHHmmDisplay(row.item.timeOfDay);
}

function rowIcon(row: PendingRow): 'silverware-fork-knife' | 'walk' | 'pill' | 'content-cut' {
  if (row.kind === 'feeding') return 'silverware-fork-knife';
  if (row.kind === 'walk') return 'walk';
  if (row.kind === 'medicine') return 'pill';
  return 'content-cut';
}

function rowLogBtnStyle(row: PendingRow) {
  if (row.kind === 'feeding') return styles.logBtn;
  if (row.kind === 'walk') return [styles.logBtn, styles.logBtnWalk];
  if (row.kind === 'medicine') return [styles.logBtn, styles.logBtnMedicine];
  return [styles.logBtn, styles.logBtnGrooming];
}

function rowOnLog(
  row: PendingRow,
  onLogFeeding?: (id: string) => void,
  onLogWalk?: (id: string) => void,
  onLogMedicine?: (id: string) => void,
  onLogGrooming?: (id: string) => void,
) {
  if (row.kind === 'feeding') return onLogFeeding;
  if (row.kind === 'walk') return onLogWalk;
  if (row.kind === 'medicine') return onLogMedicine;
  return onLogGrooming;
}

function rowBusy(
  row: PendingRow,
  feedingActionId: string | null,
  walkActionId: string | null,
  medicineActionId: string | null,
  groomingActionId: string | null,
) {
  const id = row.item._id;
  if (row.kind === 'feeding') return feedingActionId === id;
  if (row.kind === 'walk') return walkActionId === id;
  if (row.kind === 'medicine') return medicineActionId === id;
  return groomingActionId === id;
}

export function UpNextSection({
  feedingSchedules,
  walkSchedules = [],
  medicineSchedules = [],
  groomingRecords = [],
  loading = false,
  feedingActionId = null,
  walkActionId = null,
  medicineActionId = null,
  groomingActionId = null,
  onLogFeeding,
  onLogWalk,
  onLogMedicine,
  onLogGrooming,
}: UpNextSectionProps) {
  const pending = useMemo(
    () => mergePendingRows(feedingSchedules, walkSchedules, medicineSchedules, groomingRecords),
    [feedingSchedules, walkSchedules, medicineSchedules, groomingRecords],
  );

  if (loading) {
    return (
      <View style={styles.section}>
        <SectionHeader title="Up Next" />
        <ActivityIndicator color={HomeTheme.green} style={styles.loader} />
      </View>
    );
  }

  if (pending.length === 0) {
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
        {pending.map((row) => {
          const colors = rowColors(row);
          const busy = rowBusy(
            row,
            feedingActionId,
            walkActionId,
            medicineActionId,
            groomingActionId,
          );
          const onLog = rowOnLog(row, onLogFeeding, onLogWalk, onLogMedicine, onLogGrooming);

          return (
            <View key={`${row.kind}-${row.item._id}`} style={[homePillCard.card, styles.card]}>
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
              <TouchableOpacity
                style={rowLogBtnStyle(row)}
                activeOpacity={0.85}
                disabled={busy || !onLog}
                onPress={() => onLog?.(row.item._id)}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={HomeTheme.white} />
                ) : (
                  <AppText variant="caption" weight="800" color={HomeTheme.white}>
                    LOG
                  </AppText>
                )}
              </TouchableOpacity>
            </View>
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
    gap: Spacing.sm,
  },
  card: {
    width: 260,
    marginBottom: 0,
    marginRight: Spacing.sm,
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
});
