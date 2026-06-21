import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export const INVITE_PERMISSION_OPTIONS = [
  { id: 'feeding', label: 'Daily Feeding', icon: 'restaurant-outline' as const },
  { id: 'walks', label: 'Exercise & Walks', icon: 'walk-outline' as const },
  { id: 'medicine', label: 'Medical Care', icon: 'medkit-outline' as const },
  { id: 'grooming', label: 'Grooming & Hygiene', icon: 'cut-outline' as const },
  { id: 'vaccination', label: 'Vaccinations', icon: 'shield-checkmark-outline' as const },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
}>;

export const DEFAULT_INVITE_MODULES = ['feeding', 'walks'];

export function inviteModuleLabel(moduleId: string): string {
  return INVITE_PERMISSION_OPTIONS.find((option) => option.id === moduleId)?.label ?? moduleId;
}

export function formatInviteModules(modules: string[]): string {
  if (!modules.length) return 'View pet profile only';
  return modules.map(inviteModuleLabel).join(' · ');
}
