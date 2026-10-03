import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { formatTimeHHmmDisplay, formatUnitLabel, getMealTypeLabel, dateToTimeHHmm } from '@/lib/feeding/feedingForm';
import { feedingScheduleTitle } from '@/lib/feeding/feedingDisplay';
import { walkScheduleTitle } from '@/lib/walk/walkDisplay';
import { getWalkTimeLabel } from '@/lib/walk/walkForm';
import { medicineScheduleTitle } from '@/lib/medicine/medicineDisplay';
import { getFrequencyLabel } from '@/lib/medicine/medicineForm';
import { groomingRecordTitle } from '@/lib/grooming/groomingDisplay';
import { groomingTypeLabel, formatDateLabel } from '@/lib/grooming/groomingForm';
import { vaccinationScheduleTitle } from '@/lib/vaccination/vaccinationDisplay';
import { recurrenceIntervalLabel, reminderFrequencyLabel } from '@/lib/vaccination/vaccinationForm';
import { formatScheduleDateSummary } from '@/lib/schedule/scheduleDate';
import { parseSafeDate } from '@/lib/timezone';
import { getTaskDisplayName } from '@/src/utils/taskMappings';
import {
  isScheduleDoneForDate,
  isScheduleSkippedForDate,
} from '@/lib/schedule/scheduleRecurrence';
import type { FeedingScheduleItem } from '@/types/feeding';
import type { GroomingRecord } from '@/types/grooming';
import type { MedicineScheduleItem } from '@/types/medicine';
import type { VaccinationScheduleItem } from '@/types/vaccination';
import type { WalkScheduleItem } from '@/types/walk';
import { useActiveWalk } from '@/context/ActiveWalkContext';
import { useAppSelector } from '@/redux/store';
import { selectActivePetId } from '@/redux/reducer';

export type ScheduleDetailRow =
  | { kind: 'feeding'; item: FeedingScheduleItem }
  | { kind: 'walk'; item: WalkScheduleItem }
  | { kind: 'medicine'; item: MedicineScheduleItem }
  | { kind: 'grooming'; item: GroomingRecord }
  | { kind: 'vaccination'; item: VaccinationScheduleItem };

interface ScheduleDetailSheetProps {
  visible: boolean;
  row: ScheduleDetailRow | null;
  onClose: () => void;
  onComplete?: (id: string, elapsedMinutes?: number) => void | Promise<void>;
  onSkip?: (id: string) => void | Promise<void>;
  showActions?: boolean;
  isPremium?: boolean;
  /** Current logged-in user's id — forwarded to WalkTimer for multi-user sessions */
  currentUserId?: string;
  /** Auth token — forwarded to WalkTimer so it can persist walk sessions */
  token?: string;
}

const KIND_METADATA: Record<
  string,
  {
    label: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    color: string;
    bg: string;
    border: string;
  }
> = {
  feeding: {
    label: 'Feeding Schedule',
    icon: 'silverware-fork-knife',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
  },
  walk: {
    label: 'Walk Schedule',
    icon: 'paw',
    color: '#2563EB',
    bg: '#DBEAFE',
    border: '#BFDBFE',
  },
  medicine: {
    label: 'Medicine Schedule',
    icon: 'pill',
    color: '#9333EA',
    bg: '#F3E8FF',
    border: '#E9D5FF',
  },
  grooming: {
    label: 'Grooming Schedule',
    icon: 'content-cut',
    color: '#0D9488',
    bg: '#CCFBF1',
    border: '#99F6E4',
  },
  vaccination: {
    label: 'Vaccination Schedule',
    icon: 'needle',
    color: '#DB2777',
    bg: '#FCE7F3',
    border: '#FBCFE8',
  },
};

const DAY_LABELS: Record<string, string> = {
  MO: 'Mon',
  TU: 'Tue',
  WE: 'Wed',
  TH: 'Thu',
  FR: 'Fri',
  SA: 'Sat',
  SU: 'Sun',
};

const DOSE_FORM_LABELS: Record<string, string> = {
  tablet: 'Tablet',
  syrup: 'Syrup',
  drops: 'Drops',
  injection: 'Injection',
  cream: 'Cream',
  chewable: 'Chewable',
  other: 'Other',
};

