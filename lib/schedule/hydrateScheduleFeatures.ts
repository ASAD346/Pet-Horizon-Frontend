import { mealTypeOptionsForSpecies, unitOptionsForSpecies } from '@/lib/feeding/feedingForm';
import { getGroomingTypeOptions, getSpeciesFeatures } from '@/lib/species/speciesFeatures';
import { pickDefaultUnitFromList } from '@/lib/schedule/defaults';
import type { GroomingTypeOption } from '@/types/grooming';

export interface ScheduleFeatureOptions {
  mealTypeOptions: { value: string; label: string }[];
  unitOptions: { value: string; label: string }[];
  groomingTypeOptions: GroomingTypeOption[];
  groomingVisible: boolean;
  defaultMeal: string;
  defaultUnit: string;
  defaultGrooming: string;
}

export function hydrateScheduleFeaturesFromSpecies(
  species?: string | null,
): ScheduleFeatureOptions {
  const speciesFeatures = getSpeciesFeatures(species);
  const mealOpts = mealTypeOptionsForSpecies(speciesFeatures.mealTypes);
  const unitOpts = unitOptionsForSpecies(speciesFeatures.inventoryUnits);
  const groomingTypes = getGroomingTypeOptions(species);
  const meal = mealOpts[0]?.value ?? '';
  const unit = pickDefaultUnitFromList(speciesFeatures.inventoryUnits);
  const grooming = groomingTypes[0]?.value ?? '';

  return {
    mealTypeOptions: mealOpts,
    unitOptions: unitOpts,
    groomingTypeOptions: groomingTypes,
    groomingVisible: speciesFeatures.groomingVisible,
    defaultMeal: meal,
    defaultUnit: unit,
    defaultGrooming: grooming,
  };
}

export function featureOptionsFromRemote(
  species: string | undefined,
  input: {
    mealTypes?: string[];
    inventoryUnits?: string[];
    groomingVisible?: boolean;
    groomingTypes?: GroomingTypeOption[];
  },
): ScheduleFeatureOptions {
  const local = getSpeciesFeatures(species);
  const mealTypes = input.mealTypes?.length ? input.mealTypes : local.mealTypes;
  const inventoryUnits = input.inventoryUnits?.length ? input.inventoryUnits : local.inventoryUnits;
  const groomingVisible = input.groomingVisible ?? local.groomingVisible;
  const groomingTypeOptions =
    input.groomingTypes?.length ? input.groomingTypes : getGroomingTypeOptions(species);
  const mealOpts = mealTypeOptionsForSpecies(mealTypes);
  const unitOpts = unitOptionsForSpecies(inventoryUnits);

  return {
    mealTypeOptions: mealOpts,
    unitOptions: unitOpts,
    groomingTypeOptions,
    groomingVisible,
    defaultMeal: mealOpts[0]?.value ?? '',
    defaultUnit: pickDefaultUnitFromList(inventoryUnits),
    defaultGrooming: groomingTypeOptions[0]?.value ?? '',
  };
}
