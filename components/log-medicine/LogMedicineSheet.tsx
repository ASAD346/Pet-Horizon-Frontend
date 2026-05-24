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

const UNITS = ['tablet', 'capsule', 'ml', 'mg', 'drop'] as const;
type DoseUnit = (typeof UNITS)[number];
type ScheduleType = 'Daily' | 'Weekly';

const Accent = {
  primary: '#5B9BD5',
  border: '#BBDEFB',
  bg: '#E8F4FD',
};

interface LogMedicineSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function LogMedicineSheet({ visible, onClose }: LogMedicineSheetProps) {
  const insets = useSafeAreaInsets();

  const [medicineName, setMedicineName] = useState('');
  const [doseValue, setDoseValue] = useState('1');
  const [unit, setUnit] = useState<DoseUnit>('tablet');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('Daily');
  const [timeLabel] = useState('10:30 AM');
  const [totalQuantity, setTotalQuantity] = useState('30');
  const [reminderOn, setReminderOn] = useState(true);

  const cycleUnit = () => {
    const idx = UNITS.indexOf(unit);
    setUnit(UNITS[(idx + 1) % UNITS.length]);
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
              <SheetHeroIllustration borderColor={Accent.border} backgroundColor={Accent.bg} heartColor={Accent.primary} />

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
                  <SectionLabel text="DOSE VALUE" />
                  <TextInput
                    value={doseValue}
                    onChangeText={setDoseValue}
                    keyboardType="decimal-pad"
                    style={[styles.textInput, styles.compactInput]}
                  />
                </View>
                <View style={styles.halfCol}>
                  <SectionLabel text="UNIT" />
                  <TouchableOpacity style={styles.pickerField} onPress={cycleUnit} activeOpacity={0.85}>
                    <AppText variant="bodySmall" weight="600" color={SheetColors.inputText}>
                      {unit}
                    </AppText>
                    <Ionicons name="chevron-down" size={18} color={SheetColors.label} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.twoColRow}>
                <View style={styles.halfCol}>
                  <SectionLabel text="SCHEDULE TYPE" />
                  <View style={styles.segmentRow}>
                    {(['Daily', 'Weekly'] as ScheduleType[]).map((type) => {
                      const selected = scheduleType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          style={[styles.segmentBtn, selected && { backgroundColor: Accent.primary }]}
                          onPress={() => setScheduleType(type)}
                          activeOpacity={0.85}
                        >
                          <AppText
                            variant="caption"
                            weight="700"
                            color={selected ? '#FFFFFF' : SheetColors.chipText}
                          >
                            {type}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                <View style={styles.halfCol}>
                  <SectionLabel text="SET TIME" />
                  <TouchableOpacity style={styles.pickerField} activeOpacity={0.85}>
                    <AppText variant="bodySmall" weight="600" color={SheetColors.inputText}>
                      {timeLabel}
                    </AppText>
                    <Ionicons name="time-outline" size={18} color={SheetColors.label} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.twoColRow}>
                <View style={styles.halfCol}>
                  <SectionLabel text="TOTAL QUANTITY" />
                  <TextInput
                    value={totalQuantity}
                    onChangeText={setTotalQuantity}
                    keyboardType="number-pad"
                    style={[styles.textInput, styles.compactInput]}
                  />
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
            </ScrollView>

            <View style={styles.footer}>
              <AppButton
                title="Save Medicine"
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
  compactInput: {
    marginBottom: Spacing.md,
    minHeight: 48,
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
