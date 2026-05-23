import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { LoginTheme, Radius, Spacing } from '../../constants/theme';
import { ThemedDatePicker } from './ThemedDatePicker';

interface BirthdayFieldProps {
  value: Date;
  onChange: (date: Date) => void;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BirthdayField({ value, onChange }: BirthdayFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={styles.wrapper}>
      <AppText variant="bodySmall" weight="700" color={LoginTheme.charcoal} style={styles.label}>
        Birthday
      </AppText>
      <TouchableOpacity
        style={styles.field}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.8}
      >
        <AppText variant="body" color={LoginTheme.charcoal} weight="500">
          {formatDate(value)}
        </AppText>
        <Ionicons name="calendar-outline" size={20} color={LoginTheme.green} />
      </TouchableOpacity>

      <ThemedDatePicker
        visible={showPicker}
        value={value}
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
});
