import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import {
  FormSection,
  FormSegmentedControl,
  FormTimeInput,
  FormToggleRow,
  FormTextInput,
  ThemedTimePicker,
} from '@/components/sheets';
import { ScheduleDateFields } from '@/components/schedule/ScheduleDateFields';
import { HomeTheme } from '@/constants/theme';
import type { VaccinationEntryState } from '@/lib/schedule/types';
import {
  VACCINATION_RECURRENCE_OPTIONS,
  VACCINATION_REMINDER_FREQUENCY_OPTIONS,
} from '@/lib/vaccination/vaccinationForm';

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

  const cardContent = (
    <>
      <FormTextInput
        label="Vaccine Name"
        value={entry.vaccineName}
        onChangeText={(vaccineName) => onChange({ ...entry, vaccineName })}
        placeholder="e.g. Rabies, DHPP"
      />

      <ScheduleDateFields
        value={entry.scheduleDate}
        onChange={(scheduleDate) => onChange({ ...entry, scheduleDate })}
        accentColor={accentColor}
      />

      <FormToggleRow
        label="Remind me before due date"
        value={entry.reminderOn}
        onValueChange={(reminderOn) => onChange({ ...entry, reminderOn })}
        icon="notifications-outline"
      />

      {entry.reminderOn ? (
        <>
          <FormSegmentedControl
            label="Reminder Frequency"
            options={VACCINATION_REMINDER_FREQUENCY_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            selected={entry.frequency}
            onSelect={(frequency) =>
              onChange({ ...entry, frequency: frequency as VaccinationEntryState['frequency'] })
            }
          />
          <FormTimeInput
            label="Reminder Time"
            value={entry.reminderTime}
            onPress={() => setTimePickerVisible(true)}
          />
        </>
      ) : null}

      <FormToggleRow
        label="Recurring vaccination"
        value={entry.isRecurring}
        onValueChange={(isRecurring) => onChange({ ...entry, isRecurring })}
        icon="repeat-outline"
      />

      {entry.isRecurring ? (
        <FormSegmentedControl
          label="Recurrence"
          options={VACCINATION_RECURRENCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          selected={entry.recurrenceInterval}
          onSelect={(recurrenceInterval) =>
            onChange({
              ...entry,
              recurrenceInterval: recurrenceInterval as VaccinationEntryState['recurrenceInterval'],
            })
          }
        />
      ) : null}

      <FormTextInput
        label="Notes"
        value={entry.notes}
        onChangeText={(notes) => onChange({ ...entry, notes })}
        placeholder="Optional details..."
        multiline
      />
    </>
  );

  if (embeddedInSheet) {
    return (
      <>
        <FormSection title="Vaccine details" icon="needle">
          {cardContent}
        </FormSection>
        {pickers}
      </>
    );
  }

  return (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <AppText variant="bodySmall" weight="700" color={HomeTheme.text}>
          Vaccination {index + 1}
        </AppText>
        {canRemove ? (
          <TouchableOpacity onPress={onRemove} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>
      {cardContent}
      {pickers}
    </View>
  );
}

const styles = StyleSheet.create({
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E8EB',
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
});
