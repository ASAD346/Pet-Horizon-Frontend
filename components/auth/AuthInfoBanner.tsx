import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { LoginTheme, Radius, Spacing } from '../../constants/theme';

interface AuthInfoBannerProps {
  message: string;
}

export function AuthInfoBanner({ message }: AuthInfoBannerProps) {
  return (
    <View style={styles.container} accessibilityRole="text">
      <Ionicons name="mail-outline" size={18} color={LoginTheme.green} style={styles.icon} />
      <AppText variant="bodySmall" color={LoginTheme.charcoal} style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  icon: {
    marginRight: Spacing.sm,
    marginTop: 1,
  },
  text: {
    flex: 1,
    lineHeight: 18,
  },
});
