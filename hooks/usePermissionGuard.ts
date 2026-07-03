import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';
import { usePetPermissions } from '@/hooks/usePetPermissions';
import { normalizeModuleId } from '@/lib/pet/petPermissionAccess';

export function usePermissionGuard(petId: string | null | undefined, moduleId: string) {
  const { token, user } = useAuth();
  const { pet } = useActivePet(token);
  
  // If a specific petId is provided, construct a minimal pet object for permissions
  const targetPet = petId ? { _id: petId, ownerUserId: pet?.ownerUserId, species: pet?.species } : pet;

  const access = usePetPermissions(token, targetPet as any, user?._id);

  const normalized = normalizeModuleId(moduleId);
  const canEdit = normalized ? access.canEdit(normalized) : false;
  const canView = normalized ? access.canView(normalized) : false;

  return {
    canEdit,
    canView,
    loading: access.loading,
    isOwner: access.isOwner,
    isReadOnly: access.isReadOnly,
  };
}
