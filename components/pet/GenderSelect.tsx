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
import { LoginTheme, Radius, Spacing } from '../../constants/theme';

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
      <AppText variant="bodySmall" weight="700" color={LoginTheme.charcoal} style={styles.label}>
        Gender
      </AppText>
      <TouchableOpacity style={styles.field} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <AppText variant="body" color={LoginTheme.charcoal} weight="500">
          {value}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={LoginTheme.inputPlaceholder} />
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
                  weight={value === option ? '700' : '500'}
                  color={value === option ? LoginTheme.green : LoginTheme.charcoal}
                >
                  {option}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const fieldShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  android: { elevation: 1 },
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.sm,
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: 2,
  },
  field: {
    height: 42,
    backgroundColor: LoginTheme.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...fieldShadow,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  sheet: {
    backgroundColor: LoginTheme.screenBg,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  option: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LoginTheme.inputBg,
  },
  optionActive: {
    backgroundColor: '#F0F7F0',
  },
});
