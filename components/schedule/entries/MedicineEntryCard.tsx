import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { SectionLabel, SheetOptionPicker, ThemedTimePicker } from '@/components/sheets';
import type { SheetOption } from '@/components/sheets';
import { ThemedDatePicker } from '@/components/pet/ThemedDatePicker';
import {
  formatTimeDisplay,
  getReminderMinutesLabel,
  REMINDER_MINUTES_OPTIONS,
} from '@/lib/feeding/feedingForm';
import type { MedicineEntryState } from '@/lib/schedule/types';
import type { DayOfWeekCode } from '@/types/medicine';
import {
  DAYS_OF_WEEK_OPTIONS,
  DOSE_FORM_OPTIONS,
  formatDateLabel,
  FREQUENCY_OPTIONS,
  isStartBeforeOrEqualEnd,
} from '@/lib/medicine/medicineForm';
import { ScheduleTheme } from '../scheduleTheme';
import { scheduleFieldStyles } from '../scheduleStyles';

const REMINDER_OPTIONS: SheetOption[] = REMINDER_MINUTES_OPTIONS.map((o) => ({
  value: String(o.value),
  label: o.label,
}));

interface MedicineEntryCardProps {
  entry: MedicineEntryState;
  index: number;
  accentColor: string;
  canRemove: boolean;
  onChange: (next: MedicineEntryState) => void;
  onRemove: () => void;
}

