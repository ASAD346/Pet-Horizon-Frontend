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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AuthErrorBanner } from '../auth/AuthErrorBanner';
import { SheetHeroIllustration, SectionLabel, SheetOptionPicker, ThemedTimePicker } from '../sheets';
import type { SheetOption } from '../sheets';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  addMinutesToTimeHHmm,
  dateToTimeHHmm,
  DEFAULT_REMINDER_MINUTES,
  defaultFeedingTimeDate,
  formatTimeDisplay,
  getReminderMinutesLabel,
  mealTypeOptionsForSpecies,
  pickDefaultUnit,
  REMINDER_MINUTES_OPTIONS,
  unitOptionsForSpecies,
} from '@/lib/feeding/feedingForm';
import { createFeedingSchedule, fetchPetPermissions } from '@/services/schedules/feedingApi';

const REMINDER_MINUTES_PICKER_OPTIONS: SheetOption[] = REMINDER_MINUTES_OPTIONS.map((option) => ({
  value: String(option.value),
  label: option.label,
}));

const LogFoodColors = {
  sheetBg: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.45)',
  label: '#9E9E9E',
  chipBg: '#F3F3F3',
  chipText: '#5A5A5A',
  inputBg: '#EFEFEF',
  inputText: '#3A3A3A',
  placeholder: '#9E9E9E',
  border: '#E8E8E8',
  title: '#1A1A1A',
};

interface LogFoodSheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onSaved?: () => void;
}

