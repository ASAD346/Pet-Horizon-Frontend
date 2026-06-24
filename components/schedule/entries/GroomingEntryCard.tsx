import React from 'react';
import { View, TouchableOpacity, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import {
  FormChipRow,
  FormSection,
  FormSectionLabel,
  FormSwitchRow,
  FormTextField,
  SectionLabel,
} from '@/components/sheets';
import { ScheduleDateFields } from '@/components/schedule/ScheduleDateFields';
import { HomeTheme } from '@/constants/theme';
import type { GroomingEntryState } from '@/lib/schedule/types';
import type { GroomingTypeOption } from '@/types/grooming';
import { ScheduleColors, scheduleFieldStyles } from '../scheduleStyles';

interface GroomingEntryCardProps {
  entry: GroomingEntryState;
  index: number;
  accentColor: string;
  accentBg: string;
  typeOptions: GroomingTypeOption[];
  canRemove: boolean;
  embeddedInSheet?: boolean;
  onChange: (next: GroomingEntryState) => void;
  onRemove: () => void;
}

export function GroomingEntryCard({
  entry,
  index,
  accentColor,
  accentBg,
  typeOptions,
  canRemove,
  embeddedInSheet = false,
  onChange,
  onRemove,
}: GroomingEntryCardProps) {
  if (embeddedInSheet) {
    return (
      <>
        <FormSection title="Grooming task" icon="content-cut" accentColor={accentColor} accentBg={accentBg}>
          <FormSectionLabel text="TASK TYPE" />
          <FormChipRow
            options={typeOptions.map((t) => ({ value: t.value, label: t.label }))}
            selected={entry.groomingType}
            onSelect={(groomingType) => onChange({ ...entry, groomingType })}
            accentColor={accentColor}
          />
          <ScheduleDateFields
            value={entry.scheduleDate}
            onChange={(scheduleDate) => onChange({ ...entry, scheduleDate })}
            accentColor={accentColor}
          />
          <FormSwitchRow
            label="Remind me before grooming"
            value={entry.reminderOn}
            onValueChange={(reminderOn) => onChange({ ...entry, reminderOn })}
            accentColor={accentColor}
            icon="notifications-outline"
          />
          <FormSectionLabel text="NOTES" />
          <FormTextField
            value={entry.notes}
            onChangeText={(notes) => onChange({ ...entry, notes })}
            placeholder="Optional details..."
            multiline
          />
        </FormSection>
      </>
    );
  }

  return (
    <View style={scheduleFieldStyles.entryCard}>
      <View style={scheduleFieldStyles.entryHeader}>
        <AppText variant="bodySmall" weight="700" color={HomeTheme.text}>
          Task {index + 1}
        </AppText>
        {canRemove ? (
          <TouchableOpacity onPress={onRemove} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color={ScheduleColors.label} />
          </TouchableOpacity>
        ) : null}
      </View>

      <SectionLabel text="TASK TYPE" />
      <View style={scheduleFieldStyles.chipRow}>
        {typeOptions.map((option) => {
          const selected = entry.groomingType === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[scheduleFieldStyles.chip, selected && { backgroundColor: accentColor, borderColor: accentColor }]}
              onPress={() => onChange({ ...entry, groomingType: option.value })}
            >
              <AppText variant="bodySmall" weight="600" color={selected ? HomeTheme.white : HomeTheme.text}>
                {option.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScheduleDateFields
        value={entry.scheduleDate}
        onChange={(scheduleDate) => onChange({ ...entry, scheduleDate })}
        accentColor={accentColor}
      />

      <SectionLabel text="NOTIFICATIONS" />
      <View style={scheduleFieldStyles.switchRow}>
        <AppText variant="bodySmall" weight="600" color={ScheduleColors.fieldText}>
          Remind me
        </AppText>
        <Switch
          value={entry.reminderOn}
          onValueChange={(reminderOn) => onChange({ ...entry, reminderOn })}
          trackColor={{ false: '#E0E0E0', true: accentColor }}
          thumbColor={HomeTheme.white}
          ios_backgroundColor="#E0E0E0"
        />
      </View>

      <SectionLabel text="NOTES" />
      <TextInput
        value={entry.notes}
        onChangeText={(notes) => onChange({ ...entry, notes })}
        placeholder="Extra details..."
        placeholderTextColor={ScheduleColors.placeholder}
        style={[scheduleFieldStyles.textInput, scheduleFieldStyles.notesInput]}
        multiline
      />
    </View>
  );
}
