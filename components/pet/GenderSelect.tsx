import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Palette, Radius, Spacing } from '../../constants/theme';

const GENDERS = ['Male', 'Female'] as const;
export type PetGender = (typeof GENDERS)[number];

interface GenderSelectProps {
  value: PetGender;
  onChange: (gender: PetGender) => void;
  readOnly?: boolean;
}

export function GenderSelect({ value, onChange, readOnly }: GenderSelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrapper}>
      <AppText variant="bodySmall" weight="700" color="#1A2B4E" style={styles.label}>
        Gender
      </AppText>
      <TouchableOpacity 
        style={[
          styles.field, 
          open && styles.fieldActive,
          readOnly && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }
        ]} 
        onPress={() => !readOnly && setOpen(true)} 
        activeOpacity={readOnly ? 1 : 0.8}
        disabled={readOnly}
      >
        <AppText variant="body" color={readOnly ? Palette.gray[500] : Palette.gray[800]} weight="600">
          {value}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={readOnly ? Palette.gray[400] : "#5CB35D"} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            {GENDERS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.option, value === option && styles.optionActive]}
                onPress={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                <AppText
                  variant="body"
                  weight={value === option ? '700' : '600'}
                  color={value === option ? '#5CB35D' : Palette.gray[800]}
                >
                  {option}
                </AppText>
                {value === option && (
                  <Ionicons name="checkmark" size={18} color="#5CB35D" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  // ── Editable field ──────────────────────────────────────────
  field: {
    height: 52,
    backgroundColor: '#FCFCFD',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1A2B4E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  fieldActive: {
    borderColor: '#5CB35D',
    backgroundColor: Palette.white,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 43, 78, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  sheet: {
    backgroundColor: '#F1F7F1',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    paddingVertical: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  optionActive: {
    backgroundColor: 'rgba(92, 179, 93, 0.08)',
  },
  // ── Read-only info card ──────────────────────────────────────
  readOnlyCard: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
    borderLeftWidth: 3,
    borderLeftColor: '#5CB35D',
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#5CB35D',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  readOnlyText: {
    fontSize: 14,
  },
});
