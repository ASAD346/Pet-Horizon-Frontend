import type { DashboardStatus } from '@/types/dashboard';
import { formatPetAge, formatPetWeight } from '@/services/pets/petDisplay';

export function dashboardToProfileStats(status: DashboardStatus) {
  const planLabel = status.isPremium
    ? status.plan.charAt(0).toUpperCase() + status.plan.slice(1)
    : 'Free';

  const renewLabel = status.planExpiresAt
    ? new Date(status.planExpiresAt).toLocaleDateString()
    : '—';

  return {
    name: status.name,
    breed: status.breed || status.species || '—',
    age: status.age != null ? `${status.age} ${status.age === 1 ? 'year' : 'years'}` : formatPetAge(status.birthday),
    gender: status.gender || '—',
    weight: formatPetWeight(status.weight, status.weightUnit),
    activity: planLabel,
    health: status.weight != null ? formatPetWeight(status.weight, status.weightUnit) : '—',
    mood: status.isPremium ? 'Premium' : 'Standard',
    photoUrl: status.photoUrl,
    planLabel,
    renewLabel,
    isPremium: status.isPremium,
  };
}
