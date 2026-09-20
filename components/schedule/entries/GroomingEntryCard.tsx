import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import {
  FormToggleRow,
  FormTextInput,
} from '@/components/sheets';
import { ScheduleDateFields } from '@/components/schedule/ScheduleDateFields';
import { HomeTheme } from '@/constants/theme';
import type { GroomingEntryState } from '@/lib/schedule/types';
import type { GroomingTypeOption } from '@/types/grooming';

const GROOMING_TYPE_ICONS: Record<
  string,
  React.ComponentProps<typeof MaterialCommunityIcons>['name']
> = {
  bath: 'shower-head',
  brushing: 'hair-dryer',
  nail_trim: 'content-cut',
  ear_cleaning: 'ear-hearing',
  teeth_brushing: 'tooth-outline',
  haircut: 'scissors-cutting',
  flea_treatment: 'shield-bug-outline',
  eye_cleaning: 'eye-outline',
  general: 'content-cut',
};

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
  accentColor = '#0D9488',
  accentBg = '#CCFBF1',
  typeOptions,
  canRemove,
  embeddedInSheet = false,
  onChange,
  onRemove,
}: GroomingEntryCardProps) {
  const cardContent = (
    <View style={styles.formContainer}>
      {/* Task Details Card */}
      <View style={styles.sectionCard}>
        <AppText variant="caption" weight="700" color="#64748B" style={styles.sectionHeader}>
          TASK DETAILS
        </AppText>

        <View style={styles.fieldGroup}>
          <AppText variant="caption" weight="700" color="#5C6470" style={styles.fieldLabel}>
            GROOMING TYPE <AppText variant="caption" weight="700" color="#EF4444">*</AppText>
          </AppText>
          <View style={styles.formGrid}>
            {typeOptions.map((item) => {
              const isSelected = entry.groomingType === item.value;
              const iconName = GROOMING_TYPE_ICONS[item.value] || 'content-cut';
              const labelText =
                item.value === 'brushing'
                  ? 'Hair Brushing'
                  : item.value === 'teeth_brushing'
                  ? 'Teeth Brushing'
                  : item.label;

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
                  onPress={() => onChange({ ...entry, groomingType: item.value })}
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
                    {labelText}
                  </AppText>
                </TouchableOpacity>
              );
            })}
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

        <FormToggleRow
          label="Remind me before grooming"
          value={entry.reminderOn}
          onValueChange={(reminderOn) => onChange({ ...entry, reminderOn })}
          icon="notifications-outline"
        />
      </View>

      {/* Notes Card */}
      <View style={styles.sectionCard}>
        <FormTextInput
          label="Instructions & Notes"
          value={entry.notes}
          onChangeText={(notes) => onChange({ ...entry, notes })}
          placeholder="Optional notes (shampoo brand, groomer details)..."
          multiline
        />
      </View>
    </View>
  );

  if (embeddedInSheet) {
    return cardContent;
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
});
