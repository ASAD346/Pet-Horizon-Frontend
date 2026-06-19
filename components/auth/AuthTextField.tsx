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
import { LoginTheme, Radius, Spacing } from '../../constants/theme';

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
  const isPassword = Boolean(secureTextEntry);
  const masked = isPassword && !passwordVisible;

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact, style]}>
      <View
        style={[
          styles.container,
          compact && styles.containerCompact,
          error ? styles.containerError : null,
        ]}
      >
        <Ionicons name={icon} size={18} color={LoginTheme.inputPlaceholder} style={styles.icon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={LoginTheme.inputPlaceholder}
          keyboardType={keyboardType}
          secureTextEntry={masked}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          editable={editable}
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
              color={LoginTheme.inputPlaceholder}
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
    height: 46,
    backgroundColor: LoginTheme.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  icon: {
    marginRight: Spacing.sm,
  },
  containerCompact: {
    height: 42,
  },
  containerError: {
    borderWidth: 1,
    borderColor: '#EF9A9A',
  },
  errorText: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: LoginTheme.charcoal,
    fontWeight: '500',
    paddingVertical: 0,
  },
});
