import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText } from '../ui/AppText';
import { SkeletonChipGrid } from '@/components/ui/skeletons';
import { SpeciesIcon, getSpeciesTheme } from './SpeciesIcon';
import { Palette, Radius, Spacing } from '../../constants/theme';

interface SpeciesSelectorProps {
  speciesList: string[];
  value: string;
  onChange: (species: string) => void;
  loading?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  required?: boolean;
}

const POPULARITY_ORDER = [
  'dog',
  'cat',
  'bird',
  'rabbit',
  'hamster',
  'fish',
  'reptile',
  'other',
];

export function SpeciesSelector({
  speciesList,
  value,
  onChange,
  loading = false,
  disabled = false,
  readOnly = false,
  error,
  required,
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

  const handleSelect = (species: string) => {
    if (disabled) return;
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics optional
    }
    onChange(species);
  };

  // ── Read-only: show only the selected species as a status badge ───────────
  if (readOnly) {
    const theme = getSpeciesTheme(value);
    return (
      <View style={styles.wrapper}>
        <AppText variant="bodySmall" weight="700" color="#1A2B4E" style={styles.label}>
          Species
          {required ? <AppText variant="bodySmall" weight="700" color="#EF4444"> *</AppText> : null}
        </AppText>
        <View style={styles.readOnlyRow}>
          {value ? (
            <View
              style={[
                styles.readOnlyBadge,
                {
                  backgroundColor: theme.bgLight,
                  borderColor: theme.borderSelected,
                },
              ]}
            >
              <SpeciesIcon species={value} size={26} />
              <AppText
                variant="body"
                color={theme.selectedTextColor}
                weight="700"
                style={styles.readOnlyBadgeLabel}
                numberOfLines={1}
              >
                {value}
              </AppText>
            </View>
          ) : (
            <AppText variant="bodySmall" color={Palette.gray[500]}>
              —
            </AppText>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <AppText variant="bodySmall" weight="700" color="#1A2B4E" style={styles.label}>
        Species
        {required ? <AppText variant="bodySmall" weight="700" color="#EF4444"> *</AppText> : null}
      </AppText>

      {loading ? (
        <SkeletonChipGrid count={6} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollRow}
        >
          {sortedList.map((species) => {
            const isSelected = value?.trim().toLowerCase() === species.trim().toLowerCase();
            const theme = getSpeciesTheme(species);

            return (
              <TouchableOpacity
                key={species}
                style={[
                  styles.tile,
                  {
                    backgroundColor: isSelected ? theme.bgSelected : theme.bgLight,
                    borderColor: isSelected ? theme.borderSelected : theme.borderLight,
                  },
                  isSelected && styles.tileSelected,
                  disabled && styles.tileDisabled,
                ]}
                onPress={() => handleSelect(species)}
                activeOpacity={disabled ? 1 : 0.8}
                disabled={disabled}
              >
                {/* Selection Check Badge */}
                {isSelected ? (
                  <View
                    style={[
                      styles.checkBadge,
                      { backgroundColor: theme.borderSelected },
                    ]}
                  >
                    <Ionicons name="checkmark-sharp" size={11} color="#FFFFFF" />
                  </View>
                ) : null}

                {/* Vector Species Illustration */}
                <View style={styles.iconWrapper}>
                  <SpeciesIcon species={species} size={36} selected={isSelected} />
                </View>

                {/* Capitalized Label */}
                <AppText
                  variant="caption"
                  color={isSelected ? theme.selectedTextColor : theme.textColor}
                  weight={isSelected ? '700' : '600'}
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
    marginLeft: 4,
  },
  scrollRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  tile: {
    position: 'relative',
    width: 74,
    height: 82,
    borderRadius: Radius.lg,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  tileSelected: {
    borderWidth: 2.2,
    transform: [{ scale: 1.02 }],
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
      },
      android: {
        elevation: 3.5,
      },
    }),
  },
  tileDisabled: {
    opacity: 0.55,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  checkBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tileLabel: {
    fontSize: 11,
    textAlign: 'center',
    textTransform: 'capitalize',
    maxWidth: 68,
  },
  errorText: {
    marginTop: Spacing.xs,
    marginLeft: 4,
  },
  // ── Read-only single-badge ────────────────────────────────────
  readOnlyRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Radius.md,
    borderWidth: 1.8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  readOnlyBadgeLabel: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
});
