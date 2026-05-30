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
import { SheetHeroIllustration, SectionLabel, SheetOptionPicker, ThemedTimePicker } from '../sheets';
import { ThemedDatePicker } from '../pet/ThemedDatePicker';
import type { SheetOption } from '../sheets';
import { SheetColors } from '../sheets';
import { Radius, Spacing } from '../../constants/theme';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  addMinutesToTimeHHmm,
  DEFAULT_REMINDER_MINUTES,
  getReminderMinutesLabel,
  REMINDER_MINUTES_OPTIONS,
} from '@/lib/feeding/feedingForm';
import {
  buildDoseString,
  dateToApiDateString,
  dateToTimeHHmm,
  DAYS_OF_WEEK_OPTIONS,
  defaultMedicineTimeDate,
  DOSE_FORM_OPTIONS,
  formatDateLabel,
  formatTimeDisplay,
  FREQUENCY_OPTIONS,
  isStartBeforeOrEqualEnd,
  parseTotalPills,
} from '@/lib/medicine/medicineForm';
import { createMedicineSchedule } from '@/services/schedules/medicineApi';
import type { DayOfWeekCode, MedicineDoseForm, MedicineFrequency } from '@/types/medicine';

const REMINDER_MINUTES_PICKER_OPTIONS: SheetOption[] = REMINDER_MINUTES_OPTIONS.map((option) => ({
  value: String(option.value),
  label: option.label,
}));

const Accent = {
  primary: '#5B9BD5',
  border: '#BBDEFB',
  bg: '#E8F4FD',
};

interface LogMedicineSheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onSaved?: () => void;
}