export function MedicineEntryCard({
  entry,
  accentColor,
  canRemove,
  onChange,
  onRemove,
}: MedicineEntryCardProps) {
  const [expanded, setExpanded] = useState(!entry.medicineName.trim());
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [startPickerVisible, setStartPickerVisible] = useState(false);
  const [endPickerVisible, setEndPickerVisible] = useState(false);
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);

  const toggleDay = (day: DayOfWeekCode) => {
    const days = entry.daysOfWeek.includes(day)
      ? entry.daysOfWeek.filter((d) => d !== day)
      : [...entry.daysOfWeek, day];
    onChange({ ...entry, daysOfWeek: days });
  };

  const summary = entry.medicineName.trim()
    ? `${entry.doseAmount} ${entry.doseForm === 'tablet' ? 'pills' : 'ml'} • ${formatTimeDisplay(entry.medicineTime)} • ${
        FREQUENCY_OPTIONS.find((f) => f.value === entry.frequency)?.label ?? entry.frequency
      }`
    : 'Tap to add medicine details';

  return (
    <View style={scheduleFieldStyles.fieldBlock}>
      <TouchableOpacity
        style={scheduleFieldStyles.compactRow}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.85}
      >
        <View style={scheduleFieldStyles.compactRowBody}>
          <AppText variant="bodySmall" weight="800" color={ScheduleTheme.text}>
            {entry.medicineName.trim() || 'New medicine'}
          </AppText>
          <AppText variant="caption" color={ScheduleTheme.textMuted}>
            {summary}
          </AppText>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-forward'} size={18} color={ScheduleTheme.textMuted} />
      </TouchableOpacity>

      {expanded ? (
        <View style={scheduleFieldStyles.expandedPanel}>
          <TextInput
            value={entry.medicineName}
            onChangeText={(medicineName) => onChange({ ...entry, medicineName })}
            placeholder="Medicine name"
            placeholderTextColor={ScheduleTheme.textMuted}
            style={scheduleFieldStyles.textInput}
          />

          <View style={scheduleFieldStyles.twoColRow}>
            <View style={scheduleFieldStyles.halfCol}>
              <SectionLabel text="DOSE" />
              <View style={scheduleFieldStyles.suffixInputWrap}>
                <TextInput
                  value={entry.doseAmount}
                  onChangeText={(doseAmount) => onChange({ ...entry, doseAmount })}
                  keyboardType="decimal-pad"
                  style={scheduleFieldStyles.suffixInput}
                />
                <AppText variant="caption" weight="600" color={ScheduleTheme.textMuted}>
                  {entry.doseForm === 'tablet' ? 'qty' : 'ml'}
                </AppText>
              </View>
            </View>
            <View style={scheduleFieldStyles.halfCol}>
              <SectionLabel text="FORM" />
              <View style={scheduleFieldStyles.chipRow}>
                {DOSE_FORM_OPTIONS.map((option) => {
                  const selected = entry.doseForm === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[scheduleFieldStyles.chip, selected && { backgroundColor: accentColor, borderWidth: 0 }]}
                      onPress={() => onChange({ ...entry, doseForm: option.value })}
                    >
                      <AppText variant="caption" weight="700" color={selected ? '#FFFFFF' : ScheduleTheme.text}>
                        {option.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <SectionLabel text="FREQUENCY" />
          <View style={scheduleFieldStyles.chipRow}>
            {FREQUENCY_OPTIONS.map((option) => {
              const selected = entry.frequency === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[scheduleFieldStyles.chip, selected && { backgroundColor: accentColor, borderWidth: 0 }]}
                  onPress={() =>
                    onChange({
                      ...entry,
                      frequency: option.value,
                      daysOfWeek: option.value === 'weekly' ? entry.daysOfWeek : [],
                    })
                  }
                >
                  <AppText variant="caption" weight="700" color={selected ? '#FFFFFF' : ScheduleTheme.text}>
                    {option.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          {entry.frequency === 'weekly' ? (
            <View style={scheduleFieldStyles.chipRow}>
              {DAYS_OF_WEEK_OPTIONS.map((option) => {
                const selected = entry.daysOfWeek.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[scheduleFieldStyles.chip, selected && { backgroundColor: accentColor, borderWidth: 0 }]}
                    onPress={() => toggleDay(option.value)}
                  >
                    <AppText variant="caption" weight="700" color={selected ? '#FFFFFF' : ScheduleTheme.text}>
                      {option.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          <TouchableOpacity style={scheduleFieldStyles.pickerField} onPress={() => setTimePickerVisible(true)}>
            <AppText variant="caption" weight="600" color={ScheduleTheme.text}>
              Time: {formatTimeDisplay(entry.medicineTime)}
            </AppText>
            <Ionicons name="time-outline" size={16} color={ScheduleTheme.textMuted} />
          </TouchableOpacity>

          <View style={scheduleFieldStyles.twoColRow}>
            <TouchableOpacity style={scheduleFieldStyles.pickerField} onPress={() => setStartPickerVisible(true)}>
              <AppText variant="caption" weight="600" color={ScheduleTheme.text}>
                Start: {entry.startDate ? formatDateLabel(entry.startDate) : 'Optional'}
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity style={scheduleFieldStyles.pickerField} onPress={() => setEndPickerVisible(true)}>
              <AppText variant="caption" weight="600" color={ScheduleTheme.text}>
                End: {entry.endDate ? formatDateLabel(entry.endDate) : 'Optional'}
              </AppText>
            </TouchableOpacity>
          </View>

          <View style={scheduleFieldStyles.suffixInputWrap}>
            <TextInput
              value={entry.totalPills}
              onChangeText={(totalPills) => onChange({ ...entry, totalPills })}
              keyboardType="number-pad"
              style={scheduleFieldStyles.suffixInput}
              placeholder="Total quantity"
            />
            <AppText variant="caption" weight="600" color={ScheduleTheme.textMuted}>
              pills
            </AppText>
          </View>

          <TouchableOpacity
            style={[scheduleFieldStyles.notifyBtn, entry.reminderOn && { backgroundColor: accentColor }]}
            onPress={() => onChange({ ...entry, reminderOn: !entry.reminderOn })}
          >
            <AppText variant="caption" weight="700" color={entry.reminderOn ? '#FFFFFF' : ScheduleTheme.text}>
              Reminder {entry.reminderOn ? 'On' : 'Off'}
            </AppText>
          </TouchableOpacity>

          {entry.reminderOn ? (
            <TouchableOpacity style={scheduleFieldStyles.pickerField} onPress={() => setReminderPickerVisible(true)}>
              <AppText variant="caption" weight="600" color={ScheduleTheme.text}>
                {getReminderMinutesLabel(entry.reminderMinutes)}
              </AppText>
              <Ionicons name="chevron-down" size={16} color={ScheduleTheme.textMuted} />
            </TouchableOpacity>
          ) : null}

          <TextInput
            value={entry.notes}
            onChangeText={(notes) => onChange({ ...entry, notes })}
            placeholder="Notes (optional)"
            placeholderTextColor={ScheduleTheme.textMuted}
            style={[scheduleFieldStyles.textInput, scheduleFieldStyles.notesInput]}
            multiline
          />

          {canRemove ? (
            <TouchableOpacity onPress={onRemove}>
              <AppText variant="caption" weight="700" color={accentColor}>
                Remove medicine
              </AppText>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <ThemedTimePicker
        visible={timePickerVisible}
        value={entry.medicineTime}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={(date) => {
          onChange({ ...entry, medicineTime: date });
          setTimePickerVisible(false);
        }}
      />
      <ThemedDatePicker
        visible={startPickerVisible}
        title="Start date"
        value={entry.startDate ?? new Date()}
        maximumDate={entry.endDate ?? undefined}
        onClose={() => setStartPickerVisible(false)}
        onConfirm={(date) => {
          const next = { ...entry, startDate: date };
          if (entry.endDate && !isStartBeforeOrEqualEnd(date, entry.endDate)) next.endDate = null;
          onChange(next);
          setStartPickerVisible(false);
        }}
      />
      <ThemedDatePicker
        visible={endPickerVisible}
        title="End date"
        value={entry.endDate ?? entry.startDate ?? new Date()}
        minimumDate={entry.startDate ?? undefined}
        onClose={() => setEndPickerVisible(false)}
        onConfirm={(date) => {
          onChange({ ...entry, endDate: date });
          setEndPickerVisible(false);
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
