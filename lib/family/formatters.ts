import type { ApiUser } from '@/types/auth';
import type { ApiPet } from '@/types/pet';
import type { FamilyHubMemberRow, FamilyMemberDisplay, PetMemberRow } from '@/types/family';

const MODULE_LABELS: Record<string, string> = {
  feeding: 'Feeding',
  walks: 'Walks',
  walk: 'Walks',
  medicine: 'Medicine',
  grooming: 'Grooming',
  vaccination: 'Vaccination',
  reminders: 'Reminders',
  journal: 'Journal',
  expenses: 'Expenses',
  inventory: 'Inventory',
  health: 'Health',
  medical: 'Medical',
};

const AVATAR_COLORS = ['#F48024', '#5CB35D', '#5B9BD5', '#E91E8C', '#673AB7', '#4DB6AC'];

export function formatJoinCode(token: string): string {
  const clean = token.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length >= 6) {
    return `PAW-${clean.slice(0, 3)}-${clean.slice(3, 6)}`;
  }
  return clean.slice(0, 11) || '--------';
}

export function formatAllowedModules(modules: string[]): string {
  if (!modules.length) {
    return 'View only';
  }
  const labels = modules.map((module) => MODULE_LABELS[module] ?? module);
  if (labels.length === 1) {
    return `${labels[0]} only`;
  }
  if (labels.length === 2) {
    return `${labels[0]} & ${labels[1]}`;
  }
  return `${labels.slice(0, -1).join(', ')} & ${labels[labels.length - 1]}`;
}

export function buildFamilyMembersList(
  owner: ApiUser,
  members: PetMemberRow[],
): FamilyMemberDisplay[] {
  const ownerRow: FamilyMemberDisplay = {
    id: owner._id,
    name: owner.fullName?.trim() || owner.email.split('@')[0] || 'Owner',
    subtitle: 'ADMIN 👑',
    isAdmin: true,
    avatarColor: AVATAR_COLORS[0],
  };

  const memberRows = members.map((member, index) => {
    const user = member.userId;
    const name = user.fullName?.trim() || user.email?.split('@')[0] || 'Member';
    const subtitle =
      member.accessLevel === 'admin'
        ? 'ADMIN 👑'
        : formatAllowedModules(member.allowedModules ?? []);

    return {
      id: user._id,
      name,
      subtitle,
      isAdmin: member.accessLevel === 'admin',
      avatarColor: AVATAR_COLORS[(index + 1) % AVATAR_COLORS.length],
    };
  });

  return [ownerRow, ...memberRows];
}

export function buildGuestMemberDisplay(
  user: ApiUser,
  allowedModules: string[],
  accessLevel: string,
): FamilyMemberDisplay {
  const subtitle =
    accessLevel === 'admin' ? 'ADMIN 👑' : formatAllowedModules(allowedModules);

  return {
    id: user._id,
    name: user.fullName?.trim() || user.email.split('@')[0] || 'Member',
    subtitle,
    isAdmin: accessLevel === 'admin',
    avatarColor: AVATAR_COLORS[1],
  };
}

export function isPetOwner(petOwnerId: string | null | undefined, userId: string | undefined): boolean {
  if (!petOwnerId || !userId) return false;
  return String(petOwnerId) === String(userId);
}

export function buildFamilyHubMembersList(
  members: FamilyHubMemberRow[],
  currentUserId?: string,
): FamilyMemberDisplay[] {
  return members.map((member, index) => {
    const user = member.userId;
    const name = user.fullName?.trim() || user.email?.split('@')[0] || 'Member';
    const isAdmin = member.role === 'admin';
    const isSelf = currentUserId === user._id;

    return {
      id: user._id,
      name: isSelf ? `${name} (You)` : name,
      subtitle: isAdmin ? 'ADMIN 👑' : 'Family member',
      isAdmin,
      avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
      email: user.email,
    };
  });
}

export function resolveFamilyIdFromPets(pets: ApiPet[], activePetId?: string | null): string | null {
  if (activePetId) {
    const active = pets.find((pet) => pet._id === activePetId);
    if (active?.familyId) return active.familyId;
  }
  const familyPet = pets.find((pet) => pet.familyId);
  return familyPet?.familyId ?? null;
}

export function petsInFamily(pets: ApiPet[], familyId: string | null | undefined): ApiPet[] {
  if (!familyId) return [];
  return pets.filter((pet) => pet.familyId === familyId);
}

export function isFamilyAdmin(
  members: FamilyHubMemberRow[],
  userId: string | undefined,
): boolean {
  if (!userId) return false;
  return members.some((member) => member.userId._id === userId && member.role === 'admin');
}
