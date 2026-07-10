import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { Palette, Radius } from '@/constants/theme';

interface OtpInputProps {
  value: string;
  onChange: (code: string) => void;
  length?: number;
  error?: string;
}

export function OtpInput({ value, onChange, length = 6, error }: OtpInputProps) {
  const inputs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Split value into an array of characters
  const codeArray = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChangeText = (text: string, index: number) => {
    const cleanText = text.replace(/\D/g, '');
    if (cleanText.length > 1) {
      const fullCode = cleanText.slice(0, length);
      onChange(fullCode);
      const focusTarget = Math.min(fullCode.length, length - 1);
      inputs.current[focusTarget]?.focus();
      return;
    }

    const newCodeArray = [...codeArray];
    newCodeArray[index] = cleanText;
    const newCode = newCodeArray.join('');
    onChange(newCode);

    if (cleanText !== '' && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (codeArray[index] === '' && index > 0) {
        const newCodeArray = [...codeArray];
        newCodeArray[index - 1] = '';
        onChange(newCodeArray.join(''));
        inputs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputs.current[index] = ref;
          }}
          style={[
            styles.input,
            codeArray[index] !== '' && styles.inputFilled,
            focusedIndex === index && styles.inputFocused,
            !!error && styles.inputError,
          ]}
          value={codeArray[index]}
          onChangeText={(text) => handleChangeText(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(null)}
          keyboardType="number-pad"
          maxLength={index === 0 ? length : 1}
          selectTextOnFocus
          textAlign="center"
          autoFocus={index === 0}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputFilled: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  inputFocused: {
    borderColor: '#5CB35D',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: Palette.error,
  },
});
