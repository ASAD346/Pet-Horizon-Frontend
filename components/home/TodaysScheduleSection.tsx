import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
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
import { HomeTheme, Spacing } from '../../constants/theme';

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
  onCompleteFeeding?: (scheduleId: string) => void;
  onSkipFeeding?: (scheduleId: string) => void;
  onCompleteWalk?: (scheduleId: string) => void;
  onCompleteMedicine?: (scheduleId: string) => void;
  onCompleteGrooming?: (recordId: string) => void;
  onManageGrooming?: (recordId: string) => void;
  onCompleteVaccination?: (scheduleId: string) => void;
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
  if (row.kind === 'vaccination') return row.item.isActive === false;
  return row.item.status === 'done';
}

function rowIsSkipped(row: ScheduleRow) {
  if (row.kind === 'grooming' || row.kind === 'vaccination') return false;
  return row.item.status === 'skipped';
}

function rowId(row: ScheduleRow) {
  return row.item._id;
}

function rowActionId(
  row: ScheduleRow,
  feedingActionId: string | null,
  walkActionId: string | null,
  medicineActionId: string | null,
  groomingActionId: string | null,
  vaccinationActionId: string | null,
) {
  const id = rowId(row);
  if (row.kind === 'feeding') return feedingActionId === id;
  if (row.kind === 'walk') return walkActionId === id;
  if (row.kind === 'medicine') return medicineActionId === id;
  if (row.kind === 'vaccination') return vaccinationActionId === id;
  return groomingActionId === id;
}

function rowOnComplete(
  row: ScheduleRow,
  onCompleteFeeding?: (id: string) => void,
  onCompleteWalk?: (id: string) => void,
  onCompleteMedicine?: (id: string) => void,
  onCompleteGrooming?: (id: string) => void,
  onCompleteVaccination?: (id: string) => void,
) {
  if (row.kind === 'feeding') return onCompleteFeeding;
  if (row.kind === 'walk') return onCompleteWalk;
  if (row.kind === 'medicine') return onCompleteMedicine;
  if (row.kind === 'vaccination') return onCompleteVaccination;
  return onCompleteGrooming;
}

export function TodaysScheduleSection({
  feedingSchedules,
  walkSchedules = [],
  medicineSchedules = [],
  groomingRecords = [],
  vaccinationSchedules = [],
  loading = false,
  feedingActionId = null,
  walkActionId = null,
  medicineActionId = null,
  groomingActionId = null,
  vaccinationActionId = null,
  onCompleteFeeding,
  onSkipFeeding,
  onCompleteWalk,
  onCompleteMedicine,
  onCompleteGrooming,
  onManageGrooming,
  onCompleteVaccination,
}: TodaysScheduleSectionProps) {
  const items = useMemo(
    () =>
      mergeScheduleRows(
        feedingSchedules,
        walkSchedules,
        medicineSchedules,
        groomingRecords,
        vaccinationSchedules,
      ),
    [feedingSchedules, walkSchedules, medicineSchedules, groomingRecords, vaccinationSchedules],
  );

  return (
    <View style={styles.section}>
      <SectionHeader title="Today's Schedule" actionLabel="SEE ALL" onActionPress={() => {}} />

      {loading ? (
        <View style={[homePillCard.card, styles.emptyCard]}>
          <ActivityIndicator size="small" color="#5CB35D" style={{ marginRight: Spacing.sm }} />
          <AppText variant="bodySmall" color={HomeTheme.textMuted}>
            Loading schedules…
          </AppText>
        </View>
      ) : items.length === 0 ? (
        <View style={[homePillCard.card, styles.emptyCard]}>
          <AppText variant="bodySmall" color={HomeTheme.textMuted}>
            No schedules yet. Use Quick Actions to add one.
          </AppText>
        </View>
      ) : (
        items.map((row) => {
          const isDone = rowIsDone(row);
          const isSkipped = rowIsSkipped(row);
          const colors = rowColors(row);
          const busy = rowActionId(
            row,
            feedingActionId,
            walkActionId,
            medicineActionId,
            groomingActionId,
            vaccinationActionId,
          );
          const onComplete = rowOnComplete(
            row,
            onCompleteFeeding,
            onCompleteWalk,
            onCompleteMedicine,
            onCompleteGrooming,
            onCompleteVaccination,
          );

          return (
            <View key={`${row.kind}-${rowId(row)}`} style={homePillCard.card}>
              {isDone ? (
                <ColorIconBadge color={colors.color} completed size={44} iconSize={24} shape="circle" />
              ) : (
                <ColorIconBadge
                  color={colors.color}
                  backgroundColor={colors.bg}
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
                      onPress={() => onSkipFeeding(rowId(row))}
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color={HomeTheme.textMuted} />
                      ) : (
                        <AppText variant="caption" weight="600" color={HomeTheme.textMuted}>
                          Skip
                        </AppText>
                      )}
                    </TouchableOpacity>
                  ) : null}
                  {onComplete ? (
                    <TouchableOpacity
                      style={styles.doneBtn}
                      activeOpacity={0.85}
                      disabled={busy}
                      onPress={() => onComplete(rowId(row))}
                    >
                      <AppText variant="caption" weight="600" color="#8FAF8F">
                        Done
                      </AppText>
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
                      <Ionicons name="settings-outline" size={16} color={HomeTheme.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                  {onComplete ? (
                    <TouchableOpacity
                      style={styles.doneBtn}
                      activeOpacity={0.85}
                      disabled={busy}
                      onPress={() => onComplete(rowId(row))}
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color={HomeTheme.cardGreen} />
                      ) : (
                        <AppText variant="caption" weight="600" color="#8FAF8F">
                          Done
                        </AppText>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : onComplete ? (
                <TouchableOpacity
                  style={styles.doneBtn}
                  activeOpacity={0.85}
                  disabled={busy}
                  onPress={() => onComplete(rowId(row))}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color={HomeTheme.cardGreen} />
                  ) : (
                    <AppText variant="caption" weight="600" color="#8FAF8F">
                      Done
                    </AppText>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
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
  checks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkOverlap: {
    marginLeft: -8,
  },
  doneBtn: {
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  skipBtn: {
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
