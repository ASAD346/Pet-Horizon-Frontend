import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';
import { usePetPermissions } from '@/hooks/usePetPermissions';
import { normalizeModuleId } from '@/lib/pet/petPermissionAccess';

export function usePermissionGuard(
  petId: string | null | undefined,
  moduleId: string,
  petOwnerId?: string | null
) {
  const { token, user } = useAuth();
  const { pet } = useActivePet(token);
  
  // If a specific petId is provided, construct a minimal pet object for permissions
  const targetPet = petId
    ? { _id: petId, ownerUserId: petOwnerId || pet?.ownerUserId, species: pet?.species }
    : pet;

  const currentUserId = user?._id;
  const resolvedOwnerUserId = petOwnerId || targetPet?.ownerUserId;
  const isOwner = Boolean(resolvedOwnerUserId && currentUserId && resolvedOwnerUserId === currentUserId);

  const access = usePetPermissions(token, targetPet as any, currentUserId);

  const normalized = normalizeModuleId(moduleId);
  const canEdit = isOwner ? true : (normalized ? access.canEdit(normalized) : false);
  const canView = isOwner ? true : (normalized ? access.canView(normalized) : false);

  return {
    canEdit,
    canView,
    loading: isOwner ? false : access.loading,
    isOwner: isOwner || access.isOwner,
    isReadOnly: isOwner ? false : access.isReadOnly,
  };
}
