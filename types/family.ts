export interface PetMemberUser {
  _id: string;
  fullName?: string;
  email?: string;
  profileImage?: string | null;
}

export interface PetMemberRow {
  userId: PetMemberUser;
  accessLevel: 'admin' | 'edit' | 'readonly' | string;
  allowedModules: string[];
  permissions?: {
    feeding?: boolean;
    walks?: boolean;
    medicine?: boolean;
    grooming?: boolean;
    vaccination?: boolean;
    journal?: boolean;
    expenses?: boolean;
  };
  grantedAt?: string;
}

export interface GenerateInviteRequest {
  petId: string;
  accessLevel?: 'admin' | 'edit' | 'readonly';
  allowedModules?: string[];
}

export interface GenerateInviteResponse {
  inviteToken: string;
  inviteLink: string;
  deepLink: string;
  qrCodeDataUrl: string;
  shareText: string;
  petName: string;
  petPhoto?: string | null;
  permissions: {
    accessLevel: string;
    allowedModules: string[];
  };
  expiresAt: string;
}

export interface InviteInfoResponse {
  valid: boolean;
  token: string;
  inviteType: string;
  inviterName?: string | null;
  inviterPhoto?: string | null;
  invitedBy?: string | null;
  creatorId?: string | null;
  pet?: {
    petId: string;
    name: string;
    species?: string;
    photoUrl?: string | null;
  } | null;
  expiresAt: string;
  userRegistered?: boolean;
  permissions?: {
    accessLevel?: string;
    allowedModules?: string[];
  };
  deepLink?: string;
  universalLink?: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
}

export interface UpdateMemberPermissionsRequest {
  accessLevel?: 'admin' | 'edit' | 'readonly';
  allowedModules?: string[];
}

export interface FamilyMemberDisplay {
  id: string;
  name: string;
  subtitle: string;
  isAdmin: boolean;
  avatarColor: string;
  hostBadge?: string;
  profilePicture?: string;
  allowedModules?: string[];
}