function resolveScheduleDateLabel(item: any): string | null {
  if (item.scheduleDate) {
    if (typeof item.scheduleDate === 'object' && item.scheduleDate.mode) {
      return formatScheduleDateSummary(item.scheduleDate);
    }
    if (typeof item.scheduleDate === 'string') {
      const d = parseSafeDate(item.scheduleDate);
      if (d && !isNaN(d.getTime())) return formatDateLabel(d);
    }
  }
  if (item.startDate && item.endDate) {
    const start = parseSafeDate(item.startDate);
    const end = parseSafeDate(item.endDate);
    if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      return `${formatDateLabel(start)} – ${formatDateLabel(end)}`;
    }
  }
  if (item.startDate) {
    const start = parseSafeDate(item.startDate);
    if (start && !isNaN(start.getTime())) {
      return `From ${formatDateLabel(start)}`;
    }
  }
  if (item.date) {
    const d = parseSafeDate(item.date);
    if (d && !isNaN(d.getTime())) return formatDateLabel(d);
  }
  if (item.scheduledDate) {
    const d = parseSafeDate(item.scheduledDate);
    if (d && !isNaN(d.getTime())) return formatDateLabel(d);
  }
  if (item.metadata?.dueDate) {
    const d = parseSafeDate(item.metadata.dueDate);
    if (d && !isNaN(d.getTime())) return formatDateLabel(d);
  }
  return null;
}

function resolveTimeOfDay(item: any): string | null {
  const raw =
    item.timeOfDay ||
    item.time ||
    item.metadata?.time ||
    (item.feedingTime instanceof Date ? dateToTimeHHmm(item.feedingTime) : '') ||
    (item.walkClockTime instanceof Date ? dateToTimeHHmm(item.walkClockTime) : '') ||
    (item.medicineTime instanceof Date ? dateToTimeHHmm(item.medicineTime) : '') ||
    (item.reminderTime instanceof Date ? dateToTimeHHmm(item.reminderTime) : typeof item.reminderTime === 'string' ? item.reminderTime : '') ||
    (typeof item.metadata?.reminderTime === 'string' ? item.metadata.reminderTime : '');

  if (raw && typeof raw === 'string' && raw.trim()) {
    return formatTimeHHmmDisplay(raw.trim());
  }
  return null;
}

function resolveReminderLabel(item: any, kind: string): string | null {
  const meta = item.metadata || {};
  const isEnabled =
    meta.reminder === true ||
    item.reminder === true ||
    item.notificationsOn === true ||
    item.reminderOn === true ||
    item.reminderEnabled === true ||
    meta.reminderEnabled === true;

  if (kind === 'vaccination') {
    const freq = meta.frequency || item.frequency;
    const time = meta.reminderTime || item.reminderTime;
    const timeFormatted = time ? (time instanceof Date ? dateToTimeHHmm(time) : formatTimeHHmmDisplay(String(time))) : '';
    if (freq) {
      const freqLabel = reminderFrequencyLabel(String(freq));
      return timeFormatted ? `${freqLabel} at ${timeFormatted}` : freqLabel;
    }
    if (isEnabled) return timeFormatted ? `At ${timeFormatted}` : 'Enabled';
    if (meta.reminder === false || item.reminder === false) return 'Off';
    return null;
  }

  if (
    meta.reminder === false ||
    item.reminder === false ||
    item.notificationsOn === false ||
    item.reminderOn === false ||
    item.reminderEnabled === false
  ) {
    return 'Off';
  }

  const mins = meta.reminderMinutes ?? item.reminderMinutes;
  const time = meta.reminderTime ?? item.reminderTime;

  if (mins !== undefined && mins !== null && mins !== '') {
    const numMins = Number(mins);
    if (numMins === 0) return 'At scheduled time';
    if (numMins > 0) return `${numMins} mins before`;
  }

  if (time) {
    const timeStr = time instanceof Date ? dateToTimeHHmm(time) : String(time);
    return `At ${formatTimeHHmmDisplay(timeStr)}`;
  }

  if (isEnabled) return 'Enabled';
  return null;
}

function getRowTitle(row: ScheduleDetailRow): string {
  if (row.kind === 'feeding') return feedingScheduleTitle(row.item);
  if (row.kind === 'walk') return walkScheduleTitle(row.item);
  if (row.kind === 'medicine') return medicineScheduleTitle(row.item);
  if (row.kind === 'grooming') return groomingRecordTitle(row.item);
  if (row.kind === 'vaccination') return vaccinationScheduleTitle(row.item);
  return 'Schedule Task';
}

