import { isPetOwner } from '@/lib/family/formatters';
import { getSpeciesFeatures } from '@/lib/species/speciesFeatures';
import type { ScheduleSectionKey } from '@/lib/schedule/types';
import type { PetPermissionsResponse } from '@/types/pet';

export type AppModuleId =
  | 'feeding'
  | 'walks'
  | 'medicine'
  | 'grooming'
  | 'vaccination'
  | 'journal'
  | 'expenses';

export const ALL_APP_MODULES: AppModuleId[] = [
  'feeding',
  'walks',
  'medicine',
  'grooming',
  'vaccination',
  'journal',
  'expenses',
];

export const SCHEDULE_SECTION_TO_MODULE: Record<ScheduleSectionKey, AppModuleId> = {
  feeding: 'feeding',
  walk: 'walks',
  medicine: 'medicine',
  vaccination: 'vaccination',
  grooming: 'grooming',
};

export const QUICK_ACTION_MODULES: Record<string, AppModuleId> = {
  'Log Food': 'feeding',
  'Log Walk': 'walks',
  Medicine: 'medicine',
  Grooming: 'grooming',
  Vaccination: 'vaccination',
};

const MODULE_ALIASES: Record<string, AppModuleId> = {
  feeding: 'feeding',
  food: 'feeding',
  walks: 'walks',
  walk: 'walks',
  exercise: 'walks',
  medicine: 'medicine',
  medical: 'medicine',
  grooming: 'grooming',
  vaccination: 'vaccination',
  vaccinations: 'vaccination',
  vaccine: 'vaccination',
  journal: 'journal',
  expenses: 'expenses',
  expense: 'expenses',
  wallet: 'expenses',
};

export function normalizeModuleId(moduleId: string | null | undefined): AppModuleId | null {
  if (!moduleId) return null;
  return MODULE_ALIASES[moduleId.trim().toLowerCase()] ?? null;
}

function speciesHiddenModules(species?: string | null, remoteHidden?: string[]): string[] {
  const local = getSpeciesFeatures(species).hiddenModules;
  if (!remoteHidden?.length) return local;
  return [...new Set([...local, ...remoteHidden.map((m) => m.toLowerCase())])];
}

function isSpeciesModuleVisible(moduleId: AppModuleId, species?: string | null, remoteHidden?: string[]): boolean {
  const hidden = speciesHiddenModules(species, remoteHidden);
  if (moduleId === 'grooming') return !hidden.includes('grooming');
  if (moduleId === 'walks') return !hidden.includes('walks') && !hidden.includes('walk');
  return true;
}

function normalizeAllowedModules(modules: string[] | undefined): AppModuleId[] {
  if (!modules?.length) return [];
  const normalized = modules
    .map((moduleId) => normalizeModuleId(moduleId))
    .filter((moduleId): moduleId is AppModuleId => moduleId !== null);
  return [...new Set(normalized)];
}

function normalizeLockedModules(modules: string[] | undefined): AppModuleId[] {
  return normalizeAllowedModules(modules);
}

export function canEditAccessLevel(accessLevel: string | undefined): boolean {
  const level = accessLevel?.toLowerCase() ?? '';
  return level === 'edit' || level === 'admin';
}

export interface PetAccessControls {
  isOwner: boolean;
  isReadOnly: boolean;
  accessLevel: string;
  allowedModules: AppModuleId[];
  lockedModules: AppModuleId[];
  speciesFeatures: PetPermissionsResponse['speciesFeatures'] | null;
  canView: (moduleId: AppModuleId) => boolean;
  canEdit: (moduleId: AppModuleId) => boolean;
  canViewSchedule: (sectionKey: ScheduleSectionKey) => boolean;
  canEditSchedule: (sectionKey: ScheduleSectionKey) => boolean;
  canViewAnySchedule: boolean;
  canViewJournal: boolean;
  canEditJournal: boolean;
  canViewExpenses: boolean;
  canEditExpenses: boolean;
  accessBannerMessage: string | null;
}

export function buildPetAccessControls(params: {
  permissions: PetPermissionsResponse | null;
  petOwnerUserId?: string | null;
  userId?: string;
  species?: string | null;
}): PetAccessControls {
  const { permissions, petOwnerUserId, userId, species } = params;
  const isOwner = isPetOwner(petOwnerUserId, userId);
  const accessLevel = permissions?.accessLevel ?? (isOwner ? 'admin' : 'readonly');
  const allowedModules = normalizeAllowedModules(permissions?.allowedModules);
  const lockedModules = normalizeLockedModules(permissions?.lockedModules);
  const remoteHidden = permissions?.speciesFeatures?.hiddenModules;
  const isReadOnly = !isOwner && !canEditAccessLevel(accessLevel);

  const canView = (moduleId: AppModuleId): boolean => {
    if (!isSpeciesModuleVisible(moduleId, species, remoteHidden)) return false;
    if (isOwner) return true;
    if (lockedModules.includes(moduleId)) return false;
    return allowedModules.includes(moduleId);
  };

  const canEdit = (moduleId: AppModuleId): boolean => {
    if (!canView(moduleId)) return false;
    if (isOwner) return true;
    return canEditAccessLevel(accessLevel);
  };

  const canViewSchedule = (sectionKey: ScheduleSectionKey): boolean =>
    canView(SCHEDULE_SECTION_TO_MODULE[sectionKey]);

  const canEditSchedule = (sectionKey: ScheduleSectionKey): boolean =>
    canEdit(SCHEDULE_SECTION_TO_MODULE[sectionKey]);

  const canViewAnySchedule = ALL_APP_MODULES.some(
    (moduleId) =>
      moduleId !== 'journal' &&
      moduleId !== 'expenses' &&
      canView(moduleId),
  );

  let accessBannerMessage: string | null = null;

  return {
    isOwner,
    isReadOnly,
    accessLevel,
    allowedModules,
    lockedModules,
    speciesFeatures: permissions?.speciesFeatures ?? null,
    canView,
    canEdit,
    canViewSchedule,
    canEditSchedule,
    canViewAnySchedule,
    canViewJournal: canView('journal'),
    canEditJournal: canEdit('journal'),
    canViewExpenses: canView('expenses'),
    canEditExpenses: canEdit('expenses'),
    accessBannerMessage,
  };
}

export function dashboardTaskModule(task: { category?: string; source?: string }): AppModuleId | null {
  const category = task.category?.toLowerCase() ?? '';
  if (category === 'feeding' || category === 'food') return 'feeding';
  if (category === 'walk' || category === 'walks') return 'walks';
  if (category === 'medicine') return 'medicine';
  if (category === 'vaccination') return 'vaccination';
  if (task.source === 'grooming') return 'grooming';
  return normalizeModuleId(category);
}
