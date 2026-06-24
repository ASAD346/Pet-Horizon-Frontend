import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { SectionLabel, SheetOptionPicker, ThemedTimePicker } from '@/components/sheets';
import type { SheetOption } from '@/components/sheets';
import {
  FormChipRow,
  FormMultiChipRow,
  FormPickerField,
  FormSection,
  FormSectionLabel,
  FormSuffixInput,
  FormSwitchRow,
  FormTextField,
  formSheetStyles,
} from '@/components/sheets';
import { ThemedDatePicker } from '@/components/pet/ThemedDatePicker';
import { ScheduleDateFields } from '@/components/schedule/ScheduleDateFields';
import { HomeTheme, Spacing } from '@/constants/theme';
import {
  formatTimeDisplay,
  getReminderMinutesLabel,
  REMINDER_MINUTES_OPTIONS,
} from '@/lib/feeding/feedingForm';
import type { MedicineEntryState } from '@/lib/schedule/types';
import type { DayOfWeekCode } from '@/types/medicine';
import {
  DAYS_OF_WEEK_OPTIONS,
  DOSE_FORM_OPTIONS,
  formatDateLabel,
  FREQUENCY_OPTIONS,
} from '@/lib/medicine/medicineForm';
import { ScheduleColors, scheduleFieldStyles } from '../scheduleStyles';

const REMINDER_OPTIONS: SheetOption[] = REMINDER_MINUTES_OPTIONS.map((o) => ({
  value: String(o.value),
  label: o.label,
}));

interface MedicineEntryCardProps {
  entry: MedicineEntryState;
  index: number;
  accentColor: string;
  accentBg?: string;
  canRemove: boolean;
  embeddedInSheet?: boolean;
  onChange: (next: MedicineEntryState) => void;
  onRemove: () => void;
}

