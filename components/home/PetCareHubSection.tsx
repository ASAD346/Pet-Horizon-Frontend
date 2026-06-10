import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { SectionHeader } from './SectionHeader';
import { homePillCard } from './homeStyles';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';

interface PetCareHubSectionProps {
  onPress?: () => void;
}

export function PetCareHubSection({ onPress }: PetCareHubSectionProps) {
  return (
    <View style={styles.section}>
      <SectionHeader title="Pet Care" />
      <TouchableOpacity style={[homePillCard.card, styles.card]} activeOpacity={0.85} onPress={onPress}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="paw" size={24} color={HomeTheme.cardGreen} />
        </View>
        <View style={styles.textBlock}>
          <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
            Activity, inventory, health & medical
          </AppText>
          <AppText variant="caption" color={HomeTheme.textMuted}>
            Open the pet care hub
          </AppText>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={HomeTheme.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.md,
  },
  card: {
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    marginLeft: Spacing.sm,
    gap: 2,
  },
});
