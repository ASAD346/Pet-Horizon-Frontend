import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { LoginTheme, Radius, Spacing } from '../../constants/theme';

export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster';

type SpeciesIcon = 'dog' | 'cat' | 'bird' | 'rabbit' | 'rodent';

const SPECIES: { id: PetSpecies; label: string; icon: SpeciesIcon }[] = [
  { id: 'dog', label: 'Dog', icon: 'dog' },
  { id: 'cat', label: 'Cat', icon: 'cat' },
  { id: 'bird', label: 'Bird', icon: 'bird' },
  { id: 'rabbit', label: 'Rabbit', icon: 'rabbit' },
  { id: 'hamster', label: 'Hamster', icon: 'rodent' },
];

interface SpeciesSelectorProps {
  value: PetSpecies;
  onChange: (species: PetSpecies) => void;
}

export function SpeciesSelector({ value, onChange }: SpeciesSelectorProps) {
  return (
    <View style={styles.wrapper}>
      <AppText variant="bodySmall" weight="700" color={LoginTheme.charcoal} style={styles.label}>
        Species
      </AppText>
      <View style={styles.row}>
        {SPECIES.map((species) => {
          const selected = value === species.id;
          return (
            <TouchableOpacity
              key={species.id}
              style={[styles.tile, selected && styles.tileSelected]}
              onPress={() => onChange(species.id)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name={species.icon}
                size={22}
                color={selected ? LoginTheme.footerText : LoginTheme.charcoal}
              />
              <AppText
                variant="caption"
                color={selected ? LoginTheme.footerText : LoginTheme.tagline}
                style={styles.tileLabel}
              >
                {species.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tileShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  android: { elevation: 1 },
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.sm,
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 62,
    backgroundColor: LoginTheme.inputBg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    ...tileShadow,
  },
  tileSelected: {
    backgroundColor: LoginTheme.green,
  },
  tileLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '600',
  },
});
