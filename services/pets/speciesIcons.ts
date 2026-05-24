import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type SpeciesIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const SPECIES_ICON_MAP: Record<string, SpeciesIconName> = {
  dog: 'dog',
  cat: 'cat',
  bird: 'bird',
  rabbit: 'rabbit',
  hamster: 'rodent',
  fish: 'fish',
  reptile: 'snake',
  other: 'paw',
};

export function getSpeciesIcon(speciesName: string): SpeciesIconName {
  const key = speciesName.trim().toLowerCase();
  return SPECIES_ICON_MAP[key] ?? 'paw';
}
