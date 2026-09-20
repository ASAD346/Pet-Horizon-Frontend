import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import {
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
  accentColor = '#0EA5E9',
  accentBg = '#E0F2FE',
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
    <View style={styles.formContainer}>
      {/* Vaccine Details Card */}
      <View style={styles.sectionCard}>
        <AppText variant="caption" weight="700" color="#64748B" style={styles.sectionHeader}>
          VACCINE DETAILS
        </AppText>

        <FormTextInput
          label="Vaccine Name"
          required
          value={entry.vaccineName}
          onChangeText={(vaccineName) => onChange({ ...entry, vaccineName })}
          placeholder="e.g. Rabies, DHPP, Bordetella, Distemper"
        />
      </View>

      {/* Schedule & Timing Card */}
      <View style={styles.sectionCard}>
        <AppText variant="caption" weight="700" color="#64748B" style={styles.sectionHeader}>
          SCHEDULE & TIMING
        </AppText>

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
            label="Recurrence Interval"
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
      </View>

      {/* Notes Card */}
      <View style={styles.sectionCard}>
        <FormTextInput
          label="Instructions & Notes"
          value={entry.notes}
          onChangeText={(notes) => onChange({ ...entry, notes })}
          placeholder="Optional details (veterinarian, batch #, clinic)..."
          multiline
        />
      </View>
    </View>
  );

  if (embeddedInSheet) {
    return (
      <>
        {cardContent}
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
  formContainer: {
    gap: 14,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
  },
  sectionHeader: {
    letterSpacing: 0.6,
    marginBottom: -2,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
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
