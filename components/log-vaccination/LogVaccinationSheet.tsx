import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AuthErrorBanner } from '../auth/AuthErrorBanner';
import { SheetHeroIllustration, SectionLabel, ThemedTimePicker } from '../sheets';
import { ThemedDatePicker } from '../pet/ThemedDatePicker';
import { SheetColors } from '../sheets';
import { Radius, Spacing } from '../../constants/theme';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { formatTimeDisplay } from '@/lib/feeding/feedingForm';
import {
  dateToApiDateString,
  dateToTimeHHmm,
  defaultDueDate,
  defaultReminderTimeDate,
  formatDateLabel,
  VACCINATION_RECURRENCE_OPTIONS,
  VACCINATION_REMINDER_FREQUENCY_OPTIONS,
} from '@/lib/vaccination/vaccinationForm';
import { createVaccinationSchedule, fetchVaccinationHistory } from '@/services/schedules/vaccinationApi';
import type {
  VaccinationHistoryItem,
  VaccinationRecurrenceInterval,
  VaccinationReminderFrequency,
} from '@/types/vaccination';

const Accent = {
  primary: '#673AB7',
  border: '#D1C4E9',
  bg: '#EDE7F6',
};

interface LogVaccinationSheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onSaved?: () => void;
}

export function LogVaccinationSheet({
  visible,
  onClose,
  petId,
  token,
  onSaved,
}: LogVaccinationSheetProps) {
  const insets = useSafeAreaInsets();

  const [vaccineName, setVaccineName] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [reminderOn, setReminderOn] = useState(true);
  const [frequency, setFrequency] = useState<VaccinationReminderFrequency>('7_days');
  const [reminderTime, setReminderTime] = useState<Date>(() => defaultReminderTimeDate());
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] =
    useState<VaccinationRecurrenceInterval>('yearly');
  const [notes, setNotes] = useState('');
  const [duePickerVisible, setDuePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<VaccinationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!petId || !token) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const rows = await fetchVaccinationHistory(token, petId);
      setHistory(rows.slice(0, 5));
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [petId, token]);

  const resetForm = useCallback(() => {
    setVaccineName('');
    setDueDate(defaultDueDate());
    setReminderOn(true);
    setFrequency('7_days');
    setReminderTime(defaultReminderTimeDate());
    setIsRecurring(false);
    setRecurrenceInterval('yearly');
    setNotes('');
    setError(null);
  }, []);

  useEffect(() => {
    if (visible) {
      resetForm();
      loadHistory();
    }
  }, [visible, resetForm, loadHistory]);

  const handleSave = async () => {
    if (!petId || !token) {
      setError('Add a pet before saving a vaccination.');
      return;
    }
    if (!vaccineName.trim()) {
      setError('Enter a vaccine name.');
      return;
    }
    if (!dueDate) {
      setError('Select a due date.');
      return;
    }

    const noteText = notes.trim();

    setSaving(true);
    setError(null);
    try {
      await createVaccinationSchedule(token, {
        petId,
        vaccineName: vaccineName.trim(),
        dueDate: dateToApiDateString(dueDate),
        reminder: reminderOn,
        frequency,
        reminderTime: dateToTimeHHmm(reminderTime),
        isRecurring,
        recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
        notes: noteText || undefined,
      });
      log.ok('LogVaccination', 'Vaccination schedule saved', {
        vaccineName: vaccineName.trim(),
        dueDate: dateToApiDateString(dueDate),
      });
      onSaved?.();
      await loadHistory();
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />
            <View style={styles.header}>
              <AppText variant="h3" weight="800" color={SheetColors.title} style={styles.headerTitle}>
                Vaccination
              </AppText>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={22} color={SheetColors.chipText} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {error ? <AuthErrorBanner message={error} /> : null}

              <SheetHeroIllustration
                borderColor={Accent.border}
                backgroundColor={Accent.bg}
                heartColor={Accent.primary}
              />

              <SectionLabel text="VACCINE NAME" />
              <TextInput
                value={vaccineName}
                onChangeText={setVaccineName}
                placeholder="e.g. Rabies, DHPP, Bordetella"
                placeholderTextColor={SheetColors.placeholder}
                style={styles.textInput}
              />

              <SectionLabel text="DUE DATE" />
              <TouchableOpacity
                style={styles.pickerField}
                activeOpacity={0.85}
                onPress={() => setDuePickerVisible(true)}
              >
                <AppText
                  variant="bodySmall"
                  weight="600"
                  color={dueDate ? SheetColors.inputText : SheetColors.placeholder}
                >
                  {dueDate ? formatDateLabel(dueDate) : 'Select date'}
                </AppText>
                <Ionicons name="calendar-outline" size={18} color={SheetColors.label} />
              </TouchableOpacity>

              <SectionLabel text="REMINDER" />
              <TouchableOpacity
                style={[styles.notifyBtn, reminderOn && { backgroundColor: Accent.primary }]}
                onPress={() => setReminderOn((v) => !v)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={reminderOn ? 'notifications' : 'notifications-off-outline'}
                  size={20}
                  color={reminderOn ? '#FFFFFF' : SheetColors.chipText}
                />
                <AppText
                  variant="bodySmall"
                  weight="700"
                  color={reminderOn ? '#FFFFFF' : SheetColors.chipText}
                >
                  {reminderOn ? 'On' : 'Off'}
                </AppText>
              </TouchableOpacity>

              {reminderOn ? (
                <>
                  <SectionLabel text="REMIND ME" />
                  <View style={styles.chipRow}>
                    {VACCINATION_REMINDER_FREQUENCY_OPTIONS.map((option) => {
                      const selected = frequency === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.chip, selected && { backgroundColor: Accent.primary }]}
                          onPress={() => setFrequency(option.value)}
                          activeOpacity={0.85}
                        >
                          <AppText
                            variant="bodySmall"
                            weight="600"
                            color={selected ? '#FFFFFF' : SheetColors.chipText}
                          >
                            {option.label}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <SectionLabel text="REMINDER TIME" />
                  <TouchableOpacity
                    style={styles.pickerField}
                    activeOpacity={0.85}
                    onPress={() => setTimePickerVisible(true)}
                  >
                    <AppText variant="bodySmall" weight="600" color={SheetColors.inputText}>
                      {formatTimeDisplay(reminderTime)}
                    </AppText>
                    <Ionicons name="time-outline" size={18} color={SheetColors.label} />
                  </TouchableOpacity>
                </>
              ) : null}

              <SectionLabel text="RECURRING" />
              <TouchableOpacity
                style={[styles.notifyBtn, isRecurring && { backgroundColor: Accent.primary }]}
                onPress={() => setIsRecurring((v) => !v)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={isRecurring ? 'repeat' : 'repeat-outline'}
                  size={20}
                  color={isRecurring ? '#FFFFFF' : SheetColors.chipText}
                />
                <AppText
                  variant="bodySmall"
                  weight="700"
                  color={isRecurring ? '#FFFFFF' : SheetColors.chipText}
                >
                  {isRecurring ? 'Repeats automatically' : 'One-time'}
                </AppText>
              </TouchableOpacity>

              {isRecurring ? (
                <>
                  <SectionLabel text="REPEAT EVERY" />
                  <View style={styles.chipRow}>
                    {VACCINATION_RECURRENCE_OPTIONS.map((option) => {
                      const selected = recurrenceInterval === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.chip, selected && { backgroundColor: Accent.primary }]}
                          onPress={() => setRecurrenceInterval(option.value)}
                          activeOpacity={0.85}
                        >
                          <AppText
                            variant="bodySmall"
                            weight="600"
                            color={selected ? '#FFFFFF' : SheetColors.chipText}
                          >
                            {option.label}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : null}

              <SectionLabel text="NOTES" />
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Clinic, batch number, instructions..."
                placeholderTextColor={SheetColors.placeholder}
                style={[styles.textInput, styles.notesInput]}
                multiline
                textAlignVertical="top"
              />

              <SectionLabel text="VACCINATION HISTORY" />
              {historyLoading ? (
                <AppText variant="bodySmall" color={SheetColors.label} style={styles.historyEmpty}>
                  Loading history...
                </AppText>
              ) : history.length === 0 ? (
                <AppText variant="bodySmall" color={SheetColors.label} style={styles.historyEmpty}>
                  No completed vaccinations yet.
                </AppText>
              ) : (
                history.map((item, index) => (
                  <View key={`${item.vaccineName}-${item.administeredDate}-${index}`} style={styles.historyRow}>
                    <AppText variant="bodySmall" weight="700" color={SheetColors.inputText}>
                      {item.vaccineName}
                    </AppText>
                    <AppText variant="caption" color={SheetColors.label}>
                      {new Date(item.administeredDate).toLocaleDateString()}
                      {item.vetName ? ` · ${item.vetName}` : ''}
                    </AppText>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.footer}>
              <AppButton
                title="Save Vaccination"
                onPress={handleSave}
                loading={saving}
                disabled={saving || !vaccineName.trim() || !dueDate}
                variant="success"
                size="md"
                style={[styles.saveBtn, { backgroundColor: Accent.primary }]}
                textStyle={styles.saveBtnText}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>

      <ThemedDatePicker
        visible={duePickerVisible}
        title="Due date"
        value={dueDate ?? defaultDueDate()}
        onClose={() => setDuePickerVisible(false)}
        onConfirm={(date) => {
          setDueDate(date);
          setDuePickerVisible(false);
        }}
      />

      <ThemedTimePicker
        visible={timePickerVisible}
        value={reminderTime}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={(date) => {
          setReminderTime(date);
          setTimePickerVisible(false);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  overlay: { flex: 1, backgroundColor: SheetColors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: SheetColors.sheetBg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '92%',
    paddingTop: Spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  headerTitle: { flex: 1, fontSize: 22, lineHeight: 28 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: SheetColors.chipBg,
  },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    marginBottom: Spacing.md,
    minHeight: 48,
  },
  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginBottom: Spacing.md,
    minHeight: 48,
  },
  textInput: {
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 14,
    color: SheetColors.inputText,
    marginBottom: Spacing.md,
  },
  notesInput: {
    minHeight: 88,
    paddingTop: Spacing.md,
    borderWidth: 1,
    borderColor: SheetColors.border,
    backgroundColor: SheetColors.sheetBg,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SheetColors.border,
  },
  saveBtn: { width: '100%', borderRadius: Radius.full, minHeight: 52 },
  saveBtnText: { fontSize: 16, fontWeight: '700' },
  historyEmpty: {
    marginBottom: Spacing.md,
  },
  historyRow: {
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
});
