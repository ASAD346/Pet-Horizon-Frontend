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
import { useAppSelector } from '@/redux/store';
import { selectIsFormReadOnly } from '@/redux/reducer';

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
  wing_trim: 'feather',
  flea_treatment: 'shield-bug-outline',
  eye_cleaning: 'eye-outline',
  general: 'content-cut',
};

function getGroomingIcon(value: string): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  const v = value.toLowerCase();
  if (GROOMING_TYPE_ICONS[v]) return GROOMING_TYPE_ICONS[v];
  if (v.includes('bath') || v.includes('wash')) return 'shower-head';
  if (v.includes('brush')) return 'hair-dryer';
  if (v.includes('nail') || v.includes('claw') || v.includes('cut')) return 'content-cut';
  if (v.includes('ear')) return 'ear-hearing';
  if (v.includes('teeth') || v.includes('tooth')) return 'tooth-outline';
  if (v.includes('wing') || v.includes('feather')) return 'feather';
  if (v.includes('eye')) return 'eye-outline';
  if (v.includes('flea') || v.includes('tick')) return 'shield-bug-outline';
  return 'content-cut';
}

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
  const isReadOnly = useAppSelector(selectIsFormReadOnly);

  const cardContent = (
    <View style={styles.formContainer}>
      {/* Task Details Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconBadge, { backgroundColor: accentBg }]}>
            <MaterialCommunityIcons name="content-cut" size={16} color={accentColor} />
          </View>
          <AppText variant="caption" weight="800" color="#5C6470" style={styles.sectionHeader}>
            TASK DETAILS
          </AppText>
        </View>

        <View style={styles.fieldGroup}>
          <AppText variant="caption" weight="700" color="#5C6470" style={styles.fieldLabel}>
            GROOMING TYPE <AppText variant="caption" weight="700" color="#EF4444">*</AppText>
          </AppText>
          <View style={styles.formGrid}>
            {typeOptions.map((item) => {
              const isSelected = entry.groomingType === item.value;
              const iconName = getGroomingIcon(item.value);
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
                    isReadOnly && styles.readOnlyChip,
                  ]}
                  onPress={() => !isReadOnly && onChange({ ...entry, groomingType: item.value })}
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

        <FormToggleRow
          label="Remind me before grooming"
          value={entry.reminderOn}
          onValueChange={(reminderOn) => onChange({ ...entry, reminderOn })}
          icon="notifications-outline"
          accentColor={accentColor}
        />
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
          placeholder="Optional notes (shampoo brand, groomer details)..."
          multiline
          accentColor={accentColor}
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
});
