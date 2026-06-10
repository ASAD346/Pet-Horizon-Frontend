import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType = 'default',
}: FormFieldProps) {
  return (
    <View style={styles.wrap}>
      <AppText variant="caption" weight="700" color={HomeTheme.textMuted} style={styles.label}>
        {label}
      </AppText>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={HomeTheme.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.sm,
  },
  label: {
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: HomeTheme.surfaceMuted,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    fontSize: 15,
    color: HomeTheme.text,
    backgroundColor: HomeTheme.white,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
});
