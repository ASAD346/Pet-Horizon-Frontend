import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput, Switch } from 'react-native';
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
import { HomeTheme } from '@/constants/theme';
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
  isStartBeforeOrEqualEnd,
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
  const [startPickerVisible, setStartPickerVisible] = useState(false);
  const [endPickerVisible, setEndPickerVisible] = useState(false);
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
      <ThemedDatePicker
        visible={startPickerVisible}
        title="Start date"
        value={entry.startDate ?? new Date()}
        maximumDate={entry.endDate ?? undefined}
        onClose={() => setStartPickerVisible(false)}
        onConfirm={(date) => {
          const next = { ...entry, startDate: date };
          if (entry.endDate && !isStartBeforeOrEqualEnd(date, entry.endDate)) next.endDate = null;
          onChange(next);
          setStartPickerVisible(false);
        }}
      />
      <ThemedDatePicker
        visible={endPickerVisible}
        title="End date"
        value={entry.endDate ?? entry.startDate ?? new Date()}
        minimumDate={entry.startDate ?? undefined}
        onClose={() => setEndPickerVisible(false)}
        onConfirm={(date) => {
          onChange({ ...entry, endDate: date });
          setEndPickerVisible(false);
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
          />
          <View style={formSheetStyles.twoColRow}>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="DOSE" />
              <FormSuffixInput
                value={entry.doseAmount}
                onChangeText={(doseAmount) => onChange({ ...entry, doseAmount })}
                suffix={entry.doseForm === 'tablet' ? 'qty' : 'ml'}
              />
            </View>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="FORM" />
              <FormChipRow
                options={DOSE_FORM_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                selected={entry.doseForm}
                onSelect={(doseForm) => onChange({ ...entry, doseForm: doseForm as MedicineEntryState['doseForm'] })}
                accentColor={accentColor}
              />
            </View>
          </View>
          <FormSectionLabel text="TOTAL QUANTITY" />
          <FormSuffixInput
            value={entry.totalPills}
            onChangeText={(totalPills) => onChange({ ...entry, totalPills })}
            suffix="pills"
            keyboardType="number-pad"
            placeholder="30"
          />
        </FormSection>

        <FormSection title="Schedule" icon="calendar-clock" accentColor={accentColor} accentBg={accentBg}>
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
          <FormSectionLabel text="TIME" />
          <FormPickerField
            label={formatTimeDisplay(entry.medicineTime)}
            icon="time-outline"
            onPress={() => setTimePickerVisible(true)}
          />
          <View style={formSheetStyles.twoColRow}>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="START" />
              <FormPickerField
                label={entry.startDate ? formatDateLabel(entry.startDate) : 'Not set'}
                icon="calendar-outline"
                onPress={() => setStartPickerVisible(true)}
              />
            </View>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="END" />
              <FormPickerField
                label={entry.endDate ? formatDateLabel(entry.endDate) : 'Not set'}
                icon="calendar-outline"
                onPress={() => setEndPickerVisible(true)}
              />
            </View>
          </View>
        </FormSection>

        <FormSection title="Reminders & notes" icon="bell-outline" accentColor={accentColor} accentBg={accentBg}>
          <FormSwitchRow
            label="Remind me to give medicine"
            value={entry.reminderOn}
            onValueChange={(reminderOn) => onChange({ ...entry, reminderOn })}
            accentColor={accentColor}
          />
          {entry.reminderOn ? (
            <>
              <FormSectionLabel text="REMINDER TIMING" />
              <FormPickerField
                label={getReminderMinutesLabel(entry.reminderMinutes)}
                icon="chevron-down"
                onPress={() => setReminderPickerVisible(true)}
              />
            </>
          ) : null}
          <FormSectionLabel text="NOTES" />
          <FormTextField
            value={entry.notes}
            onChangeText={(notes) => onChange({ ...entry, notes })}
            placeholder="Instructions, vet name..."
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
              style={scheduleFieldStyles.suffixInput}
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

      <View style={scheduleFieldStyles.twoColRow}>
        <View style={scheduleFieldStyles.halfCol}>
          <SectionLabel text="START DATE" />
          <TouchableOpacity
            style={scheduleFieldStyles.pickerField}
            onPress={() => setStartPickerVisible(true)}
            activeOpacity={0.85}
          >
            <AppText variant="bodySmall" weight="600" color={ScheduleColors.fieldText}>
              {entry.startDate ? formatDateLabel(entry.startDate) : 'Not set'}
            </AppText>
            <Ionicons name="calendar-outline" size={18} color={ScheduleColors.label} />
          </TouchableOpacity>
        </View>
        <View style={scheduleFieldStyles.halfCol}>
          <SectionLabel text="END DATE" />
          <TouchableOpacity
            style={scheduleFieldStyles.pickerField}
            onPress={() => setEndPickerVisible(true)}
            activeOpacity={0.85}
          >
            <AppText variant="bodySmall" weight="600" color={ScheduleColors.fieldText}>
              {entry.endDate ? formatDateLabel(entry.endDate) : 'Not set'}
            </AppText>
            <Ionicons name="calendar-outline" size={18} color={ScheduleColors.label} />
          </TouchableOpacity>
        </View>
      </View>

      <SectionLabel text="TOTAL QUANTITY" />
      <View style={scheduleFieldStyles.suffixInputWrap}>
        <TextInput
          value={entry.totalPills}
          onChangeText={(totalPills) => onChange({ ...entry, totalPills })}
          keyboardType="number-pad"
          style={scheduleFieldStyles.suffixInput}
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
