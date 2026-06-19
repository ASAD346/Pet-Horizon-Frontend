import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { SectionLabel, ThemedTimePicker } from '@/components/sheets';
import {
  FormChipRow,
  FormPickerField,
  FormSection,
  FormSectionLabel,
  FormSwitchRow,
  FormTextField,
} from '@/components/sheets';
import { ThemedDatePicker } from '@/components/pet/ThemedDatePicker';
import { HomeTheme } from '@/constants/theme';
import { formatTimeDisplay } from '@/lib/feeding/feedingForm';
import type { VaccinationEntryState } from '@/lib/schedule/types';
import {
  defaultDueDate,
  formatDateLabel,
  VACCINATION_RECURRENCE_OPTIONS,
  VACCINATION_REMINDER_FREQUENCY_OPTIONS,
} from '@/lib/vaccination/vaccinationForm';
import { ScheduleColors, scheduleFieldStyles } from '../scheduleStyles';

interface VaccinationEntryCardProps {
  entry: VaccinationEntryState;
  index: number;
  accentColor: string;
  accentBg?: string;
  canRemove: boolean;
  embeddedInSheet?: boolean;
  onChange: (next: VaccinationEntryState) => void;
  onRemove: () => void;
}

export function VaccinationEntryCard({
  entry,
  index,
  accentColor,
  accentBg = '#E3F2FD',
  canRemove,
  embeddedInSheet = false,
  onChange,
  onRemove,
}: VaccinationEntryCardProps) {
  const [duePickerVisible, setDuePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const pickers = (
    <>
      <ThemedDatePicker
        visible={duePickerVisible}
        title="Due date"
        value={entry.dueDate ?? defaultDueDate()}
        onClose={() => setDuePickerVisible(false)}
        onConfirm={(date) => {
          onChange({ ...entry, dueDate: date });
          setDuePickerVisible(false);
        }}
      />
      <ThemedTimePicker
        visible={timePickerVisible}
        value={entry.reminderTime}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={(date) => {
          onChange({ ...entry, reminderTime: date });
          setTimePickerVisible(false);
        }}
      />
    </>
  );

  if (embeddedInSheet) {
    return (
      <>
        <FormSection title="Vaccine details" icon="needle" accentColor={accentColor} accentBg={accentBg}>
          <FormSectionLabel text="VACCINE NAME" />
          <FormTextField
            value={entry.vaccineName}
            onChangeText={(vaccineName) => onChange({ ...entry, vaccineName })}
            placeholder="e.g. Rabies, DHPP"
          />
          <FormSectionLabel text="DUE DATE" />
          <FormPickerField
            label={entry.dueDate ? formatDateLabel(entry.dueDate) : 'Select date'}
            icon="calendar-outline"
            onPress={() => setDuePickerVisible(true)}
          />
        </FormSection>

        <FormSection title="Reminders" icon="bell-outline" accentColor={accentColor} accentBg={accentBg}>
          <FormSwitchRow
            label="Remind me before due date"
            value={entry.reminderOn}
            onValueChange={(reminderOn) => onChange({ ...entry, reminderOn })}
            accentColor={accentColor}
          />
          {entry.reminderOn ? (
            <>
              <FormSectionLabel text="REMIND ME" />
              <FormChipRow
                options={VACCINATION_REMINDER_FREQUENCY_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                selected={entry.frequency}
                onSelect={(frequency) =>
                  onChange({ ...entry, frequency: frequency as VaccinationEntryState['frequency'] })
                }
                accentColor={accentColor}
              />
              <FormSectionLabel text="REMINDER TIME" />
              <FormPickerField
                label={formatTimeDisplay(entry.reminderTime)}
                icon="time-outline"
                onPress={() => setTimePickerVisible(true)}
              />
            </>
          ) : null}
        </FormSection>

        <FormSection title="Recurrence" icon="repeat" accentColor={accentColor} accentBg={accentBg}>
          <FormSwitchRow
            label={entry.isRecurring ? 'Repeats automatically' : 'One-time vaccine'}
            value={entry.isRecurring}
            onValueChange={(isRecurring) => onChange({ ...entry, isRecurring })}
            accentColor={accentColor}
          />
          {entry.isRecurring ? (
            <>
              <FormSectionLabel text="REPEAT EVERY" />
              <FormChipRow
                options={VACCINATION_RECURRENCE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                selected={entry.recurrenceInterval}
                onSelect={(recurrenceInterval) =>
                  onChange({
                    ...entry,
                    recurrenceInterval: recurrenceInterval as VaccinationEntryState['recurrenceInterval'],
                  })
                }
                accentColor={accentColor}
              />
            </>
          ) : null}
        </FormSection>

        <FormSection title="Notes" icon="text-box-outline" accentColor={accentColor} accentBg={accentBg}>
          <FormTextField
            value={entry.notes}
            onChangeText={(notes) => onChange({ ...entry, notes })}
            placeholder="Clinic, batch number..."
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
          Vaccine {index + 1}
        </AppText>
        {canRemove ? (
          <TouchableOpacity onPress={onRemove} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color={ScheduleColors.label} />
          </TouchableOpacity>
        ) : null}
      </View>

      <SectionLabel text="VACCINE NAME" />
      <TextInput
        value={entry.vaccineName}
        onChangeText={(vaccineName) => onChange({ ...entry, vaccineName })}
        placeholder="e.g. Rabies, DHPP"
        placeholderTextColor={ScheduleColors.placeholder}
        style={scheduleFieldStyles.textInput}
      />

      <SectionLabel text="DUE DATE" />
      <TouchableOpacity
        style={scheduleFieldStyles.pickerField}
        onPress={() => setDuePickerVisible(true)}
      >
        <AppText variant="bodySmall" weight="600" color={ScheduleColors.fieldText}>
          {entry.dueDate ? formatDateLabel(entry.dueDate) : 'Select date'}
        </AppText>
        <Ionicons name="calendar-outline" size={18} color={ScheduleColors.label} />
      </TouchableOpacity>

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
          <SectionLabel text="REMIND ME" />
          <View style={scheduleFieldStyles.chipRow}>
            {VACCINATION_REMINDER_FREQUENCY_OPTIONS.map((option) => {
              const selected = entry.frequency === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[scheduleFieldStyles.chip, selected && { backgroundColor: accentColor }]}
                  onPress={() => onChange({ ...entry, frequency: option.value })}
                >
                  <AppText variant="caption" weight="600" color={selected ? HomeTheme.white : HomeTheme.text}>
                    {option.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          <SectionLabel text="REMINDER TIME" />
          <TouchableOpacity
            style={scheduleFieldStyles.pickerField}
            onPress={() => setTimePickerVisible(true)}
          >
            <AppText variant="bodySmall" weight="600" color={ScheduleColors.fieldText}>
              {formatTimeDisplay(entry.reminderTime)}
            </AppText>
            <Ionicons name="time-outline" size={18} color={ScheduleColors.label} />
          </TouchableOpacity>
        </>
      ) : null}

      <SectionLabel text="RECURRING" />
      <TouchableOpacity
        style={[
          scheduleFieldStyles.notifyBtn,
          entry.isRecurring && { backgroundColor: accentColor },
        ]}
        onPress={() => onChange({ ...entry, isRecurring: !entry.isRecurring })}
      >
        <Ionicons
          name={entry.isRecurring ? 'repeat' : 'repeat-outline'}
          size={18}
          color={entry.isRecurring ? HomeTheme.white : HomeTheme.text}
        />
        <AppText variant="caption" weight="700" color={entry.isRecurring ? HomeTheme.white : HomeTheme.text}>
          {entry.isRecurring ? 'Repeats automatically' : 'One-time'}
        </AppText>
      </TouchableOpacity>

      {entry.isRecurring ? (
        <>
          <SectionLabel text="REPEAT EVERY" />
          <View style={scheduleFieldStyles.chipRow}>
            {VACCINATION_RECURRENCE_OPTIONS.map((option) => {
              const selected = entry.recurrenceInterval === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[scheduleFieldStyles.chip, selected && { backgroundColor: accentColor }]}
                  onPress={() => onChange({ ...entry, recurrenceInterval: option.value })}
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

      <SectionLabel text="NOTES (OPTIONAL)" />
      <TextInput
        value={entry.notes}
        onChangeText={(notes) => onChange({ ...entry, notes })}
        placeholder="Clinic, batch number..."
        placeholderTextColor={ScheduleColors.placeholder}
        style={[scheduleFieldStyles.textInput, scheduleFieldStyles.notesInput]}
        multiline
      />

      {pickers}
    </View>
  );
}
