import type { ApiPet } from '@/types/pet';
import { calculatePetAge } from '@/lib/pet/birthdayUtils';

export function formatPetAge(birthday?: string | null): string {
  const age = calculatePetAge(birthday);
  return age === 'Not set' ? '—' : age;
}

export function formatPetWeight(weight?: number | null, unit?: string | null): string {
  if (weight == null || Number.isNaN(weight)) return '—';
  const u = unit === 'lbs' ? 'lbs' : unit === 'kg' ? 'kg' : unit ?? 'kg';
  return `${weight} ${u.toUpperCase()}`;
}

export function petToProfileProps(pet: ApiPet) {
  return {
    name: pet.name,
    breed: pet.breed || pet.species || '—',
    age: formatPetAge(pet.birthday),
    gender: pet.gender || '—',
    weight: formatPetWeight(pet.weight, pet.weightUnit),
  };
}
