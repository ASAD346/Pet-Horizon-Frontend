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
};

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
        <AppText variant="caption" weight="700" color="#64748B" style={styles.sectionHeader}>
          MEAL DETAILS
        </AppText>

        <View style={styles.fieldGroup}>
          <AppText variant="caption" weight="700" color="#5C6470" style={styles.fieldLabel}>
            MEAL TYPE <AppText variant="caption" weight="700" color="#EF4444">*</AppText>
          </AppText>
          <View style={styles.formGrid}>
            {mealTypeOptions.map((item) => {
              const isSelected = entry.mealType === item.value;
              const iconName = MEAL_TYPE_ICONS[item.value] || 'food-drumstick';
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.chipCard,
                    isSelected && {
                      borderColor: accentColor,
                      backgroundColor: accentBg,
                    },
                  ]}
                  onPress={() => onChange({ ...entry, mealType: item.value })}
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
              placeholder="1"
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
        <AppText variant="caption" weight="700" color="#64748B" style={styles.sectionHeader}>
          SCHEDULE & TIMING
        </AppText>

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
        <FormTextInput
          label="Instructions & Notes"
          value={entry.notes}
          onChangeText={(notes) => onChange({ ...entry, notes })}
          placeholder="Optional details (brand, treats, food prep)..."
          multiline
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
  },
  sectionHeader: {
    letterSpacing: 0.6,
    marginBottom: -2,
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
    gap: 8,
  },
  chipCard: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  chipText: {
    fontSize: 12,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
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