export function MedicineEntryCard({
  entry,
  index,
  accentColor,
  accentBg = '#E8F5E9',
  canRemove,
  embeddedInSheet = false,
  onChange,
  onRemove,
}: MedicineEntryCardProps) {
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);

  const toggleDay = (day: DayOfWeekCode) => {
    const days = entry.daysOfWeek.includes(day)
      ? entry.daysOfWeek.filter((d) => d !== day)
      : [...entry.daysOfWeek, day];
    onChange({ ...entry, daysOfWeek: days });
  };

  const pickers = (
    <>
      <ThemedTimePicker
        visible={timePickerVisible}
        value={entry.medicineTime}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={(date) => {
          onChange({ ...entry, medicineTime: date });
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
    </>
  );

  if (embeddedInSheet) {
    return (
      <>
        <FormSection title="Medicine info" icon="pill" accentColor={accentColor} accentBg={accentBg}>
          <FormSectionLabel text="NAME" />
          <FormTextField
            value={entry.medicineName}
            onChangeText={(medicineName) => onChange({ ...entry, medicineName })}
            placeholder="e.g. Amoxicillin"
            accentColor={accentColor}
          />
          <View style={formSheetStyles.twoColRow}>
            <View style={[formSheetStyles.halfCol, { flex: 1.1 }]}>
              <FormSectionLabel text="DOSE" />
              <FormSuffixInput
                value={entry.doseAmount}
                onChangeText={(doseAmount) => onChange({ ...entry, doseAmount })}
                suffix={entry.doseForm === 'tablet' ? 'qty' : 'ml'}
                accentColor={accentColor}
              />
            </View>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="SUPPLY" />
              <FormSuffixInput
                value={entry.totalPills}
                onChangeText={(totalPills) => onChange({ ...entry, totalPills })}
                suffix="pills"
                keyboardType="number-pad"
                placeholder="30"
                accentColor={accentColor}
              />
            </View>
          </View>
          <FormSectionLabel text="FORM" />
          <FormChipRow
            options={DOSE_FORM_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            selected={entry.doseForm}
            onSelect={(doseForm) => onChange({ ...entry, doseForm: doseForm as MedicineEntryState['doseForm'] })}
            accentColor={accentColor}
          />
        </FormSection>

        <FormSection title="Schedule & reminders" icon="calendar-clock" accentColor={accentColor} accentBg={accentBg}>
          <FormSectionLabel text="FREQUENCY" />
          <FormChipRow
            options={FREQUENCY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            selected={entry.frequency}
            onSelect={(frequency) =>
              onChange({
                ...entry,
                frequency: frequency as MedicineEntryState['frequency'],
                daysOfWeek: frequency === 'weekly' ? entry.daysOfWeek : [],
              })
            }
            accentColor={accentColor}
          />
          {entry.frequency === 'weekly' ? (
            <>
              <FormSectionLabel text="DAYS" />
              <FormMultiChipRow
                options={DAYS_OF_WEEK_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                selected={entry.daysOfWeek}
                onToggle={(value) => toggleDay(value as DayOfWeekCode)}
                accentColor={accentColor}
              />
            </>
          ) : null}
          <View style={[formSheetStyles.twoColRow, { marginBottom: Spacing.sm }]}>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="TIME" />
              <FormPickerField
                label={formatTimeDisplay(entry.medicineTime)}
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
                  value={entry.reminderOn}
                  onValueChange={(reminderOn) => onChange({ ...entry, reminderOn })}
                  trackColor={{ false: '#E2E8F0', true: accentColor }}
                  thumbColor={HomeTheme.white}
                  ios_backgroundColor="#E2E8F0"
                />
              </View>
            </View>
          </View>
          <ScheduleDateFields
            value={entry.scheduleDate}
            onChange={(scheduleDate) => onChange({ ...entry, scheduleDate })}
            accentColor={accentColor}
          />
          {entry.reminderOn ? (
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
            placeholder="Optional instructions..."
            multiline
            accentColor={accentColor}
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
          Medicine {index + 1}
        </AppText>
        {canRemove ? (
          <TouchableOpacity onPress={onRemove} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color={ScheduleColors.label} />
          </TouchableOpacity>
        ) : null}
      </View>

      <SectionLabel text="MEDICINE NAME" />
      <TextInput
        value={entry.medicineName}
        onChangeText={(medicineName) => onChange({ ...entry, medicineName })}
        placeholder="e.g. Amoxicillin"
        placeholderTextColor={ScheduleColors.placeholder}
        style={scheduleFieldStyles.textInput}
      />

      <View style={scheduleFieldStyles.twoColRow}>
        <View style={scheduleFieldStyles.halfCol}>
          <SectionLabel text="DOSE" />
          <View style={scheduleFieldStyles.suffixInputWrap}>
            <TextInput
              value={entry.doseAmount}
              onChangeText={(doseAmount) => onChange({ ...entry, doseAmount })}
              keyboardType="decimal-pad"
              style={[
                scheduleFieldStyles.suffixInput,
                {
                  borderWidth: 0,
                  borderStyle: 'none',
                  backgroundColor: 'transparent',
                } as any
              ]}
            />
            <AppText variant="caption" weight="600" color={ScheduleColors.label}>
              {entry.doseForm === 'tablet' ? 'qty' : 'ml'}
            </AppText>
          </View>
        </View>
        <View style={scheduleFieldStyles.halfCol}>
          <SectionLabel text="FORM" />
          <View style={scheduleFieldStyles.chipRow}>
            {DOSE_FORM_OPTIONS.map((option) => {
              const selected = entry.doseForm === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    scheduleFieldStyles.chip,
                    selected && { backgroundColor: accentColor, borderColor: accentColor },
                  ]}
                  onPress={() => onChange({ ...entry, doseForm: option.value })}
                >
                  <AppText variant="caption" weight="600" color={selected ? HomeTheme.white : HomeTheme.text}>
                    {option.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <SectionLabel text="FREQUENCY" />
      <View style={scheduleFieldStyles.chipRow}>
        {FREQUENCY_OPTIONS.map((option) => {
          const selected = entry.frequency === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                scheduleFieldStyles.chip,
                selected && { backgroundColor: accentColor, borderColor: accentColor },
              ]}
              onPress={() =>
                onChange({
                  ...entry,
                  frequency: option.value,
                  daysOfWeek: option.value === 'weekly' ? entry.daysOfWeek : [],
                })
              }
            >
              <AppText variant="caption" weight="600" color={selected ? HomeTheme.white : HomeTheme.text}>
                {option.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {entry.frequency === 'weekly' ? (
        <>
          <SectionLabel text="DAYS" />
          <View style={scheduleFieldStyles.chipRow}>
            {DAYS_OF_WEEK_OPTIONS.map((option) => {
              const selected = entry.daysOfWeek.includes(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    scheduleFieldStyles.chip,
                    selected && { backgroundColor: accentColor, borderColor: accentColor },
                  ]}
                  onPress={() => toggleDay(option.value)}
                >
                  <AppText variant="caption" weight="600" color={selected ? HomeTheme.white : HomeTheme.text}>
                    {option.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : null}

      <SectionLabel text="TIME" />
      <TouchableOpacity
        style={scheduleFieldStyles.pickerField}
        onPress={() => setTimePickerVisible(true)}
        activeOpacity={0.85}
      >
        <AppText variant="bodySmall" weight="600" color={ScheduleColors.fieldText}>
          {formatTimeDisplay(entry.medicineTime)}
        </AppText>
        <Ionicons name="time-outline" size={18} color={ScheduleColors.label} />
      </TouchableOpacity>

      <ScheduleDateFields
        value={entry.scheduleDate}
        onChange={(scheduleDate) => onChange({ ...entry, scheduleDate })}
        accentColor={accentColor}
      />

      <SectionLabel text="TOTAL QUANTITY" />
      <View style={scheduleFieldStyles.suffixInputWrap}>
        <TextInput
          value={entry.totalPills}
          onChangeText={(totalPills) => onChange({ ...entry, totalPills })}
          keyboardType="number-pad"
          style={[
            scheduleFieldStyles.suffixInput,
            {
              borderWidth: 0,
              borderStyle: 'none',
              backgroundColor: 'transparent',
            } as any
          ]}
          placeholder="30"
          placeholderTextColor={ScheduleColors.placeholder}
        />
        <AppText variant="caption" weight="600" color={ScheduleColors.label}>
          pills
        </AppText>
      </View>

      <SectionLabel text="NOTIFICATIONS" />
      <View style={scheduleFieldStyles.switchRow}>
        <AppText variant="bodySmall" weight="600" color={ScheduleColors.fieldText}>
          Remind me
        </AppText>
        <Switch
          value={entry.reminderOn}
          onValueChange={(reminderOn) => onChange({ ...entry, reminderOn })}
          trackColor={{ false: '#E0E0E0', true: accentColor }}
          thumbColor={HomeTheme.white}
          ios_backgroundColor="#E0E0E0"
        />
      </View>

      {entry.reminderOn ? (
        <>
          <SectionLabel text="REMINDER" />
          <TouchableOpacity
            style={scheduleFieldStyles.pickerField}
            onPress={() => setReminderPickerVisible(true)}
            activeOpacity={0.85}
          >
            <AppText variant="bodySmall" weight="600" color={ScheduleColors.fieldText}>
              {getReminderMinutesLabel(entry.reminderMinutes)}
            </AppText>
            <Ionicons name="chevron-down" size={18} color={ScheduleColors.label} />
          </TouchableOpacity>
        </>
      ) : null}

      <SectionLabel text="NOTES (OPTIONAL)" />
      <TextInput
        value={entry.notes}
        onChangeText={(notes) => onChange({ ...entry, notes })}
        placeholder="Add any extra details..."
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
