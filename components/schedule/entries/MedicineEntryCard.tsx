import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import {
  FormSection,
  FormSegmentedControl,
  FormTimeInput,
  FormNumberInput,
  FormSelectInput,
  FormToggleRow,
  FormTextInput,
  ThemedTimePicker,
  SheetOptionPicker,
} from '@/components/sheets';
import type { SheetOption } from '@/components/sheets';
import { HomeTheme } from '@/constants/theme';
import {
  formatTimeDisplay,
  getReminderMinutesLabel,
  REMINDER_MINUTES_OPTIONS,
} from '@/lib/feeding/feedingForm';
import type { MedicineEntryState } from '@/lib/schedule/types';
import type { DayOfWeekCode } from '@/types/medicine';
import { ScheduleDateFields } from '@/components/schedule/ScheduleDateFields';
import {
  DAYS_OF_WEEK_OPTIONS,
  DOSE_FORM_OPTIONS,
  FREQUENCY_OPTIONS,
} from '@/lib/medicine/medicineForm';

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
        useNativeModal={false}
      />
    </>
  );

  const cardContent = (
    <>
      <FormTextInput
        label="Name"
        value={entry.medicineName}
        onChangeText={(medicineName) => onChange({ ...entry, medicineName })}
        placeholder="e.g. Amoxicillin"
      />

      <View style={styles.twoColRow}>
        <View style={styles.halfCol}>
          <FormNumberInput
            label="Dose"
            value={entry.doseAmount}
            onChangeText={(doseAmount) => onChange({ ...entry, doseAmount })}
            placeholder="1"
            unit={entry.doseForm === 'tablet' ? 'Qty' : 'ml'}
          />
        </View>
        <View style={styles.halfCol}>
          <FormNumberInput
            label="Supply"
            value={entry.totalPills}
            onChangeText={(totalPills) => onChange({ ...entry, totalPills })}
            placeholder="30"
            unit="Pills"
          />
        </View>
      </View>

      <FormSegmentedControl
        label="Form"
        options={DOSE_FORM_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        selected={entry.doseForm}
        onSelect={(doseForm) => onChange({ ...entry, doseForm: doseForm as MedicineEntryState['doseForm'] })}
      />

      <FormSegmentedControl
        label="Frequency"
        options={FREQUENCY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        selected={entry.frequency}
        onSelect={(frequency) =>
          onChange({
            ...entry,
            frequency: frequency as MedicineEntryState['frequency'],
            daysOfWeek: frequency === 'weekly' ? entry.daysOfWeek : [],
          })
        }
      />

      {entry.frequency === 'weekly' ? (
        <View style={styles.daysContainer}>
          <AppText variant="caption" weight="700" color="#5C6470" style={{ marginBottom: 4 }}>
            DAYS OF WEEK
          </AppText>
          <View style={styles.daysRow}>
            {DAYS_OF_WEEK_OPTIONS.map((option) => {
              const selected = entry.daysOfWeek.includes(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.dayButton, selected && { backgroundColor: accentColor }]}
                  onPress={() => toggleDay(option.value as DayOfWeekCode)}
                >
                  <AppText variant="caption" weight="700" color={selected ? HomeTheme.white : '#1C1F24'}>
                    {option.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.twoColRow}>
        <View style={styles.halfCol}>
          <FormTimeInput
            label="Time"
            value={entry.medicineTime}
            onPress={() => setTimePickerVisible(true)}
          />
        </View>
        <View style={styles.halfCol}>
          <FormToggleRow
            label="Remind me"
            value={entry.reminderOn}
            onValueChange={(reminderOn) => onChange({ ...entry, reminderOn })}
          />
        </View>
      </View>

      <ScheduleDateFields
        value={entry.scheduleDate}
        onChange={(scheduleDate) => onChange({ ...entry, scheduleDate })}
        accentColor={accentColor}
      />

      {entry.reminderOn ? (
        <FormSelectInput
          label="Reminder Delay"
          valueLabel={getReminderMinutesLabel(entry.reminderMinutes)}
          icon="notifications-outline"
          onPress={() => setReminderPickerVisible(true)}
        />
      ) : null}

      <FormTextInput
        label="Notes"
        value={entry.notes}
        onChangeText={(notes) => onChange({ ...entry, notes })}
        placeholder="Optional instructions..."
        multiline
      />
    </>
  );

  if (embeddedInSheet) {
    return (
      <>
        <FormSection title="Medicine info" icon="pill">
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
          Medicine {index + 1}
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
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    alignItems: 'flex-end',
  },
  halfCol: {
    flex: 1,
  },
  daysContainer: {
    width: '100%',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 4,
  },
  dayButton: {
    flex: 1,
    height: 36,
    backgroundColor: '#F3F5F7',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
