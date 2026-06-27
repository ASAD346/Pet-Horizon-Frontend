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
import type { WalkEntryState } from '@/lib/schedule/types';
import { ScheduleDateFields } from '@/components/schedule/ScheduleDateFields';
import { WALK_TIME_OPTIONS } from '@/lib/walk/walkForm';

const REMINDER_OPTIONS: SheetOption[] = REMINDER_MINUTES_OPTIONS.map((o) => ({
  value: String(o.value),
  label: o.label,
}));

interface WalkEntryCardProps {
  entry: WalkEntryState;
  index: number;
  accentColor: string;
  accentBg?: string;
  canRemove: boolean;
  embeddedInSheet?: boolean;
  onChange: (next: WalkEntryState) => void;
  onRemove: () => void;
}

export function WalkEntryCard({
  entry,
  index,
  accentColor,
  accentBg = '#E8F5E9',
  canRemove,
  embeddedInSheet = false,
  onChange,
  onRemove,
}: WalkEntryCardProps) {
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);

  const pickers = (
    <>
      <ThemedTimePicker
        visible={timePickerVisible}
        value={entry.walkClockTime}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={(date) => {
          onChange({ ...entry, walkClockTime: date });
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
      <FormSegmentedControl
        label="Which walk?"
        options={WALK_TIME_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        selected={entry.walkTime}
        onSelect={(walkTime) => onChange({ ...entry, walkTime })}
      />

      <View style={styles.twoColRow}>
        <View style={styles.halfCol}>
          <FormTimeInput
            label="Time"
            value={entry.walkClockTime}
            onPress={() => setTimePickerVisible(true)}
          />
        </View>
        <View style={styles.halfCol}>
          <FormNumberInput
            label="Duration"
            value={entry.duration}
            onChangeText={(duration) => onChange({ ...entry, duration })}
            placeholder="45"
            unit="min"
          />
        </View>
      </View>

      <ScheduleDateFields
        value={entry.scheduleDate}
        onChange={(scheduleDate) => onChange({ ...entry, scheduleDate })}
        accentColor={accentColor}
      />

      <FormToggleRow
        label="Remind me before walk"
        value={entry.notificationsOn}
        onValueChange={(notificationsOn) => onChange({ ...entry, notificationsOn })}
        icon="notifications-outline"
      />

      {entry.notificationsOn ? (
        <FormSelectInput
          label="Reminder Timing"
          valueLabel={getReminderMinutesLabel(entry.reminderMinutes)}
          icon="chevron-down"
          onPress={() => setReminderPickerVisible(true)}
        />
      ) : null}

      <FormTextInput
        label="Notes"
        value={entry.notes}
        onChangeText={(notes) => onChange({ ...entry, notes })}
        placeholder="Optional details (route, leash)..."
        multiline
      />
    </>
  );

  if (embeddedInSheet) {
    return (
      <>
        <FormSection title="Walk details" icon="walk">
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
          Walk {index + 1}
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
  },
  halfCol: {
    flex: 1,
  },
});
