import { useCallback } from 'react';
import { showToastAction } from '@/redux/action';
import { useAppDispatch } from '@/redux/store';

export function useToast() {
  const dispatch = useAppDispatch();

  return {
    showToast: useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => dispatch(showToastAction(message, type)), [dispatch]),
    showSuccessToast: useCallback((message: string) => dispatch(showToastAction(message, 'success')), [dispatch]),
    showErrorToast: useCallback((message: string) => dispatch(showToastAction(message, 'error')), [dispatch]),
  };
}
