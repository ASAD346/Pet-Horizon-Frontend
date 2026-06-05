import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { SectionLabel, ThemedTimePicker } from '@/components/sheets';
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
  canRemove: boolean;
  onChange: (next: VaccinationEntryState) => void;
  onRemove: () => void;
}

export function VaccinationEntryCard({
  entry,
  index,
  accentColor,
  canRemove,
  onChange,
  onRemove,
}: VaccinationEntryCardProps) {
  const [duePickerVisible, setDuePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

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

      <SectionLabel text="REMINDER" />
      <TouchableOpacity
        style={[
          scheduleFieldStyles.notifyBtn,
          entry.reminderOn && { backgroundColor: accentColor },
        ]}
        onPress={() => onChange({ ...entry, reminderOn: !entry.reminderOn })}
      >
        <Ionicons
          name={entry.reminderOn ? 'notifications' : 'notifications-off-outline'}
          size={18}
          color={entry.reminderOn ? HomeTheme.white : HomeTheme.text}
        />
        <AppText variant="caption" weight="700" color={entry.reminderOn ? HomeTheme.white : HomeTheme.text}>
          {entry.reminderOn ? 'On' : 'Off'}
        </AppText>
      </TouchableOpacity>

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
    </View>
  );
}
