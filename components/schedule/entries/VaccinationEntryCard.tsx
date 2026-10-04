import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
  accentColor = '#DB2777',
  accentBg = '#FCE7F3',
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
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconBadge, { backgroundColor: accentBg }]}>
            <MaterialCommunityIcons name="shield-plus-outline" size={16} color={accentColor} />
          </View>
          <AppText variant="caption" weight="800" color="#5C6470" style={styles.sectionHeader}>
            VACCINE DETAILS
          </AppText>
        </View>

        <FormTextInput
          label="Vaccine Name"
          required
          value={entry.vaccineName}
          onChangeText={(vaccineName) => onChange({ ...entry, vaccineName })}
          placeholder="e.g. Rabies, DHPP, Bordetella, Distemper"
          accentColor={accentColor}
        />
      </View>

      {/* Schedule & Timing Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconBadge, { backgroundColor: accentBg }]}>
            <MaterialCommunityIcons name="clock-time-four-outline" size={16} color={accentColor} />
          </View>
          <AppText variant="caption" weight="800" color="#5C6470" style={styles.sectionHeader}>
            SCHEDULE & TIMING
          </AppText>
        </View>

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
          accentColor={accentColor}
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
              accentColor={accentColor}
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
          accentColor={accentColor}
        />

        {entry.isRecurring ? (
          <FormSegmentedControl
            label="Recurrence Interval"
            options={VACCINATION_RECURRENCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            selected={entry.recurrenceInterval}
            accentColor={accentColor}
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
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconBadge, { backgroundColor: accentBg }]}>
            <MaterialCommunityIcons name="note-text-outline" size={16} color={accentColor} />
          </View>
          <AppText variant="caption" weight="800" color="#5C6470" style={styles.sectionHeader}>
            NOTES & INSTRUCTIONS
          </AppText>
        </View>
        <FormTextInput
          label="Instructions & Notes"
          value={entry.notes}
          onChangeText={(notes) => onChange({ ...entry, notes })}
          placeholder="Optional details (veterinarian, batch #, clinic)..."
          multiline
          accentColor={accentColor}
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEEF2',
    padding: 16,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    letterSpacing: 0.8,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEEF2',
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
