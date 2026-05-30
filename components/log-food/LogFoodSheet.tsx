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
import {
  dateToTimeHHmm,
  defaultFeedingTimeDate,
  formatTimeDisplay,
  getMealTypeLabel,
  getUnitLabel,
  mealTypeOptionsForSpecies,
  pickDefaultUnit,
  unitOptionsForPicker,
} from '@/lib/feeding/feedingForm';
import { createFeedingSchedule, fetchPetPermissions } from '@/services/schedules/feedingApi';

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

  const [mealTypeOptions, setMealTypeOptions] = useState<SheetOption[]>([]);
  const [unitOptions, setUnitOptions] = useState<SheetOption[]>([]);
  const [mealType, setMealType] = useState('');
  const [amount, setAmount] = useState('2');
  const [unit, setUnit] = useState('cup');
  const [feedingTime, setFeedingTime] = useState(defaultFeedingTimeDate);
  const [reminderTime, setReminderTime] = useState(defaultFeedingTimeDate);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [notes, setNotes] = useState('');
  const [mealPickerVisible, setMealPickerVisible] = useState(false);
  const [unitPickerVisible, setUnitPickerVisible] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<'feeding' | 'reminder' | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    const defaultTime = defaultFeedingTimeDate();
    setAmount('2');
    setFeedingTime(defaultTime);
    setReminderTime(defaultTime);
    setNotificationsOn(true);
    setNotes('');
    setError(null);
  }, []);

  const loadOptions = useCallback(async () => {
    if (!petId || !token) return;
    setOptionsLoading(true);
    setError(null);
    try {
      const perms = await fetchPetPermissions(token, petId);
      const types = perms.speciesFeatures?.mealTypes ?? [];
      const allowedUnits = perms.speciesFeatures?.inventoryUnits ?? ['cup'];
      const meals = mealTypeOptionsForSpecies(types);
      const unitOpts = unitOptionsForPicker(allowedUnits);
      setMealTypeOptions(meals);
      setUnitOptions(unitOpts);
      setMealType(meals[0]?.value ?? '');
      setUnit(pickDefaultUnit(allowedUnits));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setOptionsLoading(false);
    }
  }, [petId, token]);

  useEffect(() => {
    if (visible) {
      resetForm();
      loadOptions();
    }
  }, [visible, loadOptions, resetForm]);

  const handleSave = async () => {
    if (!petId || !token) {
      setError('Add a pet before saving a feeding schedule.');
      return;
    }
    if (!mealType) {
      setError('Select a meal type.');
      return;
    }
    if (!amount.trim()) {
      setError('Enter an amount.');
      return;
    }

    const timeHHmm = dateToTimeHHmm(feedingTime);
    const reminderHHmm = dateToTimeHHmm(reminderTime);
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
        reminderTime: notificationsOn ? reminderHHmm : undefined,
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
              {optionsLoading ? (
                <ActivityIndicator color={HomeTheme.green} style={styles.loader} />
              ) : (
                <TouchableOpacity
                  style={styles.pickerField}
                  activeOpacity={0.85}
                  onPress={() => setMealPickerVisible(true)}
                >
                  <AppText variant="bodySmall" weight="600" color={LogFoodColors.inputText}>
                    {mealType ? getMealTypeLabel(mealType) : 'Select meal'}
                  </AppText>
                  <Ionicons name="chevron-down" size={18} color={LogFoodColors.label} />
                </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.pickerField}
                activeOpacity={0.85}
                onPress={() => setUnitPickerVisible(true)}
                disabled={optionsLoading || unitOptions.length === 0}
              >
                <AppText variant="bodySmall" weight="600" color={LogFoodColors.inputText}>
                  {getUnitLabel(unit, unitOptions.map((o) => o.value))}
                </AppText>
                <Ionicons name="chevron-down" size={18} color={LogFoodColors.label} />
              </TouchableOpacity>

              <View style={styles.twoColRow}>
                <View style={styles.halfCol}>
                  <SectionLabel text="TIME" />
                  <TouchableOpacity
                    style={styles.pickerField}
                    activeOpacity={0.85}
                    onPress={() => setTimePickerTarget('feeding')}
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
                  <SectionLabel text="REMINDER TIME" />
                  <TouchableOpacity
                    style={styles.pickerField}
                    activeOpacity={0.85}
                    onPress={() => setTimePickerTarget('reminder')}
                  >
                    <AppText variant="bodySmall" weight="600" color={LogFoodColors.inputText}>
                      {formatTimeDisplay(reminderTime)}
                    </AppText>
                    <Ionicons name="time-outline" size={18} color={LogFoodColors.label} />
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
                disabled={optionsLoading || saving}
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
        visible={mealPickerVisible}
        title="Select meal type"
        options={mealTypeOptions}
        selectedValue={mealType}
        onClose={() => setMealPickerVisible(false)}
        onSelect={setMealType}
      />

      <SheetOptionPicker
        visible={unitPickerVisible}
        title="Select unit"
        options={unitOptions}
        selectedValue={unit}
        onClose={() => setUnitPickerVisible(false)}
        onSelect={setUnit}
      />

      <ThemedTimePicker
        visible={timePickerTarget !== null}
        value={timePickerTarget === 'reminder' ? reminderTime : feedingTime}
        onClose={() => setTimePickerTarget(null)}
        onConfirm={(date) => {
          if (timePickerTarget === 'reminder') {
            setReminderTime(date);
          } else {
            setFeedingTime(date);
          }
          setTimePickerTarget(null);
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
  loader: {
    marginBottom: Spacing.md,
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
