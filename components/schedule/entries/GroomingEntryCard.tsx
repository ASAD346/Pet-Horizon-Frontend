import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import {
  FormSection,
  FormSegmentedControl,
  FormToggleRow,
  FormTextInput,
} from '@/components/sheets';
import { ScheduleDateFields } from '@/components/schedule/ScheduleDateFields';
import { HomeTheme } from '@/constants/theme';
import type { GroomingEntryState } from '@/lib/schedule/types';
import type { GroomingTypeOption } from '@/types/grooming';

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
  const cardContent = (
    <>
      <FormSegmentedControl
        label="Task Type"
        options={typeOptions.map((t) => ({ value: t.value, label: t.label }))}
        selected={entry.groomingType}
        onSelect={(groomingType) => onChange({ ...entry, groomingType })}
      />

      <ScheduleDateFields
        value={entry.scheduleDate}
        onChange={(scheduleDate) => onChange({ ...entry, scheduleDate })}
        accentColor={accentColor}
      />

      <FormToggleRow
        label="Remind me before grooming"
        value={entry.reminderOn}
        onValueChange={(reminderOn) => onChange({ ...entry, reminderOn })}
        icon="notifications-outline"
      />

      <FormTextInput
        label="Notes"
        value={entry.notes}
        onChangeText={(notes) => onChange({ ...entry, notes })}
        placeholder="Optional details..."
        multiline
      />
    </>
  );

  if (embeddedInSheet) {
    return (
      <FormSection title="Grooming task" icon="content-cut">
        {cardContent}
      </FormSection>
    );
  }

  return (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <AppText variant="bodySmall" weight="700" color={HomeTheme.text}>
          Task {index + 1}
        </AppText>
        {canRemove ? (
          <TouchableOpacity onPress={onRemove} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>
      {cardContent}
    </View>
  );
}

const styles = StyleSheet.create({
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E8EB',
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
});
