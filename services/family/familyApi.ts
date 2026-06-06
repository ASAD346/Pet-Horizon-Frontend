import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type {
  GenerateInviteRequest,
  GenerateInviteResponse,
  InviteInfoResponse,
  PetMemberRow,
  UpdateMemberPermissionsRequest,
} from '@/types/family';

const SCOPE = 'FamilyAPI';

export async function fetchPetMembers(token: string, petId: string): Promise<PetMemberRow[]> {
  log.info(SCOPE, 'GET /pets/:petId/members', { petId });
  try {
    const data = await apiRequest<PetMemberRow[]>(API_ENDPOINTS.family.membersByPet(petId), { token });
    log.ok(SCOPE, 'Pet members loaded', { petId, count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Pet members failed', { petId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function generatePetInvite(
  token: string,
  payload: GenerateInviteRequest,
): Promise<GenerateInviteResponse> {
  log.info(SCOPE, 'POST /invitations/generate', { petId: payload.petId });
  try {
    const data = await apiRequest<GenerateInviteResponse>(API_ENDPOINTS.invitations.generate, {
      method: 'POST',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Invite generated', { petId: payload.petId, expiresAt: data.expiresAt });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Generate invite failed', { petId: payload.petId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function acceptPetInvite(token: string, inviteToken: string): Promise<{ message: string; petId?: string }> {
  log.info(SCOPE, 'POST /invitations/accept');
  try {
    const data = await apiRequest<{ message: string; petId?: string }>(API_ENDPOINTS.invitations.accept, {
      method: 'POST',
      token,
      body: { token: inviteToken },
    });
    log.ok(SCOPE, 'Invite accepted');
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Accept invite failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchInviteInfo(inviteToken: string): Promise<InviteInfoResponse> {
  log.info(SCOPE, 'GET /invitations/info/:token');
  try {
    const data = await apiRequest<InviteInfoResponse>(API_ENDPOINTS.invitations.info(inviteToken));
    log.ok(SCOPE, 'Invite info loaded');
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Invite info failed', getErrorMessage(error));
    throw error;
  }
}

export async function removePetMember(
  token: string,
  petId: string,
  userId: string,
): Promise<{ message: string }> {
  log.info(SCOPE, 'DELETE /pets/:petId/members/:userId', { petId, userId });
  try {
    const data = await apiRequest<{ message: string }>(
      API_ENDPOINTS.family.removeMemberByPet(petId, userId),
      { method: 'DELETE', token },
    );
    log.ok(SCOPE, 'Member removed', { userId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Remove member failed', getErrorMessage(error));
    throw error;
  }
}

export async function updatePetMemberPermissions(
  token: string,
  petId: string,
  userId: string,
  payload: UpdateMemberPermissionsRequest,
): Promise<{ message: string; accessLevel: string; allowedModules: string[] }> {
  log.info(SCOPE, 'PUT /pets/:petId/members/:userId/permissions', { petId, userId });
  try {
    const data = await apiRequest<{ message: string; accessLevel: string; allowedModules: string[] }>(
      API_ENDPOINTS.family.updateMemberPermissionsByPet(petId, userId),
      { method: 'PUT', token, body: payload },
    );
    log.ok(SCOPE, 'Permissions updated', { userId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Update permissions failed', getErrorMessage(error));
    throw error;
  }
}