function InputWithSuffix({
  value,
  onChangeText,
  suffix,
  keyboardType = 'default',
}: {
  value: string;
  onChangeText: (t: string) => void;
  suffix: string;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
}) {
  return (
    <View style={styles.suffixInputWrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={styles.suffixInput}
      />
      <AppText variant="bodySmall" weight="600" color={SheetColors.label} style={styles.suffixText}>
        {suffix}
      </AppText>
    </View>
  );
}

export function LogMedicineSheet({
  visible,
  onClose,
  petId,
  token,
  onSaved,
}: LogMedicineSheetProps) {
  const insets = useSafeAreaInsets();

  const [medicineName, setMedicineName] = useState('');
  const [doseAmount, setDoseAmount] = useState('1');
  const [doseForm, setDoseForm] = useState<MedicineDoseForm>('tablet');
  const [frequency, setFrequency] = useState<MedicineFrequency>('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeekCode[]>([]);
  const [medicineTime, setMedicineTime] = useState(defaultMedicineTimeDate);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [totalPills, setTotalPills] = useState('30');
  const [reminderOn, setReminderOn] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState(DEFAULT_REMINDER_MINUTES);
  const [notes, setNotes] = useState('');
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [startDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [endDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setMedicineName('');
    setDoseAmount('1');
    setDoseForm('tablet');
    setFrequency('daily');
    setDaysOfWeek([]);
    setMedicineTime(defaultMedicineTimeDate());
    setStartDate(null);
    setEndDate(null);
    setTotalPills('30');
    setReminderOn(true);
    setReminderMinutes(DEFAULT_REMINDER_MINUTES);
    setNotes('');
    setError(null);
  }, []);

  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible, resetForm]);

  const toggleDay = (day: DayOfWeekCode) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSave = async () => {
    if (!petId || !token) {
      setError('Add a pet before saving a medicine schedule.');
      return;
    }

    const name = medicineName.trim();
    if (!name) {
      setError('Enter a medicine name.');
      return;
    }

    const dose = buildDoseString(doseAmount, doseForm);
    if (!dose) {
      setError('Enter a valid dose amount.');
      return;
    }

    if (frequency === 'weekly' && daysOfWeek.length === 0) {
      setError('Select at least one day for a weekly schedule.');
      return;
    }

    if (startDate && endDate && !isStartBeforeOrEqualEnd(startDate, endDate)) {
      setError('Start date must be before or equal to end date.');
      return;
    }

    const pills = parseTotalPills(totalPills);
    if (pills === null) {
      setError('Enter a valid total quantity.');
      return;
    }

    const timeHHmm = dateToTimeHHmm(medicineTime);
    const noteText = notes.trim();

    setSaving(true);
    setError(null);
    try {
      await createMedicineSchedule(token, {
        petId,
        medicineName: name,
        dose,
        time: timeHHmm,
        doseForm,
        frequency,
        daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
        totalPills: pills,
        remainingPills: pills,
        notes: noteText || undefined,
        startDate: startDate ? dateToApiDateString(startDate) : undefined,
        endDate: endDate ? dateToApiDateString(endDate) : undefined,
        reminder: reminderOn,
        reminderMinutes: reminderOn ? reminderMinutes : undefined,
        reminderTime: reminderOn ? addMinutesToTimeHHmm(timeHHmm, reminderMinutes) : undefined,
      });
      log.ok('LogMedicine', 'Medicine schedule saved', {
        medicineName: name,
        dose,
        time: timeHHmm,
        frequency,
      });
      onSaved?.();
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
                Add New Medicine
              </AppText>
              <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
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

              <SectionLabel text="MEDICINE NAME" />
              <TextInput
                value={medicineName}
                onChangeText={setMedicineName}
                placeholder="e.g. Heartgard"
                placeholderTextColor={SheetColors.placeholder}
                style={styles.textInput}
              />

              <View style={styles.twoColRow}>
                <View style={styles.halfCol}>
                  <SectionLabel text="DOSE AMOUNT" />
                  <InputWithSuffix
                    value={doseAmount}
                    onChangeText={setDoseAmount}
                    suffix={doseForm === 'tablet' ? 'qty' : 'ml'}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.halfCol}>
                  <SectionLabel text="DOSE FORM" />
                  <View style={styles.segmentRow}>
                    {DOSE_FORM_OPTIONS.map((option) => {
                      const selected = doseForm === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.segmentBtn, selected && { backgroundColor: Accent.primary }]}
                          onPress={() => setDoseForm(option.value)}
                          activeOpacity={0.85}
                        >
                          <AppText
                            variant="caption"
                            weight="700"
                            color={selected ? '#FFFFFF' : SheetColors.chipText}
                          >
                            {option.label}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              <SectionLabel text="FREQUENCY" />
              <View style={styles.chipRow}>
                {FREQUENCY_OPTIONS.map((option) => {
                  const selected = frequency === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.chip, selected && { backgroundColor: Accent.primary }]}
                      onPress={() => {
                        setFrequency(option.value);
                        if (option.value !== 'weekly') setDaysOfWeek([]);
                      }}
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

              {frequency === 'weekly' ? (
                <>
                  <SectionLabel text="DAYS OF WEEK" />
                  <View style={styles.chipRow}>
                    {DAYS_OF_WEEK_OPTIONS.map((option) => {
                      const selected = daysOfWeek.includes(option.value);
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.dayChip, selected && { backgroundColor: Accent.primary }]}
                          onPress={() => toggleDay(option.value)}
                          activeOpacity={0.85}
                        >
                          <AppText
                            variant="caption"
                            weight="700"
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

              <View style={styles.twoColRow}>
                <View style={styles.halfCol}>
                  <SectionLabel text="START DATE" />
                  <View style={styles.dateFieldRow}>
                    <TouchableOpacity
                      style={[styles.pickerField, styles.dateField]}
                      activeOpacity={0.85}
                      onPress={() => setStartDatePickerVisible(true)}
                    >
                      <AppText
                        variant="bodySmall"
                        weight="600"
                        color={startDate ? SheetColors.inputText : SheetColors.placeholder}
                      >
                        {startDate ? formatDateLabel(startDate) : 'Optional'}
                      </AppText>
                      <Ionicons name="calendar-outline" size={18} color={SheetColors.label} />
                    </TouchableOpacity>
                    {startDate ? (
                      <TouchableOpacity
                        style={styles.clearDateBtn}
                        onPress={() => setStartDate(null)}
                        hitSlop={8}
                      >
                        <Ionicons name="close-circle" size={20} color={SheetColors.label} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
                <View style={styles.halfCol}>
                  <SectionLabel text="END DATE" />
                  <View style={styles.dateFieldRow}>
                    <TouchableOpacity
                      style={[styles.pickerField, styles.dateField]}
                      activeOpacity={0.85}
                      onPress={() => setEndDatePickerVisible(true)}
                    >
                      <AppText
                        variant="bodySmall"
                        weight="600"
                        color={endDate ? SheetColors.inputText : SheetColors.placeholder}
                      >
                        {endDate ? formatDateLabel(endDate) : 'Optional'}
                      </AppText>
                      <Ionicons name="calendar-outline" size={18} color={SheetColors.label} />
                    </TouchableOpacity>
                    {endDate ? (
                      <TouchableOpacity
                        style={styles.clearDateBtn}
                        onPress={() => setEndDate(null)}
                        hitSlop={8}
                      >
                        <Ionicons name="close-circle" size={20} color={SheetColors.label} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.twoColRow}>
                <View style={styles.halfCol}>
                  <SectionLabel text="SET TIME" />
                  <TouchableOpacity
                    style={styles.pickerField}
                    activeOpacity={0.85}
                    onPress={() => setTimePickerVisible(true)}
                  >
                    <AppText variant="bodySmall" weight="600" color={SheetColors.inputText}>
                      {formatTimeDisplay(medicineTime)}
                    </AppText>
                    <Ionicons name="time-outline" size={18} color={SheetColors.label} />
                  </TouchableOpacity>
                </View>
                <View style={styles.halfCol}>
                  <SectionLabel text="TOTAL QUANTITY" />
                  <InputWithSuffix
                    value={totalPills}
                    onChangeText={setTotalPills}
                    suffix="pills"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.twoColRow}>
                <View style={styles.halfCol}>
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
                </View>
                {reminderOn ? (
                  <View style={styles.halfCol}>
                    <SectionLabel text="REMIND AFTER" />
                    <TouchableOpacity
                      style={styles.pickerField}
                      activeOpacity={0.85}
                      onPress={() => setReminderPickerVisible(true)}
                    >
                      <AppText variant="bodySmall" weight="600" color={SheetColors.inputText}>
                        {getReminderMinutesLabel(reminderMinutes)}
                      </AppText>
                      <Ionicons name="chevron-down" size={18} color={SheetColors.label} />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              <SectionLabel text="NOTES (OPTIONAL)" />
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="With food, vet instructions..."
                placeholderTextColor={SheetColors.placeholder}
                style={[styles.textInput, styles.notesInput]}
                multiline
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.footer}>
              <AppButton
                title="Save Medicine"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                variant="success"
                size="md"
                style={[styles.saveBtn, { backgroundColor: Accent.primary }]}
                textStyle={styles.saveBtnText}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>

      <SheetOptionPicker
        visible={reminderPickerVisible}
        title="Remind me after"
        options={REMINDER_MINUTES_PICKER_OPTIONS}
        selectedValue={String(reminderMinutes)}
        onClose={() => setReminderPickerVisible(false)}
        onSelect={(value) => setReminderMinutes(Number(value))}
      />

      <ThemedTimePicker
        visible={timePickerVisible}
        value={medicineTime}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={(date) => {
          setMedicineTime(date);
          setTimePickerVisible(false);
        }}
      />

      <ThemedDatePicker
        visible={startDatePickerVisible}
        title="Start date"
        value={startDate ?? new Date()}
        maximumDate={endDate ?? undefined}
        onClose={() => setStartDatePickerVisible(false)}
        onConfirm={(date) => {
          setStartDate(date);
          if (endDate && !isStartBeforeOrEqualEnd(date, endDate)) {
            setEndDate(null);
          }
          setStartDatePickerVisible(false);
        }}
      />

      <ThemedDatePicker
        visible={endDatePickerVisible}
        title="End date"
        value={endDate ?? startDate ?? new Date()}
        minimumDate={startDate ?? undefined}
        onClose={() => setEndDatePickerVisible(false)}
        onConfirm={(date) => {
          setEndDate(date);
          setEndDatePickerVisible(false);
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
  headerTitle: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
    paddingRight: Spacing.sm,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  twoColRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xs },
  halfCol: { flex: 1 },
  textInput: {
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 14,
    color: SheetColors.inputText,
    fontWeight: '500',
    marginBottom: Spacing.md,
  },
  notesInput: {
    minHeight: 88,
    paddingTop: Spacing.md,
    borderWidth: 1,
    borderColor: SheetColors.border,
    backgroundColor: SheetColors.sheetBg,
  },
  suffixInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    minHeight: 48,
  },
  suffixInput: {
    flex: 1,
    fontSize: 14,
    color: SheetColors.inputText,
    fontWeight: '600',
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },
  suffixText: {
    marginLeft: Spacing.xs,
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
  dateFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dateField: {
    flex: 1,
    marginBottom: 0,
  },
  clearDateBtn: {
    marginBottom: Spacing.md,
    padding: 2,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    padding: 3,
    marginBottom: Spacing.md,
    minHeight: 48,
    alignItems: 'center',
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: SheetColors.inputBg,
  },
  dayChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: SheetColors.inputBg,
    minWidth: 44,
    alignItems: 'center',
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
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SheetColors.border,
  },
  saveBtn: { width: '100%', borderRadius: Radius.full, minHeight: 52 },
  saveBtnText: { fontSize: 16, fontWeight: '700' },
});
