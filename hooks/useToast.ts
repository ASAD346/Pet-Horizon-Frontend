import { useCallback } from 'react';
import { showToast } from '@/redux/action';
import { useAppDispatch } from '@/redux/store';

export function useToast() {
  const dispatch = useAppDispatch();

  return {
    showToast: useCallback((message: string) => dispatch(showToast(message)), [dispatch]),
  };
}
