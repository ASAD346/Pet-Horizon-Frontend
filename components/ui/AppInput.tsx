import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  Animated, 
  Platform,
  ViewStyle
} from 'react-native';
import { Palette, Spacing, Radius } from '../../constants/theme';
import { AppText } from './AppText';

interface AppInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string;
  style?: ViewStyle;
}

export function AppInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  error,
  style,
}: AppInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <View style={[styles.container, style]}>
      <AppText 
        variant="bodySmall" 
        weight="600" 
        color={isFocused ? Palette.primary.base : Palette.gray[600]} 
        style={styles.label}
      >
        {label}
      </AppText>
      <View 
        style={[
          styles.inputContainer,
          { 
            borderColor: error ? Palette.error : (isFocused ? Palette.primary.base : Palette.gray[200]),
            backgroundColor: isFocused ? Palette.white : Palette.gray[100],
          }
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={Palette.gray[400]}
          style={styles.input}
        />
      </View>
      {error && (
        <AppText variant="caption" color={Palette.error} style={styles.errorText}>
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    width: '100%',
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  inputContainer: {
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  input: {
    fontSize: 16,
    color: Palette.gray[900],
    fontWeight: '500',
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },
});
