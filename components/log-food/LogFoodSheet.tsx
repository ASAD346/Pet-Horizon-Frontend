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
import { SheetHeroIllustration, SectionLabel } from '../sheets';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const;
type MealType = (typeof MEAL_TYPES)[number];
type AmountUnit = 'cup' | 'gm';

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
}

export function LogFoodSheet({ visible, onClose }: LogFoodSheetProps) {
  const insets = useSafeAreaInsets();

  const [mealType, setMealType] = useState<MealType>('Breakfast');
  const [foodBrand, setFoodBrand] = useState('');
  const [amount, setAmount] = useState('2');
  const [amountUnit, setAmountUnit] = useState<AmountUnit>('cup');
  const [timeLabel] = useState('08:30 AM');
  const [notificationsOn] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]} onPress={(e) => e.stopPropagation()}>
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
              <SheetHeroIllustration
                borderColor="#FFE0B2"
                backgroundColor="#FFF8E1"
                heartColor="#F5A623"
              />

              <SectionLabel text="MEAL TYPE" />
              <View style={styles.chipRow}>
                {MEAL_TYPES.map((type) => {
                  const selected = mealType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => setMealType(type)}
                      activeOpacity={0.85}
                    >
                      <AppText
                        variant="bodySmall"
                        weight="600"
                        color={selected ? HomeTheme.white : LogFoodColors.chipText}
                      >
                        {type}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <SectionLabel text="FOOD BRAND" />
              <TextInput
                value={foodBrand}
                onChangeText={setFoodBrand}
                placeholder="e.g. Royal Canin Puppy"
                placeholderTextColor={LogFoodColors.placeholder}
                style={styles.textInput}
              />

              <AppText variant="bodySmall" weight="700" color={LogFoodColors.title} style={styles.amountLabel}>
                Amount
              </AppText>
              <View style={styles.amountRow}>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  style={[styles.textInput, styles.amountInput]}
                />
                <View style={styles.unitToggle}>
                  {(['cup', 'gm'] as AmountUnit[]).map((unit) => {
                    const selected = amountUnit === unit;
                    return (
                      <TouchableOpacity
                        key={unit}
                        style={[styles.unitBtn, selected && styles.unitBtnActive]}
                        onPress={() => setAmountUnit(unit)}
                        activeOpacity={0.85}
                      >
                        <AppText
                          variant="bodySmall"
                          weight="700"
                          color={selected ? HomeTheme.white : LogFoodColors.chipText}
                        >
                          {unit}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.twoColRow}>
                <View style={styles.halfCol}>
                  <SectionLabel text="TIME" />
                  <TouchableOpacity style={styles.pickerField} activeOpacity={0.85}>
                    <AppText variant="bodySmall" weight="600" color={LogFoodColors.inputText}>
                      {timeLabel}
                    </AppText>
                    <Ionicons name="time-outline" size={18} color={LogFoodColors.label} />
                  </TouchableOpacity>
                </View>
                <View style={styles.halfCol}>
                  <SectionLabel text="NOTIFICATIONS" />
                  <TouchableOpacity style={styles.pickerField} activeOpacity={0.85}>
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
                variant="success"
                size="md"
                style={styles.saveBtn}
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
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  amountInput: {
    flex: 1,
    marginBottom: 0,
    minWidth: 80,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: LogFoodColors.inputBg,
    borderRadius: Radius.md,
    padding: 3,
  },
  unitBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    minWidth: 52,
    alignItems: 'center',
  },
  unitBtnActive: {
    backgroundColor: HomeTheme.green,
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
