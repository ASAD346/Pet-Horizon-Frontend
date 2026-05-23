import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Platform,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoginTheme, Radius, Spacing } from '../../constants/theme';

type AuthFieldIcon = 'person-outline' | 'mail-outline' | 'lock-closed-outline';

interface AuthTextFieldProps extends Pick<TextInputProps, 'value' | 'onChangeText' | 'keyboardType' | 'secureTextEntry' | 'autoCapitalize'> {
  placeholder: string;
  icon: AuthFieldIcon;
  compact?: boolean;
  style?: ViewStyle;
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
  style,
}: AuthTextFieldProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      <Ionicons name={icon} size={18} color={LoginTheme.inputPlaceholder} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={LoginTheme.inputPlaceholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    backgroundColor: LoginTheme.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
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
    marginBottom: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: LoginTheme.charcoal,
    fontWeight: '500',
    paddingVertical: 0,
  },
});
