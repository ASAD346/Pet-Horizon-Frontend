import type { ApiPet } from '@/types/pet';

export function formatPetAge(birthday?: string | null): string {
  if (!birthday) return '—';
  const born = new Date(birthday);
  if (Number.isNaN(born.getTime())) return '—';

  const now = new Date();
  let years = now.getFullYear() - born.getFullYear();
  const monthDiff = now.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getDate())) {
    years -= 1;
  }
  if (years < 1) {
    const months = Math.max(
      0,
      (now.getFullYear() - born.getFullYear()) * 12 + now.getMonth() - born.getMonth(),
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
