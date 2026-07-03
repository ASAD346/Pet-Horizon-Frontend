import type { ApiUser } from '@/types/auth';
import type { FamilyMemberDisplay, PetMemberRow } from '@/types/family';

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

const AVATAR_COLORS = ['#2E7D32', '#5CB35D', '#5B9BD5', '#E91E8C', '#673AB7', '#4DB6AC'];

export function formatJoinCode(token: string): string {
  const clean = token.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length >= 6) {
    return `PAW-${clean.slice(0, 3)}-${clean.slice(3, 6)}`;
  }
  return clean.slice(0, 11) || '--------';
}

export function formatAllowedModules(modules: string[]): string {
  const cleanModules = modules
    .map((m) => m.toLowerCase().trim())
    .filter((m) => m !== 'journal' && m !== 'expenses' && m !== 'expense');
    
  const uniqueClean = [...new Set(cleanModules.map((m) => (m === 'walk' ? 'walks' : m === 'food' ? 'feeding' : m)))];

  if (!uniqueClean.length) {
    return 'Care Modules View-Only';
  }
  const labels = uniqueClean.map((module) => MODULE_LABELS[module] ?? module);
  if (labels.length === 1) {
    return `${labels[0]} only`;
  }
  if (labels.length === 2) {
    return `${labels[0]} & ${labels[1]}`;
  }
  return `${labels.slice(0, -1).join(', ')} & ${labels[labels.length - 1]}`;
}

export function mapModuleNameToLabel(module: string): string {
  return MODULE_LABELS[module.toLowerCase().trim()] ?? (module.charAt(0).toUpperCase() + module.slice(1));
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
    profilePicture: owner.profileImage ?? undefined,
    allowedModules: ['feeding', 'walks', 'medicine', 'grooming', 'vaccination', 'journal', 'expenses'],
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
      profilePicture: user.profileImage ?? undefined,
      allowedModules: member.allowedModules ?? [],
    };
  });

  return [ownerRow, ...memberRows];
}

export function buildGuestMemberDisplay(
  user: ApiUser,
  allowedModules: string[],
  accessLevel: string,
  hostName?: string | null,
): FamilyMemberDisplay {
  const subtitle =
    accessLevel === 'admin' ? 'ADMIN 👑' : formatAllowedModules(allowedModules);

  return {
    id: user._id,
    name: user.fullName?.trim() || user.email.split('@')[0] || 'Member',
    subtitle,
    isAdmin: accessLevel === 'admin',
    avatarColor: AVATAR_COLORS[1],
    hostBadge: hostName ? `Invited by ${hostName}` : 'Joined via Invitation',
    profilePicture: user.profileImage ?? undefined,
    allowedModules,
  };
}

export function isPetOwner(petOwnerId: string | null | undefined, userId: string | undefined): boolean {
  if (!petOwnerId || !userId) return false;
  return String(petOwnerId) === String(userId);
}
