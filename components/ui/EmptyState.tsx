import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { AppText } from './AppText';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  description: string;
  buttonLabel?: string;
  onButtonPress?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  buttonLabel,
  onButtonPress,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={36} color={Colors.primary} />
      </View>
      <AppText variant="h3" weight="700" color={Colors.text} style={styles.title}>
        {title}
      </AppText>
      <AppText variant="bodySmall" color={Colors.textMuted} align="center" style={styles.description}>
        {description}
      </AppText>
      {buttonLabel && onButtonPress ? (
        <AppButton
          title={buttonLabel}
          onPress={onButtonPress}
          variant="primary"
          style={styles.button}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: 'transparent',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  description: {
    lineHeight: 18,
    marginBottom: Spacing.md,
    maxWidth: 260,
  },
  button: {
    minWidth: 160,
  },
});
