import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { usePetContext } from '@/hooks/usePetContext';
import { useAuth } from '@/hooks/useAuth';
import { getPetListCache } from '@/lib/pet/petListCache';
import { AppText } from '@/components/ui/AppText';
import { clearPetPermissionCache } from '@/lib/pet/petPermissionCache';

interface ContextGuardProps {
  children: React.ReactNode;
}

export function ContextGuard({ children }: ContextGuardProps) {
  const { activePetId } = usePetContext();
  const queryClient = useQueryClient();
  const { token, user } = useAuth();

  const scopeKey = token && user?._id ? `${token}:${user._id}` : token;
  const cachedPets = getPetListCache(scopeKey);
  const targetPet = cachedPets?.find((p: any) => p._id === activePetId);
  const petName = targetPet?.name || 'your pet';

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

    // STRICT ISOLATION: Clear the query cache immediately to prevent old pet's data from leaking
    queryClient.clear();

    const timer = setTimeout(() => {
      setResetting(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [activePetId, queryClient]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {resetting && (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#184F2E" />
          <AppText variant="bodySmall" weight="800" color="#184F2E" style={styles.text}>
            Loading {petName}'s workspace...
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F1F7F1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 9999,
  },
  text: {
    marginTop: 8,
  },
});