export function ScheduleDetailSheet({
  visible,
  row,
  onClose,
  onComplete,
  onSkip,
  showActions = true,
  isPremium = false,
  currentUserId,
  token,
}: ScheduleDetailSheetProps) {
  const activePetId = useAppSelector(selectActivePetId);
  const { activeWalk, startWalk, stopWalk } = useActiveWalk();
  const insets = useSafeAreaInsets();
  const [completeBusy, setCompleteBusy] = useState(false);
  const [skipBusy, setSkipBusy] = useState(false);

  // ── Walk-specific timer state ────────────────────────────────────────────────
  const [walkElapsedSeconds, setWalkElapsedSeconds] = useState(0);
  const [walkBusy, setWalkBusy] = useState(false);
  const walkBusyRef = useRef(false);
  const walkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const walkHandleCompleteRef = useRef<() => Promise<void>>(async () => {});

  const walkItem = row?.kind === 'walk' ? row.item : null;
  const walkTargetDuration: number = walkItem
    ? ((walkItem as any).duration ?? walkItem.metadata?.duration ?? 30)
    : 30;
  const walkStartedAt =
    activeWalk && walkItem && activeWalk.scheduleId === walkItem._id
      ? activeWalk.startedAt
      : null;

  useEffect(() => {
    if (walkStartedAt !== null) {
      walkTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - walkStartedAt) / 1000);
        setWalkElapsedSeconds(elapsed);
        if (elapsed >= walkTargetDuration * 60 && !walkBusyRef.current) {
          clearInterval(walkTimerRef.current!);
          walkTimerRef.current = null;
          void walkHandleCompleteRef.current();
        }
      }, 1000);
    } else {
      if (walkTimerRef.current) clearInterval(walkTimerRef.current);
      setWalkElapsedSeconds(0);
    }
    return () => { if (walkTimerRef.current) clearInterval(walkTimerRef.current); };
  }, [walkStartedAt, walkTargetDuration]);

  if (!row) return null;

  const meta = KIND_METADATA[row.kind] || {
    label: 'Schedule Task',
    icon: 'calendar-check',
    color: '#2E7D32',
    bg: '#E8F5E9',
    border: '#C8E6C9',
  };

  const item = row.item as any;
  const isDone = isScheduleDoneForDate(item, new Date(), row.kind);
  const isSkipped = isScheduleSkippedForDate(item, new Date(), row.kind);

  const title = getRowTitle(row);

  const handleComplete = async () => {
    if (!onComplete || completeBusy || skipBusy) return;
    setCompleteBusy(true);
    try {
      await onComplete(item._id);
      onClose();
    } catch {
      // Error handled in parent
    } finally {
      setCompleteBusy(false);
    }
  };

  const handleSkip = async () => {
    if (!onSkip || completeBusy || skipBusy) return;
    setSkipBusy(true);
    try {
      await onSkip(item._id);
      onClose();
    } catch {
      // Error handled in parent
    } finally {
      setSkipBusy(false);
    }
  };

  // ── Walk handlers ────────────────────────────────────────────────────────────
  const handleWalkStart = async () => {
    if (!walkItem) return;
    await startWalk(walkItem._id, activePetId || '', walkTargetDuration, 'Walk', token);
  };

  const handleWalkComplete = async () => {
    if (walkBusyRef.current || !walkItem) return;
    walkBusyRef.current = true;
    setWalkBusy(true);
    const finalSeconds = walkElapsedSeconds;
    await stopWalk();
    if (walkTimerRef.current) { clearInterval(walkTimerRef.current); walkTimerRef.current = null; }
    try {
      const minutes = Math.max(1, Math.round(finalSeconds / 60));
      if (onComplete) await onComplete(walkItem._id, minutes);
      onClose();
    } catch (_) {
    } finally {
      walkBusyRef.current = false;
      setWalkBusy(false);
    }
  };
  walkHandleCompleteRef.current = handleWalkComplete;

  const handleWalkSkip = async () => {
    if (walkBusyRef.current || !walkItem) return;
    walkBusyRef.current = true;
    setWalkBusy(true);
    try {
      if (onSkip) await onSkip(walkItem._id);
      onClose();
    } catch (_) {
    } finally {
      walkBusyRef.current = false;
      setWalkBusy(false);
    }
  };

  const formatWalkTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderDetailFields = () => {
    const fields: { label: string; value: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [];
    const itemMeta = item.metadata || {};

    // ── Feeding specifics ───────────────────────────────────────────────────
    if (row.kind === 'feeding') {
      const mealType = itemMeta.mealType || item.mealType;
      if (mealType) {
        fields.push({
          label: 'Meal Type',
          value: getTaskDisplayName(mealType) || getMealTypeLabel(mealType),
          icon: 'fast-food-outline',
        });
      }

      const time = resolveTimeOfDay(item);
      if (time) {
        fields.push({
          label: 'Scheduled Time',
          value: time,
          icon: 'time-outline',
        });
      }

      const amount = itemMeta.amount ?? item.amount;
      const unit = itemMeta.unit ?? item.unit;
      if (amount) {
        const num = parseFloat(String(amount));
        let uLabel = unit ? formatUnitLabel(String(unit)) : '';
        if (uLabel.toLowerCase() === 'cup' && num > 1) {
          uLabel = 'cups';
        }
        fields.push({
          label: 'Portion',
          value: `${amount} ${uLabel}`.trim(),
          icon: 'scale-outline',
        });
      }

      const foodType = itemMeta.foodType || item.foodType;
      if (foodType) {
        fields.push({
          label: 'Food Type',
          value: foodType.charAt(0).toUpperCase() + foodType.slice(1),
          icon: 'nutrition-outline',
        });
      }

      const brand = itemMeta.foodBrand || item.foodBrand;
      if (brand) {
        fields.push({
          label: 'Brand',
          value: brand,
          icon: 'pricetag-outline',
        });
      }

      const dateSummary = resolveScheduleDateLabel(item) || 'Daily / Recurring';
      fields.push({
        label: 'Schedule Period',
        value: dateSummary,
        icon: 'calendar-outline',
      });

      const reminder = resolveReminderLabel(item, 'feeding');
      if (reminder) {
        fields.push({
          label: 'Reminder',
          value: reminder,
          icon: 'notifications-outline',
        });
      }
    }

    // ── Walk specifics ──────────────────────────────────────────────────────
    if (row.kind === 'walk') {
      const walkTime = itemMeta.walkTime || item.walkTime;
      if (walkTime) {
        fields.push({
          label: 'Time Slot',
          value: getWalkTimeLabel(walkTime),
          icon: 'sunny-outline',
        });
      }

      const time = resolveTimeOfDay(item);
      if (time) {
        fields.push({
          label: 'Scheduled Time',
          value: time,
          icon: 'time-outline',
        });
      }

      const duration = itemMeta.duration ?? item.duration;
      if (duration) {
        fields.push({
          label: 'Target Duration',
          value: `${duration} mins`,
          icon: 'stopwatch-outline',
        });
      }

      const dateSummary = resolveScheduleDateLabel(item) || 'Daily / Recurring';
      fields.push({
        label: 'Schedule Period',
        value: dateSummary,
        icon: 'calendar-outline',
      });

      const reminder = resolveReminderLabel(item, 'walk');
      if (reminder) {
        fields.push({
          label: 'Reminder',
          value: reminder,
          icon: 'notifications-outline',
        });
      }
    }

    // ── Medicine specifics ──────────────────────────────────────────────────
    if (row.kind === 'medicine') {
      const name = itemMeta.medicineName || item.medicineName || (item.title ? item.title.split(' - ')[0] : '');
      if (name) {
        fields.push({
          label: 'Medicine',
          value: name,
          icon: 'medkit-outline',
        });
      }

      const rawDose = itemMeta.dose || item.dose;
      const doseAmount = itemMeta.doseAmount || item.doseAmount;
      const doseForm = itemMeta.doseForm || item.doseForm;
      const formLabel = doseForm ? (DOSE_FORM_LABELS[String(doseForm).toLowerCase()] || String(doseForm)) : '';
      const doseVal = rawDose || (doseAmount ? `${doseAmount} ${formLabel}`.trim() : '');

      if (doseVal) {
        fields.push({
          label: 'Dose',
          value: doseVal,
          icon: 'flask-outline',
        });
      }

      if (formLabel) {
        fields.push({
          label: 'Dose Form',
          value: formLabel,
          icon: 'fitness-outline',
        });
      }

      const time = resolveTimeOfDay(item);
      if (time) {
        fields.push({
          label: 'Scheduled Time',
          value: time,
          icon: 'time-outline',
        });
      }

      const freq = itemMeta.frequency || item.frequency;
      if (freq) {
        fields.push({
          label: 'Frequency',
          value: getFrequencyLabel(freq),
          icon: 'repeat-outline',
        });
      }

      const days = itemMeta.daysOfWeek || item.daysOfWeek;
      if (Array.isArray(days) && days.length > 0) {
        const daysStr = days.map((d: string) => DAY_LABELS[d] || d).join(', ');
        fields.push({
          label: 'Days of Week',
          value: daysStr,
          icon: 'calendar-number-outline',
        });
      }

      const remaining = itemMeta.remainingPills ?? item.remainingPills;
      const total = itemMeta.totalPills ?? item.totalPills;
      if (remaining !== undefined && remaining !== null && remaining !== '') {
        const stockStr = `${remaining}${total && String(total) !== String(remaining) ? ` / ${total}` : ''} pills left`;
        fields.push({
          label: 'Medication Supply',
          value: stockStr,
          icon: 'cube-outline',
        });
      }

      const dateSummary = resolveScheduleDateLabel(item) || 'Daily / Recurring';
      fields.push({
        label: 'Schedule Period',
        value: dateSummary,
        icon: 'calendar-outline',
      });

      const reminder = resolveReminderLabel(item, 'medicine');
      if (reminder) {
        fields.push({
          label: 'Reminder',
          value: reminder,
          icon: 'notifications-outline',
        });
      }
    }

    // ── Grooming specifics ──────────────────────────────────────────────────
    if (row.kind === 'grooming') {
      const gType = item.groomingType || item.type || itemMeta.groomingType;
      if (gType) {
        fields.push({
          label: 'Grooming Type',
          value: groomingTypeLabel(gType),
          icon: 'cut-outline',
        });
      }

      const scheduledDate = resolveScheduleDateLabel(item);
      if (scheduledDate) {
        fields.push({
          label: 'Scheduled Date',
          value: scheduledDate,
          icon: 'calendar-outline',
        });
      }

      if (item.remainingDays !== null && item.remainingDays !== undefined) {
        let statusVal = '';
        if (item.remainingDays === 0) statusVal = 'Due Today';
        else if (item.remainingDays < 0) statusVal = `Overdue by ${Math.abs(item.remainingDays)} day${Math.abs(item.remainingDays) === 1 ? '' : 's'}`;
        else statusVal = `In ${item.remainingDays} day${item.remainingDays === 1 ? '' : 's'}`;
        fields.push({
          label: 'Due Status',
          value: statusVal,
          icon: 'hourglass-outline',
        });
      }

      if (item.nextDueDate) {
        fields.push({
          label: 'Next Due Date',
          value: formatDateLabel(parseSafeDate(item.nextDueDate)),
          icon: 'calendar-number-outline',
        });
      }

      if (item.performedAt) {
        fields.push({
          label: 'Last Performed',
          value: formatDateLabel(parseSafeDate(item.performedAt)),
          icon: 'checkmark-circle-outline',
        });
      }

      const reminder = resolveReminderLabel(item, 'grooming');
      if (reminder) {
        fields.push({
          label: 'Reminder',
          value: reminder,
          icon: 'notifications-outline',
        });
      }
    }

    // ── Vaccination specifics ───────────────────────────────────────────────
    if (row.kind === 'vaccination') {
      const vName = itemMeta.vaccineName || item.vaccineName || item.title;
      if (vName) {
        fields.push({
          label: 'Vaccine',
          value: vName,
          icon: 'shield-checkmark-outline',
        });
      }

      const due = itemMeta.dueDate || item.startDate || item.date || item.scheduleDate;
      if (due) {
        const dueDate = typeof due === 'object' && due.singleDate ? due.singleDate : parseSafeDate(due);
        if (dueDate && !isNaN(dueDate.getTime())) {
          fields.push({
            label: 'Due Date',
            value: formatDateLabel(dueDate),
            icon: 'calendar-outline',
          });
        }
      }

      if (item.remainingDays !== null && item.remainingDays !== undefined) {
        let statusVal = '';
        if (item.remainingDays === 0) statusVal = 'Due Today';
        else if (item.remainingDays < 0) statusVal = `Overdue by ${Math.abs(item.remainingDays)} day${Math.abs(item.remainingDays) === 1 ? '' : 's'}`;
        else statusVal = `In ${item.remainingDays} day${item.remainingDays === 1 ? '' : 's'}`;
        fields.push({
          label: 'Due Status',
          value: statusVal,
          icon: 'hourglass-outline',
        });
      }

      const isRecurring = itemMeta.isRecurring === true || (item as any).isRecurring === true;
      const interval = itemMeta.recurrenceInterval || (item as any).recurrenceInterval;
      if (isRecurring && interval) {
        fields.push({
          label: 'Recurrence',
          value: `Repeats ${recurrenceIntervalLabel(interval)}`,
          icon: 'repeat-outline',
        });
      }

      const reminder = resolveReminderLabel(item, 'vaccination');
      if (reminder) {
        fields.push({
          label: 'Reminder',
          value: reminder,
          icon: 'notifications-outline',
        });
      }

      const vet = itemMeta.vetName || item.vetName;
      if (vet) {
        fields.push({
          label: 'Clinic / Vet',
          value: vet,
          icon: 'business-outline',
        });
      }

      const administered = itemMeta.administeredDate || item.administeredDate;
      if (administered) {
        const adminDate = parseSafeDate(administered);
        if (adminDate && !isNaN(adminDate.getTime())) {
          fields.push({
            label: 'Administered Date',
            value: formatDateLabel(adminDate),
            icon: 'checkmark-circle-outline',
          });
        }
      }
    }

    const notes = item.notes || itemMeta.notes || item.description || itemMeta.instructions || itemMeta.description;

    return (
      <View style={styles.detailContainer}>
        <View style={styles.grid}>
          {fields.map((field, idx) => (
            <View key={idx} style={styles.gridItem}>
              <View style={[styles.gridIconWrap, { backgroundColor: meta.bg }]}>
                <Ionicons name={field.icon} size={16} color={meta.color} />
              </View>
              <View style={styles.gridTextWrap}>
                <AppText style={styles.fieldLabel} weight="600" color="#6B7280">
                  {field.label}
                </AppText>
                <AppText style={styles.fieldValue} weight="700" color="#111827">
                  {field.value}
                </AppText>
              </View>
            </View>
          ))}
        </View>

        {notes ? (
          <View style={styles.notesBox}>
            <View style={styles.notesHeader}>
              <Ionicons name="document-text-outline" size={16} color={meta.color} />
              <AppText style={styles.notesLabel} weight="700" color="#1F2937">
                Notes & Instructions
              </AppText>
            </View>
            <AppText style={styles.notesText} weight="500" color="#4B5563">
              {notes}
            </AppText>
          </View>
        ) : null}
      </View>
    );
  };

  const canSkip = !isDone && !isSkipped && onSkip && (row.kind === 'feeding' || row.kind === 'walk' || row.kind === 'medicine');
  const canComplete = !isDone && onComplete;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Top Pill Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.headerIconBadge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
              <MaterialCommunityIcons name={meta.icon} size={24} color={meta.color} />
            </View>

            <View style={styles.headerTextWrap}>
              <View style={styles.titleRow}>
                <AppText style={styles.headerTitle} weight="800" color="#111827" numberOfLines={1}>
                  {title}
                </AppText>
              </View>

              <View style={styles.metaRow}>
                <AppText style={styles.headerCategory} weight="600" color={meta.color}>
                  {meta.label}
                </AppText>
                <AppText style={styles.metaDot} color="#9CA3AF">·</AppText>
                {/* Status Pill */}
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isDone
                        ? '#DCFCE7'
                        : isSkipped
                        ? '#F3F4F6'
                        : '#FEF3C7',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isDone
                          ? '#16A34A'
                          : isSkipped
                          ? '#6B7280'
                          : '#D97706',
                      },
                    ]}
                  />
                  <AppText
                    style={styles.statusText}
                    weight="700"
                    color={
                      isDone
                        ? '#15803D'
                        : isSkipped
                        ? '#4B5563'
                        : '#B45309'
                    }
                  >
                    {isDone ? 'Done' : isSkipped ? 'Skipped' : 'Pending'}
                  </AppText>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Details */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderDetailFields()}
          </ScrollView>

          {/* Actions */}
          {showActions && row.kind === 'walk' && !isDone && !isSkipped ? (
            // Walk: sheet-styled Start / live-timer / Done
            <View style={styles.footer}>
              {walkStartedAt === null ? (
                // Not started — show Skip + Start Walk
                <>
                  {onSkip ? (
                    <Pressable
                      style={({ pressed }) => [styles.skipBtn, pressed && styles.btnPressed]}
                      disabled={walkBusy}
                      onPress={handleWalkSkip}
                    >
                      <AppText style={styles.skipBtnText} weight="700" color="#4B5563">Skip</AppText>
                    </Pressable>
                  ) : null}
                  <Pressable
                    style={({ pressed }) => [
                      styles.completeBtn,
                      { backgroundColor: '#2563EB' },
                      pressed && styles.btnPressed,
                    ]}
                    disabled={walkBusy}
                    onPress={handleWalkStart}
                  >
                    <View style={[styles.completeBtnContent, { justifyContent: 'center' }]}>
                      <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" />
                      <AppText style={[styles.completeBtnText, { flexShrink: 1 }]} weight="800" color="#FFFFFF" numberOfLines={1}>Start Walk</AppText>
                    </View>
                  </Pressable>
                </>
              ) : (
                // Running — show live timer + Done
                <>
                  <View style={styles.walkTimerDisplay}>
                    <View style={[
                      styles.walkTimerDot,
                      walkElapsedSeconds >= walkTargetDuration * 60 && { backgroundColor: '#16A34A' },
                    ]} />
                    <AppText
                      style={styles.walkTimerText}
                      weight="800"
                      color={walkElapsedSeconds >= walkTargetDuration * 60 ? '#16A34A' : '#2563EB'}
                    >
                      {formatWalkTime(walkElapsedSeconds)}
                    </AppText>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.completeBtn,
                      { backgroundColor: isPremium ? '#D4A017' : '#2E7D32' },
                      pressed && styles.btnPressed,
                    ]}
                    disabled={walkBusy}
                    onPress={handleWalkComplete}
                  >
                    {walkBusy ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={styles.completeBtnContent}>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                        <AppText style={styles.completeBtnText} weight="800" color="#FFFFFF">Done</AppText>
                      </View>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          ) : showActions && (canComplete || canSkip) ? (
            <View style={styles.footer}>
              {canSkip ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.skipBtn,
                    pressed && styles.btnPressed,
                  ]}
                  disabled={skipBusy || completeBusy}
                  onPress={handleSkip}
                >
                  {skipBusy ? (
                    <ActivityIndicator size="small" color="#4B5563" />
                  ) : (
                    <AppText style={styles.skipBtnText} weight="700" color="#4B5563">
                      Skip
                    </AppText>
                  )}
                </Pressable>
              ) : null}

              {canComplete ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.completeBtn,
                    {
                      backgroundColor: isPremium ? '#D4A017' : '#2E7D32',
                    },
                    pressed && styles.btnPressed,
                  ]}
                  disabled={skipBusy || completeBusy}
                  onPress={handleComplete}
                >
                  {completeBusy ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.completeBtnContent}>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                      <AppText style={styles.completeBtnText} weight="800" color="#FFFFFF">
                        Mark as Done
                      </AppText>
                    </View>
                  )}
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
    gap: 12,
  },
  headerIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerCategory: {
    fontSize: 12.5,
    lineHeight: 16,
  },
  metaDot: {
    fontSize: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 14,
  },
  scrollArea: {
    maxHeight: 420,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  detailContainer: {
    gap: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  gridIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTextWrap: {
    flex: 1,
    gap: 1,
  },
  fieldLabel: {
    fontSize: 10.5,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 13.5,
    letterSpacing: -0.2,
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 6,
    marginTop: 2,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesLabel: {
    fontSize: 12.5,
  },
  notesText: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 6,
  },
  skipBtn: {
    flex: 0.4,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontSize: 14,
  },
  completeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  completeBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 6,
  },
  completeBtnText: {
    fontSize: 14,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  walkTimerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  walkTimerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  walkTimerText: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
});
