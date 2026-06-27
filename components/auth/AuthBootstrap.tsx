import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { bootstrapAuth } from '@/redux/action';
import { selectAuthToken } from '@/redux/reducer';
import { useQueryClient } from '@tanstack/react-query';

export function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);
  const queryClient = useQueryClient();
  const hasBootstrapped = useRef(false);
  const prevTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;
    dispatch(bootstrapAuth());
  }, [dispatch]);

  useEffect(() => {
    if (prevTokenRef.current !== token) {
      if (prevTokenRef.current !== null || token !== null) {
        queryClient.clear();
      }
      prevTokenRef.current = token;
    }
  }, [token, queryClient]);

  return null;
}

