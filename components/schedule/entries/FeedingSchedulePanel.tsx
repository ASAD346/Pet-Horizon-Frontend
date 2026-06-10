import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { SectionLabel, SheetOptionPicker, ThemedTimePicker } from '@/components/sheets';
import type { SheetOption } from '@/components/sheets';
import {
  DEFAULT_REMINDER_MINUTES,
  formatTimeDisplay,
  getReminderMinutesLabel,
  REMINDER_MINUTES_OPTIONS,
} from '@/lib/feeding/feedingForm';
import { createFeedingEntry } from '@/lib/schedule/defaults';
import type { FeedingEntryState } from '@/lib/schedule/types';
import { ScheduleTheme } from '../scheduleTheme';
import { scheduleFieldStyles } from '../scheduleStyles';

const REMINDER_OPTIONS: SheetOption[] = REMINDER_MINUTES_OPTIONS.map((o) => ({
  value: String(o.value),
  label: o.label,
}));

function mealIcon(mealValue: string): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  const v = mealValue.toLowerCase();
  if (v.includes('breakfast') || v.includes('morning')) return 'weather-sunny';
  if (v.includes('lunch') || v.includes('afternoon')) return 'white-balance-sunny';
  if (v.includes('dinner') || v.includes('evening')) return 'weather-night';
  if (v.includes('snack')) return 'cookie-outline';
  return 'bowl-mix-outline';
}

interface FeedingSchedulePanelProps {
  entries: FeedingEntryState[];
  mealTypeOptions: { value: string; label: string }[];
  unitOptions: { value: string; label: string }[];
  accentColor: string;
  accentBg: string;
  onChangeEntries: (entries: FeedingEntryState[]) => void;
}

