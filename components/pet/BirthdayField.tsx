import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Palette, Spacing } from '../../constants/theme';
import { ThemedDatePicker } from './ThemedDatePicker';

interface BirthdayFieldProps {
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string;
  readOnly?: boolean;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BirthdayField({ value, onChange, error, readOnly }: BirthdayFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={styles.wrapper}>
      <AppText variant="bodySmall" weight="700" color="#1A2B4E" style={styles.label}>
        Birthday
      </AppText>
      <TouchableOpacity
        style={[
          styles.field, 
          showPicker && styles.fieldActive, 
          error ? styles.fieldError : null,
          readOnly && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }
        ]}
        onPress={() => !readOnly && setShowPicker(true)}
        activeOpacity={readOnly ? 1 : 0.8}
        disabled={readOnly}
      >
        <AppText
          variant="body"
          color={value ? (readOnly ? Palette.gray[500] : Palette.gray[800]) : Palette.gray[400]}
          weight="600"
        >
          {value ? formatDate(value) : 'Select Birthday'}
        </AppText>
        <Ionicons name="calendar-outline" size={20} color={readOnly ? Palette.gray[400] : "#5CB35D"} />
      </TouchableOpacity>

      {error ? (
        <AppText variant="caption" color="#C62828" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}

      <ThemedDatePicker
        visible={showPicker}
        value={value ?? new Date()}
        maximumDate={new Date()}
        onClose={() => setShowPicker(false)}
        onConfirm={(date) => {
          onChange(date);
          setShowPicker(false);
        }}
      />
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
  fieldError: {
    borderColor: '#EF9A9A',
  },
  errorText: {
    marginTop: Spacing.xs,
    marginLeft: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 1,
  },
});
