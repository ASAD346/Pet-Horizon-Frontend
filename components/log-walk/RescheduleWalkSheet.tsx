import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { ThemedTimePicker } from '@/components/sheets';
import { formatTimeDisplay, dateToTimeHHmm } from '@/lib/feeding/feedingForm';
import { rescheduleWalkSchedule } from '@/services/schedules/walkApi';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import type { WalkScheduleItem } from '@/types/walk';

interface RescheduleWalkSheetProps {
  visible: boolean;
  schedule: WalkScheduleItem | null;
  token: string | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function RescheduleWalkSheet({
  visible,
  schedule,
  token,
  onClose,
  onSaved,
}: RescheduleWalkSheetProps) {
  const insets = useSafeAreaInsets();
  const [time, setTime] = useState(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  });
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (schedule?.timeOfDay) {
      const [h, m] = schedule.timeOfDay.split(':').map((p) => parseInt(p, 10));
      const d = new Date();
      d.setHours(h || 8, m || 0, 0, 0);
      setTime(d);
    }
  }, [schedule]);

  const handleSave = async () => {
    if (!token || !schedule) return;
    setSaving(true);
    setError(null);
    try {
      await rescheduleWalkSchedule(token, schedule._id, {
        newTime: dateToTimeHHmm(time),
      });
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reschedule walk.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <AppText variant="h3" weight="800" color={HomeTheme.text}>
          Reschedule walk
        </AppText>
        <AppText variant="caption" color={HomeTheme.textMuted} style={styles.subtitle}>
          {schedule?.title ?? 'Walk'}
        </AppText>
        <TouchableOpacity style={styles.timeBtn} onPress={() => setPickerVisible(true)}>
          <AppText variant="bodySmall" weight="700" color={HomeTheme.text}>
            New time: {formatTimeDisplay(time)}
          </AppText>
        </TouchableOpacity>
        {error ? (
          <AppText variant="caption" color="#C62828">
            {error}
          </AppText>
        ) : null}
        <AppButton title="Save" onPress={handleSave} loading={saving} variant="success" size="md" />
        <ThemedTimePicker
          visible={pickerVisible}
          value={time}
          onConfirm={(next) => {
            setTime(next);
            setPickerVisible(false);
          }}
          onClose={() => setPickerVisible(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: HomeTheme.background,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.xs,
  },
  timeBtn: {
    backgroundColor: HomeTheme.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
});