export function FeedingSchedulePanel({
  entries,
  mealTypeOptions,
  unitOptions,
  accentColor,
  accentBg,
  onChangeEntries,
}: FeedingSchedulePanelProps) {
  const [timePickerMeal, setTimePickerMeal] = useState<string | null>(null);
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);

  const shared = entries[0] ?? createFeedingEntry(mealTypeOptions[0]?.value ?? '', unitOptions[0]?.value ?? '');

  const entryByMeal = useMemo(() => {
    const map = new Map<string, FeedingEntryState>();
    entries.forEach((e) => map.set(e.mealType, e));
    return map;
  }, [entries]);

  const syncShared = (patch: Partial<FeedingEntryState>) => {
    if (entries.length === 0) return;
    onChangeEntries(entries.map((e) => ({ ...e, ...patch })));
  };

  const toggleMeal = (mealType: string) => {
    if (entryByMeal.has(mealType)) {
      onChangeEntries(entries.filter((e) => e.mealType !== mealType));
      return;
    }
    const base = entries[0] ?? createFeedingEntry(mealType, unitOptions[0]?.value ?? '');
    onChangeEntries([
      ...entries,
      {
        ...createFeedingEntry(mealType, base.unit || (unitOptions[0]?.value ?? '')),
        amount: base.amount,
        unit: base.unit || (unitOptions[0]?.value ?? ''),
        notificationsOn: base.notificationsOn,
        reminderMinutes: base.reminderMinutes,
        notes: base.notes,
      },
    ]);
  };

  const updateMealTime = (mealType: string, date: Date) => {
    onChangeEntries(entries.map((e) => (e.mealType === mealType ? { ...e, feedingTime: date } : e)));
  };

  const activeMeals = mealTypeOptions.filter((o) => entryByMeal.has(o.value));

  return (
    <View>
      <View style={scheduleFieldStyles.mealChipRow}>
        {mealTypeOptions.map((option) => {
          const active = entryByMeal.has(option.value);
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                scheduleFieldStyles.mealChip,
                active && [scheduleFieldStyles.mealChipActive, { backgroundColor: accentColor }],
              ]}
              onPress={() => toggleMeal(option.value)}
              activeOpacity={0.85}
            >
              {active ? (
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              ) : (
                <Ionicons name="ellipse-outline" size={16} color={ScheduleTheme.textMuted} />
              )}
              <AppText variant="caption" weight="700" color={active ? '#FFFFFF' : ScheduleTheme.text}>
                {option.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeMeals.map((option) => {
        const entry = entryByMeal.get(option.value)!;
        return (
          <View key={option.value} style={scheduleFieldStyles.timeRow}>
            <View style={[scheduleFieldStyles.timeRowIcon, { backgroundColor: accentBg }]}>
              <MaterialCommunityIcons name={mealIcon(option.value)} size={18} color={accentColor} />
            </View>
            <AppText variant="bodySmall" weight="700" color={ScheduleTheme.text} style={scheduleFieldStyles.timeRowLabel}>
              {option.label}
            </AppText>
            <TouchableOpacity
              style={scheduleFieldStyles.timeRowPicker}
              onPress={() => setTimePickerMeal(option.value)}
              activeOpacity={0.85}
            >
              <AppText variant="caption" weight="700" color={ScheduleTheme.text}>
                {formatTimeDisplay(entry.feedingTime)}
              </AppText>
              <Ionicons name="time-outline" size={16} color={ScheduleTheme.textMuted} />
            </TouchableOpacity>
          </View>
        );
      })}

      {activeMeals.length === 0 ? (
        <AppText variant="caption" color={ScheduleTheme.textMuted} style={scheduleFieldStyles.fieldBlock}>
          Select at least one meal to set feeding times.
        </AppText>
      ) : null}

      <View style={scheduleFieldStyles.divider} />

      <AppText variant="caption" weight="700" color={ScheduleTheme.text} style={scheduleFieldStyles.fieldBlock}>
        Portion per meal
      </AppText>
      <TextInput
        value={shared.amount}
        onChangeText={(amount) => syncShared({ amount })}
        keyboardType="decimal-pad"
        style={scheduleFieldStyles.textInput}
        placeholder="Amount"
        placeholderTextColor={ScheduleTheme.textMuted}
      />

      <SectionLabel text="UNIT" />
      <View style={scheduleFieldStyles.chipRow}>
        {unitOptions.map((option) => {
          const selected = shared.unit === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[scheduleFieldStyles.chip, selected && { backgroundColor: accentColor, borderWidth: 0 }]}
              onPress={() => syncShared({ unit: option.value })}
            >
              <AppText variant="caption" weight="700" color={selected ? '#FFFFFF' : ScheduleTheme.text}>
                {option.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={scheduleFieldStyles.twoColRow}>
        <View style={scheduleFieldStyles.halfCol}>
          <SectionLabel text="NOTIFICATIONS" />
          <TouchableOpacity
            style={scheduleFieldStyles.pickerField}
            onPress={() => syncShared({ notificationsOn: !shared.notificationsOn })}
          >
            <AppText variant="caption" weight="600" color={ScheduleTheme.text}>
              {shared.notificationsOn ? 'On' : 'Off'}
            </AppText>
            <Ionicons
              name={shared.notificationsOn ? 'notifications-outline' : 'notifications-off-outline'}
              size={16}
              color={ScheduleTheme.textMuted}
            />
          </TouchableOpacity>
        </View>
        {shared.notificationsOn ? (
          <View style={scheduleFieldStyles.halfCol}>
            <SectionLabel text="REMINDER" />
            <TouchableOpacity
              style={scheduleFieldStyles.pickerField}
              onPress={() => setReminderPickerVisible(true)}
            >
              <AppText variant="caption" weight="600" color={ScheduleTheme.text}>
                {getReminderMinutesLabel(shared.reminderMinutes)}
              </AppText>
              <Ionicons name="chevron-down" size={16} color={ScheduleTheme.textMuted} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <ThemedTimePicker
        visible={timePickerMeal !== null}
        value={timePickerMeal ? entryByMeal.get(timePickerMeal)?.feedingTime ?? new Date() : new Date()}
        onClose={() => setTimePickerMeal(null)}
        onConfirm={(date) => {
          if (timePickerMeal) updateMealTime(timePickerMeal, date);
          setTimePickerMeal(null);
        }}
      />

      <SheetOptionPicker
        visible={reminderPickerVisible}
        title="Remind me after"
        options={REMINDER_OPTIONS}
        selectedValue={String(shared.reminderMinutes ?? DEFAULT_REMINDER_MINUTES)}
        onClose={() => setReminderPickerVisible(false)}
        onSelect={(value) => syncShared({ reminderMinutes: Number(value) })}
      />
    </View>
  );
}
