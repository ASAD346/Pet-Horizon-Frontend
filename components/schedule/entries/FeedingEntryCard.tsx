import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import {
  FormChipRow,
  FormPickerField,
  FormSection,
  FormSectionLabel,
  FormSwitchRow,
  FormTextField,
  SectionLabel,
  SheetOptionPicker,
  ThemedTimePicker,
  formSheetStyles,
} from '@/components/sheets';
import type { SheetOption } from '@/components/sheets';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import {
  formatTimeDisplay,
  getReminderMinutesLabel,
  REMINDER_MINUTES_OPTIONS,
} from '@/lib/feeding/feedingForm';
import type { FeedingEntryState } from '@/lib/schedule/types';
import { ScheduleDateFields } from '@/components/schedule/ScheduleDateFields';
import { ScheduleColors, scheduleFieldStyles } from '../scheduleStyles';

const REMINDER_OPTIONS: SheetOption[] = REMINDER_MINUTES_OPTIONS.map((o) => ({
  value: String(o.value),
  label: o.label,
}));

interface FeedingEntryCardProps {
  entry: FeedingEntryState;
  index: number;
  accentColor: string;
  accentBg?: string;
  mealTypeOptions: { value: string; label: string }[];
  unitOptions: { value: string; label: string }[];
  canRemove: boolean;
  embeddedInSheet?: boolean;
  onChange: (next: FeedingEntryState) => void;
  onRemove: () => void;
}

