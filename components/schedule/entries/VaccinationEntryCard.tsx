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
import { ScheduleDateFields } from '@/components/schedule/ScheduleDateFields';
import { HomeTheme } from '@/constants/theme';
import { formatTimeDisplay } from '@/lib/feeding/feedingForm';
import type { VaccinationEntryState } from '@/lib/schedule/types';
import {
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
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const pickers = (
    <ThemedTimePicker
      visible={timePickerVisible}
      value={entry.reminderTime}
      onClose={() => setTimePickerVisible(false)}
      onConfirm={(date) => {
        onChange({ ...entry, reminderTime: date });
        setTimePickerVisible(false);
      }}
    />
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
            accentColor={accentColor}
          />
          <ScheduleDateFields
            value={entry.scheduleDate}
            onChange={(scheduleDate) => onChange({ ...entry, scheduleDate })}
            accentColor={accentColor}
          />
          <FormSwitchRow
            label="Remind me before due date"
            value={entry.reminderOn}
            onValueChange={(reminderOn) => onChange({ ...entry, reminderOn })}
            accentColor={accentColor}
            icon="notifications-outline"
          />
          {entry.reminderOn ? (
            <>
              <FormSectionLabel text="REMINDER FREQUENCY" />
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
          <FormSwitchRow
            label="Recurring vaccination"
            value={entry.isRecurring}
            onValueChange={(isRecurring) => onChange({ ...entry, isRecurring })}
            accentColor={accentColor}
            icon="repeat-outline"
          />
          {entry.isRecurring ? (
            <>
              <FormSectionLabel text="RECURRENCE" />
              <FormChipRow
                options={VACCINATION_RECURRENCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
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
          <FormSectionLabel text="NOTES" />
          <FormTextField
            value={entry.notes}
            onChangeText={(notes) => onChange({ ...entry, notes })}
            placeholder="Optional details..."
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
          Vaccination {index + 1}
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
        placeholder="e.g. Rabies"
        placeholderTextColor={ScheduleColors.placeholder}
        style={scheduleFieldStyles.textInput}
      />

      <ScheduleDateFields
        value={entry.scheduleDate}
        onChange={(scheduleDate) => onChange({ ...entry, scheduleDate })}
        accentColor={accentColor}
      />

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
          <SectionLabel text="REMINDER TIME" />
          <TouchableOpacity
            style={scheduleFieldStyles.pickerField}
            onPress={() => setTimePickerVisible(true)}
            activeOpacity={0.85}
          >
            <AppText variant="bodySmall" weight="600" color={ScheduleColors.fieldText}>
              {formatTimeDisplay(entry.reminderTime)}
            </AppText>
            <Ionicons name="time-outline" size={18} color={ScheduleColors.label} />
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
