import { ImageSourcePropType } from 'react-native';

export const MascotImages = {
  schedule_empty: require('@/assets/images/mascots/schedule_empty.jpg'),
  detective: require('@/assets/images/mascots/detective.jpg'),
  expense: require('@/assets/images/mascots/expense.jpg'),
  pets_duo: require('@/assets/images/mascots/pets_duo.png'),
  species_dog: require('@/assets/images/mascots/species_dog.jpg'),
  species_cat: require('@/assets/images/mascots/species_cat.jpg'),
  species_rabbit: require('@/assets/images/mascots/species_rabbit.jpg'),
  species_bird: require('@/assets/images/mascots/species_bird.jpg'),
  species_fish: require('@/assets/images/mascots/species_fish.jpg'),
} as const;

export type MascotKey =
  | 'schedule_empty'
  | 'detective'
  | 'expense'
  | 'care_schedule'
  | 'notifications'
  | 'journal'
  | 'welcome'
  | 'danger'
  | 'warning'
  | 'success'
  | 'premium'
  | 'invite'
  | 'offline'
  | 'species_dog'
  | 'species_cat'
  | 'species_rabbit'
  | 'species_bird'
  | 'species_fish';

/**
 * Resolves semantic mascot keys to their bundled 3D image assets
 */
export function getMascotSource(key: MascotKey): ImageSourcePropType {
  switch (key) {
    case 'schedule_empty':
      return MascotImages.schedule_empty;
    case 'detective':
      return MascotImages.detective;
    case 'expense':
      return MascotImages.expense;
    case 'care_schedule':
    case 'journal':
    case 'welcome':
    case 'invite':
    case 'premium':
      return MascotImages.pets_duo;
    case 'danger':
    case 'warning':
    case 'offline':
      return MascotImages.detective;
    case 'notifications':
      return MascotImages.species_dog;
    case 'success':
      return MascotImages.species_dog;
    case 'species_dog':
      return MascotImages.species_dog;
    case 'species_cat':
      return MascotImages.species_cat;
    case 'species_rabbit':
      return MascotImages.species_rabbit;
    case 'species_bird':
      return MascotImages.species_bird;
    case 'species_fish':
      return MascotImages.species_fish;
    default:
      return MascotImages.pets_duo;
  }
}

/**
 * Maps a pet species (from backend/store) to its corresponding 3D mascot asset
 */
export function getSpeciesMascot(species?: string | null): ImageSourcePropType {
  if (!species) return MascotImages.pets_duo;
  const s = species.trim().toLowerCase();

  if (s.includes('cat') || s.includes('kitten') || s.includes('feline')) {
    return MascotImages.species_cat;
  }
  if (s.includes('rabbit') || s.includes('bunny') || s.includes('hare')) {
    return MascotImages.species_rabbit;
  }
  if (s.includes('bird') || s.includes('parrot') || s.includes('canary') || s.includes('budgie')) {
    return MascotImages.species_bird;
  }
  if (s.includes('fish') || s.includes('aquatic') || s.includes('goldfish')) {
    return MascotImages.species_fish;
  }
  if (s.includes('dog') || s.includes('puppy') || s.includes('canine')) {
    return MascotImages.species_dog;
  }

  // Fallback to signature mascot duo
  return MascotImages.pets_duo;
}
