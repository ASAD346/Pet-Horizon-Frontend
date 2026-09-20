import { useAppSelector } from '@/redux/store';
import { selectActivePetId, selectActivePet } from '@/redux/reducer';

export function usePetContext() {
  const activePetId = useAppSelector(selectActivePetId);
  const activePet = useAppSelector(selectActivePet);
  return {
    activePetId,
    activePet,
  };
}

