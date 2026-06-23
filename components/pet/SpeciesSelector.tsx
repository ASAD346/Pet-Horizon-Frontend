import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { SkeletonChipGrid } from '@/components/ui/skeletons';
import { getSpeciesIcon } from '../../services/pets/speciesIcons';
import { Palette, Radius, Spacing } from '../../constants/theme';

interface SpeciesSelectorProps {
  speciesList: string[];
  value: string;
  onChange: (species: string) => void;
  loading?: boolean;
  error?: string;
}

export function SpeciesSelector({
  speciesList,
  value,
  onChange,
  loading = false,
  error,
}: SpeciesSelectorProps) {
  return (
    <View style={styles.wrapper}>
      <AppText variant="bodySmall" weight="700" color="#1A2B4E" style={styles.label}>
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
                  size={20}
                  color={selected ? Palette.white : '#1A2B4E'}
                />
                <AppText
                  variant="caption"
                  color={selected ? Palette.white : Palette.gray[500]}
                  style={[styles.tileLabel, selected && styles.tileLabelSelected]}
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
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: Spacing.sm,
    paddingVertical: 2,
  },
  tile: {
    width: 58,
    height: 58,
    backgroundColor: '#FCFCFD',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    shadowColor: '#1A2B4E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  tileSelected: {
    backgroundColor: '#5CB35D',
    borderColor: '#5CB35D',
    shadowColor: '#5CB35D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  tileLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '600',
    maxWidth: 60,
    textAlign: 'center',
  },
  tileLabelSelected: {
    fontWeight: '700',
  },
  errorText: {
    marginTop: Spacing.xs,
    marginLeft: 4,
  },
});
