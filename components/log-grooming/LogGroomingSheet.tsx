import React, { useState } from 'react';
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
import { SheetHeroIllustration, SectionLabel, SheetColors } from '../sheets';
import { Radius, Spacing } from '../../constants/theme';

const TASK_TYPES = ['Bath', 'Haircut', 'Nail Trim'] as const;
type TaskType = (typeof TASK_TYPES)[number];
const FREQUENCIES = ['Daily', 'Weekly', 'Biweekly', 'Monthly'] as const;
type Frequency = (typeof FREQUENCIES)[number];

const Accent = {
  primary: '#FF7F74',
  border: '#FFCDD2',
  bg: '#FFF5F4',
};

interface LogGroomingSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function LogGroomingSheet({ visible, onClose }: LogGroomingSheetProps) {
  const insets = useSafeAreaInsets();
  const [taskType, setTaskType] = useState<TaskType>('Bath');
  const [frequency, setFrequency] = useState<Frequency>('Weekly');
  const [reminderOn, setReminderOn] = useState(true);
  const [dueDate] = useState('May 13, 2026');
  const [notes, setNotes] = useState('');

  const cycleFrequency = () => {
    const idx = FREQUENCIES.indexOf(frequency);
    setFrequency(FREQUENCIES[(idx + 1) % FREQUENCIES.length]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
              <SheetHeroIllustration borderColor={Accent.border} backgroundColor={Accent.bg} heartColor={Accent.primary} />

              <SectionLabel text="TASK TYPE" />
              <View style={styles.chipRow}>
                {TASK_TYPES.map((type) => {
                  const selected = taskType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.chip, selected && { backgroundColor: Accent.primary }]}
                      onPress={() => setTaskType(type)}
                      activeOpacity={0.85}
                    >
                      <AppText variant="bodySmall" weight="600" color={selected ? '#FFFFFF' : SheetColors.chipText}>
                        {type}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.twoColRow}>
                <View style={styles.halfCol}>
                  <SectionLabel text="FREQUENCY" />
                  <TouchableOpacity style={styles.pickerField} onPress={cycleFrequency} activeOpacity={0.85}>
                    <AppText variant="bodySmall" weight="600" color={SheetColors.inputText}>
                      {frequency}
                    </AppText>
                    <Ionicons name="chevron-down" size={18} color={SheetColors.label} />
                  </TouchableOpacity>
                </View>
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
                    <AppText variant="bodySmall" weight="700" color={reminderOn ? '#FFFFFF' : SheetColors.chipText}>
                      {reminderOn ? 'On' : 'Off'}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>

              <SectionLabel text="NEXT DUE DATE" />
              <TouchableOpacity style={styles.pickerField} activeOpacity={0.85}>
                <AppText variant="bodySmall" weight="600" color={SheetColors.inputText}>
                  {dueDate}
                </AppText>
                <Ionicons name="calendar-outline" size={18} color={SheetColors.label} />
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
            </ScrollView>

            <View style={styles.footer}>
              <AppButton
                title="Save Grooming"
                onPress={onClose}
                variant="success"
                size="md"
                style={[styles.saveBtn, { backgroundColor: Accent.primary }]}
                textStyle={styles.saveBtnText}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
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
  twoColRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xs },
  halfCol: { flex: 1 },
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
});
