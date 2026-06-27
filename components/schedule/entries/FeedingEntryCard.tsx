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
import type { FeedingEntryState } from '@/lib/schedule/types';
import { ScheduleDateFields } from '@/components/schedule/ScheduleDateFields';

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
        useNativeModal={false}
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
        useNativeModal={false}
      />
    </>
  );

  const cardContent = (
    <>
      <FormSegmentedControl
        label="Meal Type"
        options={mealTypeOptions}
        selected={entry.mealType}
        onSelect={(mealType) => onChange({ ...entry, mealType })}
      />

      <View style={styles.twoColRow}>
        <View style={{ flex: 1.15 }}>
          <FormNumberInput
            label="Amount"
            value={entry.amount}
            onChangeText={(amount) => onChange({ ...entry, amount })}
            placeholder="0"
          />
        </View>
        <View style={{ flex: 1 }}>
          <FormSelectInput
            label="Unit"
            valueLabel={unitOptions.find((o) => o.value === entry.unit)?.label || entry.unit || 'Select'}
            icon="scale-outline"
            onPress={() => setUnitPickerVisible(true)}
          />
        </View>
      </View>

      <ScheduleDateFields
        value={entry.scheduleDate}
        onChange={(scheduleDate) => onChange({ ...entry, scheduleDate })}
        accentColor={accentColor}
      />

      <View style={styles.twoColRow}>
        <View style={styles.halfCol}>
          <FormTimeInput
            label="Time"
            value={entry.feedingTime}
            onPress={() => setTimePickerVisible(true)}
          />
        </View>
        <View style={styles.halfCol}>
          <FormToggleRow
            label="Remind me"
            value={entry.notificationsOn}
            onValueChange={(notificationsOn) => onChange({ ...entry, notificationsOn })}
          />
        </View>
      </View>

      {entry.notificationsOn ? (
        <FormSelectInput
          label="Reminder Timing"
          valueLabel={getReminderMinutesLabel(entry.reminderMinutes)}
          icon="notifications-outline"
          onPress={() => setReminderPickerVisible(true)}
        />
      ) : null}

      <FormTextInput
        label="Notes"
        value={entry.notes}
        onChangeText={(notes) => onChange({ ...entry, notes })}
        placeholder="Optional details (brand, treats)..."
        multiline
      />
    </>
  );

  if (embeddedInSheet) {
    return (
      <>
        <FormSection title="Meal details" icon="bowl-mix-outline">
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
          Meal {index + 1}
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
});
