import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Platform,
  TextInputProps,
} from 'react-native';
import { AppText } from '../ui/AppText';
import { Palette, Radius, Spacing } from '../../constants/theme';

interface PetLabeledInputProps extends Pick<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'keyboardType'> {
  label: string;
}

export function PetLabeledInput({ label, value, onChangeText, placeholder, keyboardType }: PetLabeledInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <AppText variant="bodySmall" weight="700" color="#1A2B4E" style={styles.label}>
        {label}
      </AppText>
      <View
        style={[
          styles.inputContainer,
          isFocused ? styles.containerFocused : null,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Palette.gray[400]}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={styles.input}
        />
      </View>
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
  inputContainer: {
    height: 52,
    backgroundColor: '#FCFCFD',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    shadowColor: '#1A2B4E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  containerFocused: {
    borderColor: '#5CB35D',
    backgroundColor: Palette.white,
    shadowColor: '#5CB35D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Palette.gray[800],
    fontWeight: '600',
    paddingVertical: 0,
  },
});
