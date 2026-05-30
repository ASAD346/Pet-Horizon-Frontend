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
import { SheetHeroIllustration, SectionLabel, SheetColors } from '../sheets';
import { ThemedDatePicker } from '../pet/ThemedDatePicker';
import { Radius, Spacing } from '../../constants/theme';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  dateToApiDateString,
  defaultScheduledDate,
  formatDateLabel,
} from '@/lib/grooming/groomingForm';
import { createGroomingRecord, fetchGroomingTypes } from '@/services/grooming/groomingApi';
import type { GroomingTypeOption } from '@/types/grooming';

const Accent = {
  primary: '#E91E8C',
  border: '#FFCDD2',
  bg: '#FCE4F0',
};

interface LogGroomingSheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onSaved?: () => void;
}

export function LogGroomingSheet({
  visible,
  onClose,
  petId,
  token,
  onSaved,
}: LogGroomingSheetProps) {
  const insets = useSafeAreaInsets();

  const [typeOptions, setTypeOptions] = useState<GroomingTypeOption[]>([]);
  const [groomingVisible, setGroomingVisible] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [groomingType, setGroomingType] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [reminderOn, setReminderOn] = useState(true);
  const [notes, setNotes] = useState('');
  const [scheduledPickerVisible, setScheduledPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTypes = useCallback(async () => {
    if (!petId || !token) {
      setTypeOptions([]);
      setGroomingVisible(true);
      return;
    }
    setLoadingTypes(true);
    setError(null);
    try {
      const data = await fetchGroomingTypes(token, petId);
      setGroomingVisible(data.groomingVisible);
      setTypeOptions(data.types ?? []);
      setGroomingType(data.types?.[0]?.value ?? '');
    } catch (e) {
      setTypeOptions([]);
      setError(getErrorMessage(e));
    } finally {
      setLoadingTypes(false);
    }
  }, [petId, token]);

  const resetForm = useCallback(() => {
    setScheduledDate(defaultScheduledDate());
    setReminderOn(true);
    setNotes('');
    setError(null);
  }, []);

  useEffect(() => {
    if (visible) {
      resetForm();
      loadTypes();
    }
  }, [visible, resetForm, loadTypes]);

  const handleSave = async () => {
    if (!petId || !token) {
      setError('Add a pet before saving a grooming task.');
      return;
    }
    if (!groomingVisible) {
      setError('Grooming is not available for this pet species.');
      return;
    }
    if (!groomingType) {
      setError('Select a grooming type.');
      return;
    }

    const noteText = notes.trim();

    setSaving(true);
    setError(null);
    try {
      await createGroomingRecord(token, {
        petId,
        type: groomingType,
        scheduledDate: scheduledDate ? dateToApiDateString(scheduledDate) : undefined,
        reminder: reminderOn,
        notes: noteText || undefined,
      });
      log.ok('LogGrooming', 'Grooming record saved', {
        type: groomingType,
        scheduledDate: scheduledDate ? dateToApiDateString(scheduledDate) : null,
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
                Grooming Tasks
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

              {loadingTypes ? (
                <ActivityIndicator color={Accent.primary} style={styles.loader} />
              ) : !groomingVisible ? (
                <View style={styles.unavailableBox}>
                  <AppText variant="bodySmall" color={SheetColors.chipText}>
                    Grooming is not available for this pet species.
                  </AppText>
                </View>
              ) : (
                <>
                  <SectionLabel text="TASK TYPE" />
                  <View style={styles.chipRow}>
                    {typeOptions.map((option) => {
                      const selected = groomingType === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.chip, selected && { backgroundColor: Accent.primary }]}
                          onPress={() => setGroomingType(option.value)}
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

                  <SectionLabel text="SCHEDULED DATE" />
                  <View style={styles.dateFieldRow}>
                    <TouchableOpacity
                      style={[styles.pickerField, styles.dateField]}
                      activeOpacity={0.85}
                      onPress={() => setScheduledPickerVisible(true)}
                    >
                      <AppText
                        variant="bodySmall"
                        weight="600"
                        color={scheduledDate ? SheetColors.inputText : SheetColors.placeholder}
                      >
                        {scheduledDate ? formatDateLabel(scheduledDate) : 'Optional'}
                      </AppText>
                      <Ionicons name="calendar-outline" size={18} color={SheetColors.label} />
                    </TouchableOpacity>
                    {scheduledDate ? (
                      <TouchableOpacity
                        style={styles.clearDateBtn}
                        onPress={() => setScheduledDate(null)}
                        hitSlop={8}
                      >
                        <Ionicons name="close-circle" size={20} color={SheetColors.label} />
                      </TouchableOpacity>
                    ) : null}
                  </View>

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

                  <SectionLabel text="NOTES" />
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Specific instructions..."
                    placeholderTextColor={SheetColors.placeholder}
                    style={[styles.textInput, styles.notesInput]}
                    multiline
                    textAlignVertical="top"
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <AppButton
                title="Save Grooming"
                onPress={handleSave}
                loading={saving}
                disabled={saving || loadingTypes || !groomingVisible || !groomingType}
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
        visible={scheduledPickerVisible}
        title="Scheduled date"
        value={scheduledDate ?? defaultScheduledDate()}
        onClose={() => setScheduledPickerVisible(false)}
        onConfirm={(date) => {
          setScheduledDate(date);
          setScheduledPickerVisible(false);
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
  loader: { marginVertical: Spacing.md },
  unavailableBox: {
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
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
});