export function LogFoodSheet({
  visible,
  onClose,
  petId,
  token,
  onSaved,
}: LogFoodSheetProps) {
  const insets = useSafeAreaInsets();

  const [mealTypeOptions, setMealTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [unitOptions, setUnitOptions] = useState<{ value: string; label: string }[]>([]);
  const [mealType, setMealType] = useState('');
  const [amount, setAmount] = useState('2');
  const [unit, setUnit] = useState('');
  const [feedingTime, setFeedingTime] = useState(defaultFeedingTimeDate);
  const [reminderMinutes, setReminderMinutes] = useState(DEFAULT_REMINDER_MINUTES);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [notes, setNotes] = useState('');
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);
  const [feedingTimePickerVisible, setFeedingTimePickerVisible] = useState(false);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setAmount('2');
    setFeedingTime(defaultFeedingTimeDate());
    setReminderMinutes(DEFAULT_REMINDER_MINUTES);
    setMealType('');
    setUnit('');
    setUnitOptions([]);
    setNotificationsOn(true);
    setNotes('');
    setError(null);
  }, []);

  const loadSpeciesFeatures = useCallback(async () => {
    if (!petId || !token) {
      setMealTypeOptions([]);
      setUnitOptions([]);
      setMealType('');
      setUnit('');
      log.warn('LogFood', 'Cannot load species features — missing pet or token', {
        petId,
        hasToken: Boolean(token),
      });
      return;
    }

    setFeaturesLoading(true);
    setError(null);
    try {
      const perms = await fetchPetPermissions(token, petId);
      const features = perms.speciesFeatures;
      const mealOptions = mealTypeOptionsForSpecies(features?.mealTypes ?? []);
      const unitOpts = unitOptionsForSpecies(features?.inventoryUnits ?? []);

      setMealTypeOptions(mealOptions);
      setUnitOptions(unitOpts);
      setMealType(mealOptions[0]?.value ?? '');
      setUnit(pickDefaultUnit(features?.inventoryUnits ?? []));

      if (!mealOptions.length) {
        log.warn('LogFood', 'No meal types returned for pet', {
          petId,
          species: features?.species,
        });
      }
      if (!unitOpts.length) {
        log.warn('LogFood', 'No inventory units returned for pet', {
          petId,
          species: features?.species,
        });
      }
    } catch (e) {
      setMealTypeOptions([]);
      setUnitOptions([]);
      setMealType('');
      setUnit('');
      setError(getErrorMessage(e));
      log.fail('LogFood', 'Load species features failed', getErrorMessage(e));
    } finally {
      setFeaturesLoading(false);
    }
  }, [petId, token]);

  useEffect(() => {
    if (visible) {
      resetForm();
      loadSpeciesFeatures();
    }
  }, [visible, resetForm, loadSpeciesFeatures]);

  const handleSave = async () => {
    if (!petId || !token) {
      setError('Add a pet before saving a feeding schedule.');
      return;
    }
    if (!mealType) {
      setError('Select a meal type.');
      return;
    }
    if (!unit) {
      setError('Select a unit.');
      return;
    }
    if (!amount.trim()) {
      setError('Enter an amount.');
      return;
    }

    const timeHHmm = dateToTimeHHmm(feedingTime);
    const noteText = notes.trim();

    setSaving(true);
    setError(null);
    try {
      await createFeedingSchedule(token, {
        petId,
        mealType,
        time: timeHHmm,
        amount: amount.trim(),
        unit,
        notes: noteText || undefined,
        reminder: notificationsOn,
        reminderMinutes: notificationsOn ? reminderMinutes : undefined,
        reminderTime: notificationsOn
          ? addMinutesToTimeHHmm(timeHHmm, reminderMinutes)
          : undefined,
      });
      log.ok('LogFood', 'Feeding schedule saved', { mealType, time: timeHHmm, unit });
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
              <AppText variant="h3" weight="800" color={LogFoodColors.title} style={styles.headerTitle}>
                Log Food
              </AppText>
              <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={LogFoodColors.chipText} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {error ? <AuthErrorBanner message={error} /> : null}

              <SheetHeroIllustration
                borderColor="#FFE0B2"
                backgroundColor="#FFF8E1"
                heartColor="#F5A623"
              />

              <SectionLabel text="MEAL TYPE" />
              {featuresLoading ? (
                <ActivityIndicator color={HomeTheme.green} style={styles.mealLoader} />
              ) : mealTypeOptions.length === 0 ? (
                <AppText variant="bodySmall" color={LogFoodColors.label} style={styles.mealEmpty}>
                  No meal types available for this pet.
                </AppText>
              ) : (
                <View style={styles.chipRow}>
                  {mealTypeOptions.map((option) => {
                    const selected = mealType === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => setMealType(option.value)}
                        activeOpacity={0.85}
                      >
                        <AppText
                          variant="bodySmall"
                          weight="600"
                          color={selected ? HomeTheme.white : LogFoodColors.chipText}
                        >
                          {option.label}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <AppText variant="bodySmall" weight="700" color={LogFoodColors.title} style={styles.amountLabel}>
                Amount
              </AppText>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                style={styles.textInput}
              />

              <SectionLabel text="UNIT" />
              {featuresLoading ? (
                <ActivityIndicator color={HomeTheme.green} style={styles.mealLoader} />
              ) : unitOptions.length === 0 ? (
                <AppText variant="bodySmall" color={LogFoodColors.label} style={styles.mealEmpty}>
                  No units available for this pet.
                </AppText>
              ) : (
                <View style={styles.chipRow}>
                  {unitOptions.map((option) => {
                    const selected = unit === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => setUnit(option.value)}
                        activeOpacity={0.85}
                      >
                        <AppText
                          variant="bodySmall"
                          weight="600"
                          color={selected ? HomeTheme.white : LogFoodColors.chipText}
                        >
                          {option.label}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.twoColRow}>
                <View style={styles.halfCol}>
                  <SectionLabel text="TIME" />
                  <TouchableOpacity
                    style={styles.pickerField}
                    activeOpacity={0.85}
                    onPress={() => setFeedingTimePickerVisible(true)}
                  >
                    <AppText variant="bodySmall" weight="600" color={LogFoodColors.inputText}>
                      {formatTimeDisplay(feedingTime)}
                    </AppText>
                    <Ionicons name="time-outline" size={18} color={LogFoodColors.label} />
                  </TouchableOpacity>
                </View>
                <View style={styles.halfCol}>
                  <SectionLabel text="NOTIFICATIONS" />
                  <TouchableOpacity
                    style={styles.pickerField}
                    activeOpacity={0.85}
                    onPress={() => setNotificationsOn((v) => !v)}
                  >
                    <AppText variant="bodySmall" weight="600" color={LogFoodColors.inputText}>
                      {notificationsOn ? 'On' : 'Off'}
                    </AppText>
                    <Ionicons
                      name={notificationsOn ? 'notifications-outline' : 'notifications-off-outline'}
                      size={18}
                      color={LogFoodColors.label}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {notificationsOn ? (
                <>
                  <SectionLabel text="REMINDER" />
                  <TouchableOpacity
                    style={styles.pickerField}
                    activeOpacity={0.85}
                    onPress={() => setReminderPickerVisible(true)}
                  >
                    <AppText variant="bodySmall" weight="600" color={LogFoodColors.inputText}>
                      {getReminderMinutesLabel(reminderMinutes)}
                    </AppText>
                    <Ionicons name="chevron-down" size={18} color={LogFoodColors.label} />
                  </TouchableOpacity>
                </>
              ) : null}

              <SectionLabel text="NOTES (OPTIONAL)" />
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add extra details..."
                placeholderTextColor={LogFoodColors.placeholder}
                style={[styles.textInput, styles.notesInput]}
                multiline
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.footer}>
              <AppButton
                title="Save Feeding"
                onPress={handleSave}
                loading={saving}
                disabled={saving || featuresLoading || !mealType || !unit}
                variant="success"
                size="md"
                style={styles.saveBtn}
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
        visible={feedingTimePickerVisible}
        value={feedingTime}
        onClose={() => setFeedingTimePickerVisible(false)}
        onConfirm={(date) => {
          setFeedingTime(date);
          setFeedingTimePickerVisible(false);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: LogFoodColors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: LogFoodColors.sheetBg,
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
    marginBottom: Spacing.md,
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  mealLoader: {
    marginBottom: Spacing.md,
  },
  mealEmpty: {
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: LogFoodColors.chipBg,
  },
  chipSelected: {
    backgroundColor: HomeTheme.green,
  },
  textInput: {
    backgroundColor: LogFoodColors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 14,
    color: LogFoodColors.inputText,
    fontWeight: '500',
    marginBottom: Spacing.md,
  },
  amountLabel: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  halfCol: {
    flex: 1,
  },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: LogFoodColors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    marginBottom: Spacing.md,
  },
  notesInput: {
    minHeight: 88,
    paddingTop: Spacing.md,
    borderWidth: 1,
    borderColor: LogFoodColors.border,
    backgroundColor: LogFoodColors.sheetBg,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LogFoodColors.border,
  },
  saveBtn: {
    width: '100%',
    borderRadius: Radius.full,
    backgroundColor: HomeTheme.green,
    minHeight: 52,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
