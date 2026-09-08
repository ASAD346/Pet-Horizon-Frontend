import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { usePetContext } from '@/hooks/usePetContext';
import { clearPetPermissionCache } from '@/lib/pet/petPermissionCache';

interface ContextGuardProps {
  children: React.ReactNode;
}

export function ContextGuard({ children }: ContextGuardProps) {
  const { activePetId } = usePetContext();
  const queryClient = useQueryClient();

  // Use a sentinel so the *first* arrival of an activePetId doesn't trigger reconciliation.
  // Only an actual switch from one known pet ID to a different known pet ID should fire.
  const prevPetIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const prev = prevPetIdRef.current;

    // Skip on first mount (prev === undefined) or when the id hasn't changed.
    if (prev === undefined || !activePetId || prev === activePetId) {
      prevPetIdRef.current = activePetId;
      return;
    }

    // Actual pet switch detected — update the ref immediately (synchronously)
    prevPetIdRef.current = activePetId;

    clearPetPermissionCache();

    // Cancel active in-flight queries and invalidate pet-related queries gracefully
    // without wiping the entire QueryClient cache, preventing sudden layout collapse/flashing.
    void queryClient.cancelQueries();
    void queryClient.invalidateQueries({ queryKey: ['family-members'] });
    void queryClient.invalidateQueries({ queryKey: ['petMembers'] });
    void queryClient.invalidateQueries({ queryKey: ['schedules'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [activePetId, queryClient]);

  return <View style={{ flex: 1 }}>{children}</View>;
}

