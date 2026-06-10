import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type {
  ApiFamily,
  CreateFamilyRequest,
  EmailFamilyInviteRequest,
  EmailFamilyInviteResponse,
  FamilyHubMemberRow,
  UpdateFamilyMemberPermissionsRequest,
} from '@/types/family';

const SCOPE = 'FamilyHubAPI';

export async function createFamily(token: string, payload: CreateFamilyRequest): Promise<ApiFamily> {
  log.info(SCOPE, 'POST /families', { name: payload.name });
  try {
    const data = await apiRequest<ApiFamily>(API_ENDPOINTS.family.create, {
      method: 'POST',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Family created', { familyId: data._id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Create family failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchFamilyMembers(
  token: string,
  familyId: string,
): Promise<FamilyHubMemberRow[]> {
  log.info(SCOPE, 'GET /families/:id/members', { familyId });
  try {
    const data = await apiRequest<FamilyHubMemberRow[]>(API_ENDPOINTS.family.members(familyId), {
      token,
    });
    log.ok(SCOPE, 'Family members loaded', { count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Load family members failed', getErrorMessage(error));
    throw error;
  }
}

export async function inviteFamilyMemberByEmail(
  token: string,
  familyId: string,
  payload: EmailFamilyInviteRequest,
): Promise<EmailFamilyInviteResponse> {
  log.info(SCOPE, 'POST /families/:id/invite', { familyId, email: payload.inviteeEmail });
  try {
    const data = await apiRequest<EmailFamilyInviteResponse>(API_ENDPOINTS.family.invite(familyId), {
      method: 'POST',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Email invite sent', { invitationId: data.invitationId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Email invite failed', getErrorMessage(error));
    throw error;
  }
}

export async function removeFamilyMember(
  token: string,
  familyId: string,
  userId: string,
): Promise<{ message: string }> {
  log.info(SCOPE, 'DELETE /families/:id/members/:userId', { familyId, userId });
  try {
    const data = await apiRequest<{ message: string }>(
      API_ENDPOINTS.family.removeMember(familyId, userId),
      { method: 'DELETE', token },
    );
    log.ok(SCOPE, 'Family member removed', { userId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Remove family member failed', getErrorMessage(error));
    throw error;
  }
}

export async function updateFamilyMemberPermissions(
  token: string,
  familyId: string,
  userId: string,
  payload: UpdateFamilyMemberPermissionsRequest,
): Promise<{ message: string }> {
  log.info(SCOPE, 'PUT /families/:id/members/:userId/permissions', { familyId, userId });
  try {
    const data = await apiRequest<{ message: string }>(
      API_ENDPOINTS.family.updateMemberPermissions(familyId, userId),
      { method: 'PUT', token, body: payload },
    );
    log.ok(SCOPE, 'Family permissions updated', { userId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Update family permissions failed', getErrorMessage(error));
    throw error;
  }
}

export async function revokeFamilyPetAccess(
  token: string,
  familyId: string,
  userId: string,
  petId: string,
): Promise<{ message: string }> {
  log.info(SCOPE, 'DELETE /families/:id/members/:userId/permissions/:petId', {
    familyId,
    userId,
    petId,
  });
  try {
    const data = await apiRequest<{ message: string }>(
      API_ENDPOINTS.family.revokePetAccess(familyId, userId, petId),
      { method: 'DELETE', token },
    );
    log.ok(SCOPE, 'Pet access revoked', { userId, petId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Revoke pet access failed', getErrorMessage(error));
    throw error;
  }
}

export async function deleteFamily(
  token: string,
  familyId: string,
): Promise<{ message: string }> {
  log.info(SCOPE, 'DELETE /families/:id', { familyId });
  try {
    const data = await apiRequest<{ message: string }>(API_ENDPOINTS.family.byId(familyId), {
      method: 'DELETE',
      token,
    });
    log.ok(SCOPE, 'Family deleted', { familyId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Delete family failed', getErrorMessage(error));
    throw error;
  }
}
