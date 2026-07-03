import { useAppSelector } from '@/redux/store';
import { selectActivePetId } from '@/redux/reducer';

export function usePetContext() {
  const activePetId = useAppSelector(selectActivePetId);
  return {
    activePetId,
  };
}
