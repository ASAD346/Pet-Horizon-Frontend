import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  FormSegmentedControl,
  FormDateInput,
} from '@/components/sheets';
import { ThemedDatePicker } from '@/components/pet/ThemedDatePicker';
import {
  SCHEDULE_DATE_MODE_OPTIONS,
  setScheduleDateMode,
  type ScheduleDateMode,
  type ScheduleDateState,
} from '@/lib/schedule/scheduleDate';
import { Spacing } from '@/constants/theme';

interface ScheduleDateFieldsProps {
  value: ScheduleDateState;
  onChange: (next: ScheduleDateState) => void;
  accentColor: string;
  showModeLabel?: boolean;
}

export function ScheduleDateFields({
  value,
  onChange,
  accentColor,
  showModeLabel = true,
}: ScheduleDateFieldsProps) {
  const [singlePickerVisible, setSinglePickerVisible] = useState(false);
  const [startPickerVisible, setStartPickerVisible] = useState(false);
  const [endPickerVisible, setEndPickerVisible] = useState(false);

  const handleModeChange = (mode: ScheduleDateMode) => {
    onChange(setScheduleDateMode(value, mode));
  };

  return (
    <>
      <FormSegmentedControl
        label={showModeLabel ? "When" : undefined}
        options={SCHEDULE_DATE_MODE_OPTIONS}
        selected={value.mode}
        onSelect={(mode) => handleModeChange(mode as ScheduleDateMode)}
      />

      {value.mode === 'single' ? (
        <FormDateInput
          label="Date"
          value={value.singleDate ?? new Date()}
          onPress={() => setSinglePickerVisible(true)}
        />
      ) : null}

      {value.mode === 'range' ? (
        <View style={styles.twoColRow}>
          <View style={styles.halfCol}>
            <FormDateInput
              label="Start Date"
              value={value.startDate ?? new Date()}
              onPress={() => setStartPickerVisible(true)}
            />
          </View>
          <View style={styles.halfCol}>
            <FormDateInput
              label="End Date"
              value={value.endDate ?? new Date()}
              onPress={() => setEndPickerVisible(true)}
            />
          </View>
        </View>
      ) : null}

      {value.mode === 'ongoing' ? (
        <FormDateInput
          label="Starts On"
          value={value.startDate ?? new Date()}
          onPress={() => setStartPickerVisible(true)}
        />
      ) : null}

      <ThemedDatePicker
        visible={singlePickerVisible}
        title="Schedule date"
        value={value.singleDate ?? new Date()}
        onClose={() => setSinglePickerVisible(false)}
        onConfirm={(date) => {
          onChange({ ...value, singleDate: date });
          setSinglePickerVisible(false);
        }}
      />

      <ThemedDatePicker
        visible={startPickerVisible}
        title={value.mode === 'ongoing' ? 'Starts on' : 'Start date'}
        value={value.startDate ?? new Date()}
        maximumDate={value.mode === 'range' ? (value.endDate ?? undefined) : undefined}
        onClose={() => setStartPickerVisible(false)}
        onConfirm={(date) => {
          const next = { ...value, startDate: date };
          if (value.mode === 'range' && value.endDate && date.getTime() > value.endDate.getTime()) {
            next.endDate = null;
          }
          onChange(next);
          setStartPickerVisible(false);
        }}
      />

      <ThemedDatePicker
        visible={endPickerVisible}
        title="End date"
        value={value.endDate ?? value.startDate ?? new Date()}
        minimumDate={value.startDate ?? undefined}
        onClose={() => setEndPickerVisible(false)}
        onConfirm={(date) => {
          onChange({ ...value, endDate: date });
          setEndPickerVisible(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  twoColRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfCol: {
    flex: 1,
  },
});
