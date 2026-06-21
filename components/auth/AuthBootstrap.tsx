import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/redux/store';
import { bootstrapAuth } from '@/redux/action';

export function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;
    dispatch(bootstrapAuth());
  }, [dispatch]);

  return null;
}
