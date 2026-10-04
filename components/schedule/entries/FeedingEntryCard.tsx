import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import {
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
import { useAppSelector } from '@/redux/store';
import { selectIsFormReadOnly } from '@/redux/reducer';

const MEAL_TYPE_ICONS: Record<
  string,
  React.ComponentProps<typeof MaterialCommunityIcons>['name']
> = {
  breakfast: 'weather-sunset-up',
  lunch: 'white-balance-sunny',
  dinner: 'weather-night',
  snacks: 'bone',
  morning_feed: 'weather-sunset-up',
  evening_feed: 'weather-night',
  automatic_feeder: 'robot',
  dry_food: 'food-drumstick',
  wet_food: 'food-variant',
  raw_diet: 'food-drumstick-outline',
  kibble: 'grain',
  seeds: 'seed-outline',
  pellets: 'scatter-plot',
  hay: 'grass',
  fresh_food: 'food-apple-outline',
  treats: 'cookie-outline',
};

function getMealIcon(value: string): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  const v = value.toLowerCase();
  if (MEAL_TYPE_ICONS[v]) return MEAL_TYPE_ICONS[v];
  if (v.includes('breakfast') || v.includes('morning')) return 'weather-sunset-up';
  if (v.includes('lunch') || v.includes('noon')) return 'white-balance-sunny';
  if (v.includes('dinner') || v.includes('evening') || v.includes('night')) return 'weather-night';
  if (v.includes('snack') || v.includes('treat')) return 'bone';
  if (v.includes('seed')) return 'seed-outline';
  if (v.includes('pellet')) return 'scatter-plot';
  if (v.includes('hay') || v.includes('grass')) return 'grass';
  return 'bowl-mix-outline';
}

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
  accentColor = '#D97706',
  accentBg = '#FEF3C7',
  mealTypeOptions,
  unitOptions,
  canRemove,
  embeddedInSheet = false,
  onChange,
  onRemove,
}: FeedingEntryCardProps) {
  const isReadOnly = useAppSelector(selectIsFormReadOnly);
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
    <View style={styles.formContainer}>
      {/* Meal Details Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconBadge, { backgroundColor: accentBg }]}>
            <MaterialCommunityIcons name="bowl-mix-outline" size={16} color={accentColor} />
          </View>
          <AppText variant="caption" weight="800" color="#5C6470" style={styles.sectionHeader}>
            MEAL DETAILS
          </AppText>
        </View>

        <View style={styles.fieldGroup}>
          <AppText variant="caption" weight="700" color="#5C6470" style={styles.fieldLabel}>
            MEAL TYPE <AppText variant="caption" weight="700" color="#EF4444">*</AppText>
          </AppText>
          <View style={styles.formGrid}>
            {mealTypeOptions.map((item) => {
              const isSelected = entry.mealType === item.value;
              const iconName = getMealIcon(item.value);
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.chipCard,
                    isSelected && {
                      borderColor: accentColor,
                      backgroundColor: accentBg,
                    },
                    isReadOnly && styles.readOnlyChip,
                  ]}
                  onPress={() => !isReadOnly && onChange({ ...entry, mealType: item.value })}
                  disabled={isReadOnly}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={iconName}
                    size={20}
                    color={isSelected ? accentColor : '#64748B'}
                  />
                  <AppText
                    variant="caption"
                    weight={isSelected ? '700' : '600'}
                    color={isSelected ? accentColor : '#334155'}
                    style={styles.chipText}
                    numberOfLines={1}
                  >
                    {item.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.twoColRow}>
          <View style={{ flex: 1.15 }}>
            <FormNumberInput
              label="Portion Amount"
              required
              value={entry.amount}
              onChangeText={(amount) => onChange({ ...entry, amount })}
              placeholder="e.g. 1"
              accentColor={accentColor}
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormSelectInput
              label="Unit"
              required
              valueLabel={unitOptions.find((o) => o.value === entry.unit)?.label || entry.unit || 'Select'}
              icon="scale-outline"
              onPress={() => setUnitPickerVisible(true)}
            />
          </View>
        </View>
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

        <View style={styles.twoColRow}>
          <View style={styles.halfCol}>
            <FormTimeInput
              label="Time"
              required
              value={entry.feedingTime}
              onPress={() => setTimePickerVisible(true)}
            />
          </View>
          <View style={styles.halfCol}>
            <FormToggleRow
              label="Remind me"
              value={entry.notificationsOn}
              onValueChange={(notificationsOn) => onChange({ ...entry, notificationsOn })}
              accentColor={accentColor}
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
          placeholder="Optional details (brand, treats, food prep)..."
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
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    letterSpacing: 0.4,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  chipCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  readOnlyChip: {
    opacity: 0.65,
    backgroundColor: '#F1F5F9',
  },
  chipText: {
    fontSize: 12,
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
