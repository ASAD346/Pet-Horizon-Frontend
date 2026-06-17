/** Mirrors backend `speciesFeatures.js` for offline / API-failure fallbacks. */

const PET_SPECIES = ['Dog', 'Cat', 'Bird', 'Fish', 'Hamster', 'Rabbit', 'Reptile', 'Other'] as const;

const FEEDING_MEAL_TYPES: Record<string, string[]> = {
  Dog: ['breakfast', 'lunch', 'dinner', 'snacks'],
  Cat: ['breakfast', 'lunch', 'dinner', 'snacks'],
  Bird: ['morning_feed', 'evening_feed'],
  Fish: ['automatic_feeder'],
  Hamster: ['evening_feed'],
  Rabbit: ['evening_feed'],
  Reptile: ['breakfast', 'dinner'],
  Other: ['breakfast', 'lunch', 'dinner'],
};

const INVENTORY_UNITS: Record<string, string[]> = {
  Dog: ['kg', 'lb', 'cup', 'cups'],
  Cat: ['kg', 'lb', 'cup', 'cups'],
  Bird: ['g', 'gram', 'grams'],
  Fish: ['g', 'gram', 'grams', 'pinch'],
  Hamster: ['tbsp', 'tablespoon', 'tablespoons'],
  Rabbit: ['kg', 'lb', 'cup', 'cups'],
  Reptile: ['g', 'gram', 'kg', 'cup'],
  Other: ['kg', 'lb', 'g', 'cup', 'cups'],
};

const GROOMING_TYPES: Record<string, string[]> = {
  Dog: ['bath', 'nail_trim', 'haircut', 'ear_cleaning', 'brushing'],
  Cat: ['nail_trim', 'bath', 'brushing'],
  Rabbit: ['nail_trim', 'brushing'],
  Bird: ['wing_trim'],
};

const GROOMING_TYPE_LABELS: Record<string, string> = {
  bath: 'Bath',
  nail_trim: 'Nail trim',
  haircut: 'Haircut',
  ear_cleaning: 'Ear cleaning',
  brushing: 'Brushing',
  wing_trim: 'Wing trim',
};

const SPECIES_HIDDEN_MODULES: Record<string, string[]> = {
  Dog: [],
  Cat: [],
  Bird: [],
  Fish: ['grooming'],
  Hamster: ['grooming'],
  Rabbit: [],
  Reptile: ['grooming'],
  Other: ['grooming'],
};

export interface LocalSpeciesFeatures {
  species: string;
  hiddenModules: string[];
  mealTypes: string[];
  inventoryUnits: string[];
  groomingTypes: string[];
  groomingVisible: boolean;
  walkingVisible: boolean;
}

export function normalizeSpecies(species?: string | null): string {
  if (!species) return 'Other';
  const found = PET_SPECIES.find((x) => x.toLowerCase() === species.trim().toLowerCase());
  return found ?? 'Other';
}

function getSpeciesHiddenModules(species: string): string[] {
  return [...(SPECIES_HIDDEN_MODULES[normalizeSpecies(species)] ?? SPECIES_HIDDEN_MODULES.Other)];
}

export function isGroomingVisibleForSpecies(species?: string | null): boolean {
  return !getSpeciesHiddenModules(species ?? '').includes('grooming');
}

export function getFeedingMealTypes(species?: string | null): string[] {
  const key = normalizeSpecies(species);
  return [...(FEEDING_MEAL_TYPES[key] ?? FEEDING_MEAL_TYPES.Other)];
}

export function getInventoryUnits(species?: string | null): string[] {
  const key = normalizeSpecies(species);
  return [...(INVENTORY_UNITS[key] ?? INVENTORY_UNITS.Other)];
}

export function getGroomingTypes(species?: string | null): string[] {
  const key = normalizeSpecies(species);
  if (!isGroomingVisibleForSpecies(key)) return [];
  return [...(GROOMING_TYPES[key] ?? [])];
}

export function groomingTypeLabel(value: string): string {
  return GROOMING_TYPE_LABELS[value] ?? value.replace(/_/g, ' ');
}

export function getGroomingTypeOptions(species?: string | null) {
  return getGroomingTypes(species).map((value) => ({
    value,
    label: groomingTypeLabel(value),
  }));
}

export function getSpeciesFeatures(species?: string | null): LocalSpeciesFeatures {
  const normalized = normalizeSpecies(species);
  const hiddenModules = getSpeciesHiddenModules(normalized);
  return {
    species: normalized,
    hiddenModules,
    mealTypes: getFeedingMealTypes(normalized),
    inventoryUnits: getInventoryUnits(normalized),
    groomingTypes: getGroomingTypes(normalized),
    groomingVisible: isGroomingVisibleForSpecies(normalized),
    walkingVisible: true,
  };
}
