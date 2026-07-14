import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { bootstrapAuth } from '@/redux/action';
import { selectAuthToken, selectIsBootstrapping } from '@/redux/reducer';
import { useQueryClient } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useTimezone } from '@/hooks/useTimezone';
import { runServerConnectionTest } from '@/lib/api/connectionTest';

export function AuthBootstrap() {
  useTimezone();
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);
  const isBootstrapping = useAppSelector(selectIsBootstrapping);
  const queryClient = useQueryClient();
  const hasBootstrapped = useRef(false);
  const prevTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;
    dispatch(bootstrapAuth());
    void runServerConnectionTest();
  }, [dispatch]);

  const hasHiddenSplash = useRef(false);

  useEffect(() => {
    if (!isBootstrapping && !hasHiddenSplash.current) {
      hasHiddenSplash.current = true;
      void SplashScreen.hideAsync();
    }
  }, [isBootstrapping]);

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

