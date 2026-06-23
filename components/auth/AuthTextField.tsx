import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Platform,
  ViewStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Palette, Spacing } from '../../constants/theme';

type AuthFieldIcon =
  | 'person-outline'
  | 'mail-outline'
  | 'lock-closed-outline'
  | 'keypad-outline';

interface AuthTextFieldProps
  extends Pick<
    TextInputProps,
    'value' | 'onChangeText' | 'keyboardType' | 'secureTextEntry' | 'autoCapitalize' | 'maxLength' | 'editable'
  > {
  placeholder: string;
  icon: AuthFieldIcon;
  compact?: boolean;
  error?: string;
  style?: ViewStyle;
  showPasswordToggle?: boolean;
}

export function AuthTextField({
  placeholder,
  icon,
  value,
  onChangeText,
  keyboardType,
  secureTextEntry,
  autoCapitalize = 'none',
  compact = false,
  error,
  style,
  maxLength,
  editable = true,
  showPasswordToggle = false,
}: AuthTextFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const isPassword = Boolean(secureTextEntry);
  const masked = isPassword && !passwordVisible;

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact, style]}>
      <View
        style={[
          styles.container,
          compact && styles.containerCompact,
          isFocused ? styles.containerFocused : null,
          error ? styles.containerError : null,
        ]}
      >
        <Ionicons 
          name={icon} 
          size={18} 
          color={error ? '#C62828' : isFocused ? '#5CB35D' : Palette.gray[400]} 
          style={styles.icon} 
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Palette.gray[400]}
          keyboardType={keyboardType}
          secureTextEntry={masked}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={styles.input}
        />
        {isPassword && showPasswordToggle ? (
          <TouchableOpacity
            onPress={() => setPasswordVisible((prev) => !prev)}
            hitSlop={10}
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Palette.gray[400]}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color="#C62828" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  wrapperCompact: {
    marginBottom: Spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#FCFCFD', // Sleek off-white tone
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    shadowColor: '#1A2B4E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  containerCompact: {
    height: 48,
    borderRadius: 12,
  },
  containerFocused: {
    borderColor: '#5CB35D',
    backgroundColor: Palette.white,
    shadowColor: '#5CB35D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, // Glowing green shadow on focus
    shadowRadius: 10,
    elevation: 3,
  },
  containerError: {
    borderColor: '#EF9A9A',
  },
  icon: {
    marginRight: Spacing.sm,
  },
  errorText: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Palette.gray[800],
    fontWeight: '600',
    paddingVertical: 0,
  },
});
