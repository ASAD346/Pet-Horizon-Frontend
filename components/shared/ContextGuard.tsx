import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { usePetContext } from '@/hooks/usePetContext';
import { AppText } from '@/components/ui/AppText';

interface ContextGuardProps {
  children: React.ReactNode;
}

export function ContextGuard({ children }: ContextGuardProps) {
  const { activePetId } = usePetContext();
  const queryClient = useQueryClient();
  const prevPetIdRef = useRef<string | null>(activePetId);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (activePetId && prevPetIdRef.current !== activePetId) {
      setResetting(true);
      queryClient.resetQueries()
        .then(() => {
          prevPetIdRef.current = activePetId;
        })
        .finally(() => {
          setResetting(false);
        });
    }
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
