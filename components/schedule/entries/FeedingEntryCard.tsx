import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { SectionLabel, SheetOptionPicker, ThemedTimePicker } from '@/components/sheets';
import type { SheetOption } from '@/components/sheets';
import { HomeTheme } from '@/constants/theme';
import {
  formatTimeDisplay,
  getReminderMinutesLabel,
  REMINDER_MINUTES_OPTIONS,
} from '@/lib/feeding/feedingForm';
import type { FeedingEntryState } from '@/lib/schedule/types';
import { ScheduleColors, scheduleFieldStyles } from '../scheduleStyles';

const REMINDER_OPTIONS: SheetOption[] = REMINDER_MINUTES_OPTIONS.map((o) => ({
  value: String(o.value),
  label: o.label,
}));

interface FeedingEntryCardProps {
  entry: FeedingEntryState;
  index: number;
  accentColor: string;
  mealTypeOptions: { value: string; label: string }[];
  unitOptions: { value: string; label: string }[];
  canRemove: boolean;
  onChange: (next: FeedingEntryState) => void;
  onRemove: () => void;
}

export function FeedingEntryCard({
  entry,
  index,
  accentColor,
  mealTypeOptions,
  unitOptions,
  canRemove,
  onChange,
  onRemove,
}: FeedingEntryCardProps) {
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);

  return (
    <View style={scheduleFieldStyles.entryCard}>
      <View style={scheduleFieldStyles.entryHeader}>
        <AppText variant="bodySmall" weight="700" color={HomeTheme.text}>
          Meal {index + 1}
        </AppText>
        {canRemove ? (
          <TouchableOpacity onPress={onRemove} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color={ScheduleColors.label} />
          </TouchableOpacity>
        ) : null}
      </View>

      <SectionLabel text="MEAL TYPE" />
      <View style={scheduleFieldStyles.chipRow}>
        {mealTypeOptions.map((option) => {
          const selected = entry.mealType === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                scheduleFieldStyles.chip,
                selected && { backgroundColor: accentColor },
              ]}
              onPress={() => onChange({ ...entry, mealType: option.value })}
            >
              <AppText variant="caption" weight="600" color={selected ? HomeTheme.white : HomeTheme.text}>
                {option.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <AppText variant="caption" weight="700" color={HomeTheme.text} style={scheduleFieldStyles.fieldLabel}>
        Amount
      </AppText>
      <TextInput
        value={entry.amount}
        onChangeText={(amount) => onChange({ ...entry, amount })}
        keyboardType="decimal-pad"
        style={scheduleFieldStyles.textInput}
      />

      <SectionLabel text="UNIT" />
      <View style={scheduleFieldStyles.chipRow}>
        {unitOptions.map((option) => {
          const selected = entry.unit === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                scheduleFieldStyles.chip,
                selected && { backgroundColor: accentColor },
              ]}
              onPress={() => onChange({ ...entry, unit: option.value })}
            >
              <AppText variant="caption" weight="600" color={selected ? HomeTheme.white : HomeTheme.text}>
                {option.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={scheduleFieldStyles.twoColRow}>
        <View style={scheduleFieldStyles.halfCol}>
          <SectionLabel text="TIME" />
          <TouchableOpacity
            style={scheduleFieldStyles.pickerField}
            onPress={() => setTimePickerVisible(true)}
          >
            <AppText variant="bodySmall" weight="600" color={ScheduleColors.fieldText}>
              {formatTimeDisplay(entry.feedingTime)}
            </AppText>
            <Ionicons name="time-outline" size={18} color={ScheduleColors.label} />
          </TouchableOpacity>
        </View>
        <View style={scheduleFieldStyles.halfCol}>
          <SectionLabel text="NOTIFICATIONS" />
          <TouchableOpacity
            style={scheduleFieldStyles.pickerField}
            onPress={() => onChange({ ...entry, notificationsOn: !entry.notificationsOn })}
          >
            <AppText variant="bodySmall" weight="600" color={ScheduleColors.fieldText}>
              {entry.notificationsOn ? 'On' : 'Off'}
            </AppText>
            <Ionicons
              name={entry.notificationsOn ? 'notifications-outline' : 'notifications-off-outline'}
              size={18}
              color={ScheduleColors.label}
            />
          </TouchableOpacity>
        </View>
      </View>

      {entry.notificationsOn ? (
        <>
          <SectionLabel text="REMINDER" />
          <TouchableOpacity
            style={scheduleFieldStyles.pickerField}
            onPress={() => setReminderPickerVisible(true)}
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
        placeholder="Extra details..."
        placeholderTextColor={ScheduleColors.placeholder}
        style={[scheduleFieldStyles.textInput, scheduleFieldStyles.notesInput]}
        multiline
      />

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
      />
    </View>
  );
}