export function FeedingEntryCard({
  entry,
  index,
  accentColor,
  accentBg = '#FFF5F5',
  mealTypeOptions,
  unitOptions,
  canRemove,
  embeddedInSheet = false,
  onChange,
  onRemove,
}: FeedingEntryCardProps) {
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);
  const [unitPickerVisible, setUnitPickerVisible] = useState(false);

  const mappedUnitOptions: SheetOption[] = unitOptions.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  const pickers = (
    <>
      <ThemedTimePicker
        visible={timePickerVisible}
        value={entry.feedingTime}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={(date) => {
          onChange({ ...entry, feedingTime: date });
          setTimePickerVisible(false);
        }}
      />
      <SheetOptionPicker
        visible={reminderPickerVisible}
        title="Remind me after"
        options={REMINDER_OPTIONS}
        selectedValue={String(entry.reminderMinutes)}
        onClose={() => setReminderPickerVisible(false)}
        onSelect={(value) => onChange({ ...entry, reminderMinutes: Number(value) })}
      />
      <SheetOptionPicker
        visible={unitPickerVisible}
        title="Select Unit"
        options={mappedUnitOptions}
        selectedValue={entry.unit}
        onClose={() => setUnitPickerVisible(false)}
        onSelect={(value) => {
          onChange({ ...entry, unit: value });
          setUnitPickerVisible(false);
        }}
      />
    </>
  );

  if (embeddedInSheet) {
    return (
      <>
        <FormSection title="Meal details" icon="bowl-mix-outline" accentColor={accentColor} accentBg={accentBg}>
          <FormSectionLabel text="MEAL TYPE" />
          <FormChipRow
            options={mealTypeOptions}
            selected={entry.mealType}
            onSelect={(mealType) => onChange({ ...entry, mealType })}
            accentColor={accentColor}
          />
          <View style={formSheetStyles.twoColRow}>
            <View style={[formSheetStyles.halfCol, { flex: 1.15 }]}>
              <FormSectionLabel text="AMOUNT" />
              <FormTextField
                value={entry.amount}
                onChangeText={(amount) => onChange({ ...entry, amount })}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="UNIT" />
              <FormPickerField
                label={unitOptions.find((o) => o.value === entry.unit)?.label || entry.unit || 'Select'}
                icon="scale-outline"
                onPress={() => setUnitPickerVisible(true)}
              />
            </View>
          </View>
        </FormSection>

        <FormSection title="Schedule & reminders" icon="calendar-clock" accentColor={accentColor} accentBg={accentBg}>
          <ScheduleDateFields
            value={entry.scheduleDate}
            onChange={(scheduleDate) => onChange({ ...entry, scheduleDate })}
            accentColor={accentColor}
          />
          <View style={[formSheetStyles.twoColRow, { marginBottom: Spacing.sm }]}>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="TIME" />
              <FormPickerField
                label={formatTimeDisplay(entry.feedingTime)}
                icon="time-outline"
                onPress={() => setTimePickerVisible(true)}
              />
            </View>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="NOTIFICATIONS" />
              <View style={[formSheetStyles.switchRow, styles.switchContainer]}>
                <AppText variant="bodySmall" weight="600" color={HomeTheme.text}>
                  Remind me
                </AppText>
                <Switch
                  value={entry.notificationsOn}
                  onValueChange={(notificationsOn) => onChange({ ...entry, notificationsOn })}
                  trackColor={{ false: '#E2E8F0', true: accentColor }}
                  thumbColor={HomeTheme.white}
                  ios_backgroundColor="#E2E8F0"
                />
              </View>
            </View>
          </View>

          {entry.notificationsOn ? (
            <View style={{ marginBottom: Spacing.sm }}>
              <FormSectionLabel text="REMINDER DELAY" />
              <FormPickerField
                label={getReminderMinutesLabel(entry.reminderMinutes)}
                icon="notifications-outline"
                onPress={() => setReminderPickerVisible(true)}
              />
            </View>
          ) : null}

          <FormSectionLabel text="NOTES" />
          <FormTextField
            value={entry.notes}
            onChangeText={(notes) => onChange({ ...entry, notes })}
            placeholder="Optional details..."
            multiline
          />
        </FormSection>

        {pickers}
      </>
    );
  }

  return (
    <View style={scheduleFieldStyles.entryCard}>
      <View style={scheduleFieldStyles.entryHeader}>
        <AppText variant="bodySmall" weight="700" color={HomeTheme.text}>
          Meal {index + 1}
        </AppText>
        {canRemove ? (
          <TouchableOpacity onPress={onRemove} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color={ScheduleColors.label} />
          </TouchableOpacity>
        ) : null}
      </View>

      <SectionLabel text="MEAL TYPE" />
      <View style={scheduleFieldStyles.chipRow}>
        {mealTypeOptions.map((option) => {
          const selected = entry.mealType === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[scheduleFieldStyles.chip, selected && { backgroundColor: accentColor }]}
              onPress={() => onChange({ ...entry, mealType: option.value })}
            >
              <AppText variant="caption" weight="600" color={selected ? HomeTheme.white : HomeTheme.text}>
                {option.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <AppText variant="caption" weight="700" color={HomeTheme.text} style={scheduleFieldStyles.fieldLabel}>
        Amount
      </AppText>
      <TextInput
        value={entry.amount}
        onChangeText={(amount) => onChange({ ...entry, amount })}
        keyboardType="decimal-pad"
        style={scheduleFieldStyles.textInput}
      />

      <SectionLabel text="UNIT" />
      <View style={scheduleFieldStyles.chipRow}>
        {unitOptions.map((option) => {
          const selected = entry.unit === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[scheduleFieldStyles.chip, selected && { backgroundColor: accentColor }]}
              onPress={() => onChange({ ...entry, unit: option.value })}
            >
              <AppText variant="caption" weight="600" color={selected ? HomeTheme.white : HomeTheme.text}>
                {option.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={scheduleFieldStyles.twoColRow}>
        <View style={scheduleFieldStyles.halfCol}>
          <SectionLabel text="TIME" />
          <TouchableOpacity style={scheduleFieldStyles.pickerField} onPress={() => setTimePickerVisible(true)}>
            <AppText variant="bodySmall" weight="600" color={ScheduleColors.fieldText}>
              {formatTimeDisplay(entry.feedingTime)}
            </AppText>
            <Ionicons name="time-outline" size={18} color={ScheduleColors.label} />
          </TouchableOpacity>
        </View>
        <View style={scheduleFieldStyles.halfCol}>
          <SectionLabel text="NOTIFICATIONS" />
          <View style={scheduleFieldStyles.switchRow}>
            <AppText variant="bodySmall" weight="600" color={ScheduleColors.fieldText}>
              Remind me
            </AppText>
            <Switch
              value={entry.notificationsOn}
              onValueChange={(notificationsOn) => onChange({ ...entry, notificationsOn })}
              trackColor={{ false: '#E0E0E0', true: accentColor }}
              thumbColor={HomeTheme.white}
              ios_backgroundColor="#E0E0E0"
            />
          </View>
        </View>
      </View>

      {entry.notificationsOn ? (
        <>
          <SectionLabel text="REMINDER" />
          <TouchableOpacity style={scheduleFieldStyles.pickerField} onPress={() => setReminderPickerVisible(true)}>
            <AppText variant="bodySmall" weight="600" color={ScheduleColors.fieldText}>
              {getReminderMinutesLabel(entry.reminderMinutes)}
            </AppText>
            <Ionicons name="chevron-down" size={18} color={ScheduleColors.label} />
          </TouchableOpacity>
        </>
      ) : null}

      <SectionLabel text="NOTES" />
      <TextInput
        value={entry.notes}
        onChangeText={(notes) => onChange({ ...entry, notes })}
        placeholder="Extra details..."
        placeholderTextColor={ScheduleColors.placeholder}
        style={[scheduleFieldStyles.textInput, scheduleFieldStyles.notesInput]}
        multiline
      />

      {pickers}
    </View>
  );
}

const styles = StyleSheet.create({
  switchContainer: {
    minHeight: 44,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
});
