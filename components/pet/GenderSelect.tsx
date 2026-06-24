import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Palette, Radius, Spacing } from '../../constants/theme';

const GENDERS = ['Male', 'Female'] as const;
export type PetGender = (typeof GENDERS)[number];

interface GenderSelectProps {
  value: PetGender;
  onChange: (gender: PetGender) => void;
}

export function GenderSelect({ value, onChange }: GenderSelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrapper}>
      <AppText variant="bodySmall" weight="700" color="#1A2B4E" style={styles.label}>
        Gender
      </AppText>
      <TouchableOpacity 
        style={[styles.field, open && styles.fieldActive]} 
        onPress={() => setOpen(true)} 
        activeOpacity={0.8}
      >
        <AppText variant="body" color={Palette.gray[800]} weight="600">
          {value}
        </AppText>
        <Ionicons name="chevron-down" size={18} color="#5CB35D" />
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
});
