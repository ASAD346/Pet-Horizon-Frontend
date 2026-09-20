import type { ComponentProps } from 'react';
import type { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export const INVITE_PERMISSION_OPTIONS = [
  {
    id: 'feeding',
    label: 'Daily Feeding',
    icon: 'silverware-fork-knife' as const,
    ionicon: 'restaurant-outline' as const,
  },
  {
    id: 'walks',
    label: 'Exercise & Walks',
    icon: 'paw' as const,
    ionicon: 'walk-outline' as const,
  },
  {
    id: 'medicine',
    label: 'Medical Care',
    icon: 'pill' as const,
    ionicon: 'medkit-outline' as const,
  },
  {
    id: 'grooming',
    label: 'Grooming & Hygiene',
    icon: 'content-cut' as const,
    ionicon: 'cut-outline' as const,
  },
  {
    id: 'vaccination',
    label: 'Vaccinations',
    icon: 'needle' as const,
    ionicon: 'shield-checkmark-outline' as const,
  },
] as const;

export const DEFAULT_INVITE_MODULES = ['feeding', 'walks'];

export function inviteModuleLabel(moduleId: string): string {
  return INVITE_PERMISSION_OPTIONS.find((option) => option.id === moduleId)?.label ?? moduleId;
}

export function formatInviteModules(modules: string[]): string {
  if (!modules.length) return 'View pet profile only';
  return modules.map(inviteModuleLabel).join(' · ');
}
