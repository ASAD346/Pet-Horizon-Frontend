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
import type { WalkEntryState } from '@/lib/schedule/types';
import { WALK_TIME_OPTIONS } from '@/lib/walk/walkForm';
import { ScheduleColors, scheduleFieldStyles } from '../scheduleStyles';

const REMINDER_OPTIONS: SheetOption[] = REMINDER_MINUTES_OPTIONS.map((o) => ({
  value: String(o.value),
  label: o.label,
}));

interface WalkEntryCardProps {
  entry: WalkEntryState;
  index: number;
  accentColor: string;
  canRemove: boolean;
  onChange: (next: WalkEntryState) => void;
  onRemove: () => void;
}

export function WalkEntryCard({
  entry,
  index,
  accentColor,
  canRemove,
  onChange,
  onRemove,
}: WalkEntryCardProps) {
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);

  return (
    <View style={scheduleFieldStyles.entryCard}>
      <View style={scheduleFieldStyles.entryHeader}>
        <AppText variant="bodySmall" weight="700" color={HomeTheme.text}>
          Walk {index + 1}
        </AppText>
        {canRemove ? (
          <TouchableOpacity onPress={onRemove} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color={ScheduleColors.label} />
          </TouchableOpacity>
        ) : null}
      </View>

      <SectionLabel text="WHICH WALK?" />
      <View style={scheduleFieldStyles.chipRow}>
        {WALK_TIME_OPTIONS.map((option) => {
          const selected = entry.walkTime === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[scheduleFieldStyles.chip, selected && { backgroundColor: accentColor }]}
              onPress={() => onChange({ ...entry, walkTime: option.value })}
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
              {formatTimeDisplay(entry.walkClockTime)}
            </AppText>
            <Ionicons name="time-outline" size={18} color={ScheduleColors.label} />
          </TouchableOpacity>
        </View>
        <View style={scheduleFieldStyles.halfCol}>
          <SectionLabel text="DURATION" />
          <View style={scheduleFieldStyles.suffixInputWrap}>
            <TextInput
              value={entry.duration}
              onChangeText={(duration) => onChange({ ...entry, duration })}
              keyboardType="number-pad"
              style={scheduleFieldStyles.suffixInput}
            />
            <AppText variant="caption" weight="600" color={ScheduleColors.label}>
              min
            </AppText>
          </View>
        </View>
      </View>

      <View style={scheduleFieldStyles.twoColRow}>
        <View style={scheduleFieldStyles.halfCol}>
          <SectionLabel text="NOTIFICATIONS" />
          <TouchableOpacity
            style={[
              scheduleFieldStyles.notifyBtn,
              entry.notificationsOn && { backgroundColor: accentColor },
            ]}
            onPress={() => onChange({ ...entry, notificationsOn: !entry.notificationsOn })}
          >
            <Ionicons
              name={entry.notificationsOn ? 'notifications' : 'notifications-off-outline'}
              size={18}
              color={entry.notificationsOn ? HomeTheme.white : HomeTheme.text}
            />
            <AppText
              variant="caption"
              weight="700"
              color={entry.notificationsOn ? HomeTheme.white : HomeTheme.text}
            >
              {entry.notificationsOn ? 'On' : 'Off'}
            </AppText>
          </TouchableOpacity>
        </View>
        {entry.notificationsOn ? (
          <View style={scheduleFieldStyles.halfCol}>
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
          </View>
        ) : null}
      </View>

      <SectionLabel text="NOTES (OPTIONAL)" />
      <TextInput
        value={entry.notes}
        onChangeText={(notes) => onChange({ ...entry, notes })}
        placeholder="Park route, leash preference..."
        placeholderTextColor={ScheduleColors.placeholder}
        style={[scheduleFieldStyles.textInput, scheduleFieldStyles.notesInput]}
        multiline
      />

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
      />
    </View>
  );
}
