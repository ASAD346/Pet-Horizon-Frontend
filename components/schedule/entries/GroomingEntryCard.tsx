import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { ThemedDatePicker } from '@/components/pet/ThemedDatePicker';
import { formatDateLabel, defaultScheduledDate } from '@/lib/grooming/groomingForm';
import type { GroomingEntryState } from '@/lib/schedule/types';
import type { GroomingTypeOption } from '@/types/grooming';
import { ScheduleTheme } from '../scheduleTheme';
import { scheduleFieldStyles } from '../scheduleStyles';

interface GroomingEntryCardProps {
  entry: GroomingEntryState;
  index: number;
  accentColor: string;
  accentBg: string;
  typeOptions: GroomingTypeOption[];
  canRemove: boolean;
  onChange: (next: GroomingEntryState) => void;
  onRemove: () => void;
}

export function GroomingEntryCard({
  entry,
  accentColor,
  accentBg,
  typeOptions,
  canRemove,
  onChange,
  onRemove,
}: GroomingEntryCardProps) {
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const typeLabel =
    typeOptions.find((t) => t.value === entry.groomingType)?.label ?? entry.groomingType;

  return (
    <View style={scheduleFieldStyles.fieldBlock}>
      <View style={scheduleFieldStyles.compactRow}>
        <View style={[scheduleFieldStyles.timeRowIcon, { backgroundColor: accentBg }]}>
          <MaterialCommunityIcons name="content-cut" size={18} color={accentColor} />
        </View>
        <View style={scheduleFieldStyles.compactRowBody}>
          <AppText variant="bodySmall" weight="800" color={ScheduleTheme.text}>
            {typeLabel || 'Select task'}
          </AppText>
          <TouchableOpacity onPress={() => setDatePickerVisible(true)} activeOpacity={0.85}>
            <AppText variant="caption" color={ScheduleTheme.textMuted}>
              {entry.scheduledDate ? formatDateLabel(entry.scheduledDate) : 'Set date'}
            </AppText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={scheduleFieldStyles.rowMenuBtn} onPress={() => setExpanded((v) => !v)}>
          <Ionicons name={expanded ? 'chevron-up' : 'ellipsis-vertical'} size={18} color={ScheduleTheme.textMuted} />
        </TouchableOpacity>
      </View>

      {expanded ? (
        <View style={scheduleFieldStyles.expandedPanel}>
          <AppText variant="caption" weight="700" color={ScheduleTheme.textMuted} style={scheduleFieldStyles.fieldBlock}>
            TASK TYPE
          </AppText>
          <View style={scheduleFieldStyles.chipRow}>
            {typeOptions.map((option) => {
              const selected = entry.groomingType === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[scheduleFieldStyles.chip, selected && { backgroundColor: accentColor, borderWidth: 0 }]}
                  onPress={() => onChange({ ...entry, groomingType: option.value })}
                >
                  <AppText variant="caption" weight="700" color={selected ? '#FFFFFF' : ScheduleTheme.text}>
                    {option.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[scheduleFieldStyles.notifyBtn, entry.reminderOn && { backgroundColor: accentColor }]}
            onPress={() => onChange({ ...entry, reminderOn: !entry.reminderOn })}
          >
            <Ionicons
              name={entry.reminderOn ? 'notifications' : 'notifications-off-outline'}
              size={18}
              color={entry.reminderOn ? '#FFFFFF' : ScheduleTheme.text}
            />
            <AppText variant="caption" weight="700" color={entry.reminderOn ? '#FFFFFF' : ScheduleTheme.text}>
              Reminder {entry.reminderOn ? 'On' : 'Off'}
            </AppText>
          </TouchableOpacity>

          <TextInput
            value={entry.notes}
            onChangeText={(notes) => onChange({ ...entry, notes })}
            placeholder="Notes (optional)"
            placeholderTextColor={ScheduleTheme.textMuted}
            style={[scheduleFieldStyles.textInput, scheduleFieldStyles.notesInput]}
            multiline
          />

          {canRemove ? (
            <TouchableOpacity onPress={onRemove} style={scheduleFieldStyles.fieldBlock}>
              <AppText variant="caption" weight="700" color={accentColor}>
                Remove task
              </AppText>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <ThemedDatePicker
        visible={datePickerVisible}
        title="Scheduled date"
        value={entry.scheduledDate ?? defaultScheduledDate()}
        onClose={() => setDatePickerVisible(false)}
        onConfirm={(date) => {
          onChange({ ...entry, scheduledDate: date });
          setDatePickerVisible(false);
        }}
      />
    </View>
  );
}
