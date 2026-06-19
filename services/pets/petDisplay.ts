import type { ApiPet } from '@/types/pet';
import { parseBirthdayParts } from '@/lib/pet/birthdayUtils';

export function formatPetAge(birthday?: string | null): string {
  const parts = parseBirthdayParts(birthday);
  if (!parts) return '—';

  const now = new Date();
  let years = now.getFullYear() - parts.year;
  if (
    now.getMonth() < parts.month ||
    (now.getMonth() === parts.month && now.getDate() < parts.day)
  ) {
    years -= 1;
  }
  if (years < 1) {
    const months = Math.max(
      0,
      (now.getFullYear() - parts.year) * 12 + now.getMonth() - parts.month,
    );
    return months <= 1 ? '1 month' : `${months} months`;
  }
  return years === 1 ? '1 year' : `${years} years`;
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
