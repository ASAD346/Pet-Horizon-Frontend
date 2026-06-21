import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { SkeletonChipGrid } from '@/components/ui/skeletons';
import { getSpeciesIcon } from '../../services/pets/speciesIcons';
import { LoginTheme, Radius, Spacing } from '../../constants/theme';

interface SpeciesSelectorProps {
  speciesList: string[];
  value: string;
  onChange: (species: string) => void;
  loading?: boolean;
  error?: string;
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

export function SpeciesSelector({
  speciesList,
  value,
  onChange,
  loading = false,
  error,
}: SpeciesSelectorProps) {
  return (
    <View style={styles.wrapper}>
      <AppText variant="bodySmall" weight="700" color={LoginTheme.charcoal} style={styles.label}>
        Species
      </AppText>

      {loading ? (
        <SkeletonChipGrid count={6} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {speciesList.map((species) => {
            const selected = value === species;
            const icon = getSpeciesIcon(species);
            return (
              <TouchableOpacity
                key={species}
                style={[styles.tile, selected && styles.tileSelected]}
                onPress={() => onChange(species)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name={icon}
                  size={22}
                  color={selected ? LoginTheme.footerText : LoginTheme.charcoal}
                />
                <AppText
                  variant="caption"
                  color={selected ? LoginTheme.footerText : LoginTheme.tagline}
                  style={styles.tileLabel}
                  numberOfLines={1}
                >
                  {species}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

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
    marginBottom: Spacing.sm,
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: 2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 62,
  },
  loadingText: {
    marginLeft: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: Spacing.sm,
  },
  tile: {
    width: 62,
    height: 62,
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
    maxWidth: 56,
    textAlign: 'center',
  },
  errorText: {
    marginTop: Spacing.xs,
    marginLeft: 2,
  },
});
