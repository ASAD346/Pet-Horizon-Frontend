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
  disabled?: boolean;
  error?: string;
}

const POPULARITY_ORDER = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'];

export function SpeciesSelector({
  speciesList,
  value,
  onChange,
  loading = false,
  disabled = false,
  error,
}: SpeciesSelectorProps) {
  // Sort by popularity: Dog, Cat, Bird, etc.
  const sortedList = React.useMemo(() => {
    return [...speciesList].sort((a, b) => {
      const idxA = POPULARITY_ORDER.indexOf(a.trim().toLowerCase());
      const idxB = POPULARITY_ORDER.indexOf(b.trim().toLowerCase());
      const valA = idxA === -1 ? 999 : idxA;
      const valB = idxB === -1 ? 999 : idxB;
      return valA - valB;
    });
  }, [speciesList]);

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
          {sortedList.map((species) => {
            const selected = value === species;
            const icon = getSpeciesIcon(species);
            
            // Soft colored style mapping
            const iconColor = selected ? '#2E7D32' : '#64748B';
            const labelColor = selected ? '#1B5E20' : '#475569';

            return (
              <TouchableOpacity
                key={species}
                style={[
                  styles.tile,
                  selected && styles.tileSelected,
                  disabled && styles.tileDisabled,
                ]}
                onPress={() => !disabled && onChange(species)}
                activeOpacity={disabled ? 1 : 0.85}
                disabled={disabled}
              >
                <MaterialCommunityIcons
                  name={icon}
                  size={24}
                  color={iconColor}
                />
                <AppText
                  variant="caption"
                  color={labelColor}
                  style={[styles.tileLabel, selected && styles.tileLabelSelected, disabled && styles.tileLabelDisabled]}
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
    width: 68,
    height: 68,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  tileSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  tileDisabled: {
    opacity: 0.5,
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  tileLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '600',
    maxWidth: 64,
    textAlign: 'center',
  },
  tileLabelSelected: {
    fontWeight: '800',
  },
  tileLabelDisabled: {
    color: '#94A3B8',
  },
  errorText: {
    marginTop: Spacing.xs,
    marginLeft: 4,
  },
});
