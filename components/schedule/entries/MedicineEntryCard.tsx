import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import {
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
  getReminderMinutesLabel,
  REMINDER_MINUTES_OPTIONS,
} from '@/lib/feeding/feedingForm';
import type { MedicineEntryState } from '@/lib/schedule/types';
import type { DayOfWeekCode, MedicineDoseForm } from '@/types/medicine';
import { ScheduleDateFields } from '@/components/schedule/ScheduleDateFields';
import {
  DAYS_OF_WEEK_OPTIONS,
  FREQUENCY_OPTIONS,
  getDoseUnitLabel,
} from '@/lib/medicine/medicineForm';
import { useAppSelector } from '@/redux/store';
import { selectIsFormReadOnly } from '@/redux/reducer';

const DOSAGE_FORM_ITEMS: {
  value: MedicineDoseForm;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  { value: 'tablet', label: 'Tablet', icon: 'pill' },
  { value: 'syrup', label: 'Syrup', icon: 'flask-outline' },
  { value: 'drops', label: 'Drops', icon: 'water-outline' },
  { value: 'injection', label: 'Injection', icon: 'needle' },
  { value: 'cream', label: 'Cream', icon: 'lotion-outline' },
  { value: 'other', label: 'Other', icon: 'medication' },
];

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
  accentColor = '#9333EA',
  accentBg = '#F3E8FF',
  canRemove,
  embeddedInSheet = false,
  onChange,
  onRemove,
}: MedicineEntryCardProps) {
  const isReadOnly = useAppSelector(selectIsFormReadOnly);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);

  const toggleDay = (day: DayOfWeekCode) => {
    if (isReadOnly) return;
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
    <View style={styles.formContainer}>
      {/* Medicine & Dosage Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconBadge, { backgroundColor: accentBg }]}>
            <MaterialCommunityIcons name="pill" size={16} color={accentColor} />
          </View>
          <AppText variant="caption" weight="800" color="#5C6470" style={styles.sectionHeader}>
            MEDICINE DETAILS
          </AppText>
        </View>

        <FormTextInput
          label="Medicine Name"
          required
          value={entry.medicineName}
          onChangeText={(medicineName) => onChange({ ...entry, medicineName })}
          placeholder="e.g. Amoxicillin, Eye Drops, Vitamin C"
          accentColor={accentColor}
        />

        <View style={styles.fieldGroup}>
          <AppText variant="caption" weight="700" color="#5C6470" style={styles.fieldLabel}>
            DOSAGE FORM <AppText variant="caption" weight="700" color="#EF4444">*</AppText>
          </AppText>
          <View style={styles.formGrid}>
            {DOSAGE_FORM_ITEMS.map((item) => {
              const isSelected = entry.doseForm === item.value;
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
                  onPress={() => !isReadOnly && onChange({ ...entry, doseForm: item.value })}
                  disabled={isReadOnly}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
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

        <FormNumberInput
          label="Dose Amount"
          required
          value={entry.doseAmount}
          onChangeText={(doseAmount) => onChange({ ...entry, doseAmount })}
          placeholder="e.g. 1"
          unit={getDoseUnitLabel(entry.doseForm)}
          accentColor={accentColor}
        />
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
          onChange={(scheduleDate) => {
            const updatedEntry = { ...entry, scheduleDate };
            if (scheduleDate.mode === 'single') {
              updatedEntry.frequency = 'daily';
              updatedEntry.daysOfWeek = [];
            }
            onChange(updatedEntry);
          }}
          accentColor={accentColor}
        />

        {entry.scheduleDate?.mode !== 'single' ? (
          <FormSegmentedControl
            label="Frequency"
            required
            options={FREQUENCY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            selected={entry.frequency}
            accentColor={accentColor}
            onSelect={(frequency) =>
              onChange({
                ...entry,
                frequency: frequency as MedicineEntryState['frequency'],
                daysOfWeek: frequency === 'weekly' ? entry.daysOfWeek : [],
              })
            }
          />
        ) : null}

        {entry.scheduleDate?.mode !== 'single' && entry.frequency === 'weekly' ? (
          <View style={styles.daysContainer}>
            <AppText variant="caption" weight="700" color="#5C6470" style={{ marginBottom: 6 }}>
              DAYS OF WEEK <AppText variant="caption" weight="700" color="#EF4444">*</AppText>
            </AppText>
            <View style={styles.daysRow}>
              {DAYS_OF_WEEK_OPTIONS.map((option) => {
                const selected = entry.daysOfWeek.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dayButton,
                      selected
                        ? { backgroundColor: accentColor, borderColor: accentColor }
                        : { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
                      isReadOnly && styles.readOnlyChip,
                    ]}
                    onPress={() => toggleDay(option.value as DayOfWeekCode)}
                    disabled={isReadOnly}
                    activeOpacity={0.7}
                  >
                    <AppText
                      variant="caption"
                      weight="800"
                      color={selected ? HomeTheme.white : '#475569'}
                    >
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
              required
              value={entry.medicineTime}
              onPress={() => setTimePickerVisible(true)}
            />
          </View>
          <View style={styles.halfCol}>
            <FormToggleRow
              label="Remind me"
              value={entry.reminderOn}
              onValueChange={(reminderOn) => onChange({ ...entry, reminderOn })}
              accentColor={accentColor}
            />
          </View>
        </View>

        {entry.reminderOn ? (
          <FormSelectInput
            label="Reminder Delay"
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
          placeholder="e.g. Give after food with water..."
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
    width: '31.5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
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
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
