import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { usePetContext } from '@/hooks/usePetContext';
import { AppText } from '@/components/ui/AppText';
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
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const prev = prevPetIdRef.current;

    // Skip on first mount (prev === undefined) or when the id hasn't changed.
    if (prev === undefined || !activePetId || prev === activePetId) {
      prevPetIdRef.current = activePetId;
      return;
    }

    // Actual pet switch detected — update the ref immediately (synchronously)
    // so that if this effect re-fires before the async work completes it won't re-enter.
    prevPetIdRef.current = activePetId;

    setResetting(true);
    clearPetPermissionCache();

    // Use invalidateQueries instead of resetQueries:
    //  - resetQueries aborts in-flight requests → causes "6000ms timeout exceeded" toasts
    //  - invalidateQueries marks data as stale and refetches when each query is next observed
    queryClient
      .invalidateQueries()
      .finally(() => {
        setResetting(false);
      });
  }, [activePetId, queryClient]);

  if (resetting) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3A8F3B" />
        <AppText variant="bodySmall" weight="700" color="#5C6470" style={styles.text}>
          Reconciling pet workspace context...
        </AppText>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F7F1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    marginTop: 8,
  },
});
