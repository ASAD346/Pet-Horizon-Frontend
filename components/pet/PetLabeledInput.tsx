import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Platform,
  TextInputProps,
} from 'react-native';
import { AppText } from '../ui/AppText';
import { LoginTheme, Radius, Spacing } from '../../constants/theme';

interface PetLabeledInputProps extends Pick<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'keyboardType'> {
  label: string;
}

export function PetLabeledInput({ label, value, onChangeText, placeholder, keyboardType }: PetLabeledInputProps) {
  return (
    <View style={styles.wrapper}>
      <AppText variant="bodySmall" weight="700" color={LoginTheme.charcoal} style={styles.label}>
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={LoginTheme.inputPlaceholder}
        keyboardType={keyboardType}
        style={styles.input}
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
  android: {
    elevation: 1,
  },
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.sm,
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: 2,
  },
  input: {
    height: 42,
    backgroundColor: LoginTheme.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: LoginTheme.charcoal,
    fontWeight: '500',
    ...fieldShadow,
  },
});
