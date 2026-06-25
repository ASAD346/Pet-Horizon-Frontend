import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
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
        variant="caption" 
        weight="700" 
        color={error ? Palette.error : (isFocused ? Palette.primary.base : Palette.gray[600])} 
        style={styles.label}
      >
        {label.toUpperCase()}
      </AppText>
      <View 
        style={[
          styles.inputContainer,
          { 
            borderColor: error ? Palette.error : (isFocused ? Palette.primary.base : Palette.gray[200]),
            backgroundColor: isFocused ? Palette.white : Palette.gray[50],
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
        <AppText variant="caption" weight="600" color={Palette.error} style={styles.errorText}>
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm + 4,
    width: '100%',
  },
  label: {
    marginBottom: 4,
    marginLeft: 2,
    letterSpacing: 0.8,
  },
  inputContainer: {
    height: 48, // Sized compact and premium instead of oversized 56px
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  input: {
    fontSize: 15,
    color: Palette.gray[900],
    padding: 0,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 2,
  },
});
