import React, { useState } from 'react';
import { View } from 'react-native';
import {
  FormChipRow,
  FormPickerField,
  FormSectionLabel,
  formSheetStyles,
} from '@/components/sheets';
import { ThemedDatePicker } from '@/components/pet/ThemedDatePicker';
import { formatDateLabel } from '@/lib/grooming/groomingForm';
import {
  SCHEDULE_DATE_MODE_OPTIONS,
  setScheduleDateMode,
  type ScheduleDateMode,
  type ScheduleDateState,
} from '@/lib/schedule/scheduleDate';

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
      {showModeLabel ? <FormSectionLabel text="WHEN" /> : null}
      <FormChipRow
        options={SCHEDULE_DATE_MODE_OPTIONS}
        selected={value.mode}
        onSelect={(mode) => handleModeChange(mode as ScheduleDateMode)}
        accentColor={accentColor}
      />

      {value.mode === 'single' ? (
        <>
          <FormSectionLabel text="DATE" />
          <FormPickerField
            label={value.singleDate ? formatDateLabel(value.singleDate) : 'Select date'}
            icon="calendar-outline"
            onPress={() => setSinglePickerVisible(true)}
          />
        </>
      ) : null}

      {value.mode === 'range' ? (
        <View style={formSheetStyles.twoColRow}>
          <View style={formSheetStyles.halfCol}>
            <FormSectionLabel text="START" />
            <FormPickerField
              label={value.startDate ? formatDateLabel(value.startDate) : 'Select date'}
              icon="calendar-outline"
              onPress={() => setStartPickerVisible(true)}
            />
          </View>
          <View style={formSheetStyles.halfCol}>
            <FormSectionLabel text="END" />
            <FormPickerField
              label={value.endDate ? formatDateLabel(value.endDate) : 'Select date'}
              icon="calendar-outline"
              onPress={() => setEndPickerVisible(true)}
            />
          </View>
        </View>
      ) : null}

      {value.mode === 'ongoing' ? (
        <>
          <FormSectionLabel text="STARTS ON" />
          <FormPickerField
            label={value.startDate ? formatDateLabel(value.startDate) : 'Select date'}
            icon="calendar-outline"
            onPress={() => setStartPickerVisible(true)}
          />
        </>
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
