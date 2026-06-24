import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Palette, Spacing } from '@/constants/theme';
import { SkeletonPetSwitcherList } from '@/components/ui/skeletons';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import type { ApiPet } from '@/types/pet';
import { Image } from 'expo-image';

import { useQueryClient } from '@tanstack/react-query';
import { prefetchDashboardData } from '@/lib/query/prefetchQueries';
import { useAuth } from '@/hooks/useAuth';

interface PetSwitcherSheetProps {
  visible: boolean;
  pets: ApiPet[];
  activePetId?: string | null;
  currentUserId?: string | null;
  loading?: boolean;
  switchingId?: string | null;
  onClose: () => void;
  onSelectPet: (petId: string) => void;
  onAddPet?: () => void;
}

export function PetSwitcherSheet({
  visible,
  pets,
  activePetId,
  currentUserId,
  loading,
  switchingId,
  onClose,
  onSelectPet,
  onAddPet,
}: PetSwitcherSheetProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { token } = useAuth();

  React.useEffect(() => {
    if (visible && token && pets.length) {
      pets.forEach((p) => {
        if (p._id !== activePetId) {
          void prefetchDashboardData(queryClient, token, p._id, p.image);
        }
      });
    }
  }, [visible, token, pets, activePetId, queryClient]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <AppText variant="h3" weight="800" color="#1A2B4E">
                Switch Profile
              </AppText>
              <AppText variant="caption" color={Palette.gray[500]} style={styles.subtitle}>
                Choose a pet to manage their schedule
              </AppText>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#1A2B4E" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <SkeletonPetSwitcherList count={3} />
          ) : (
            <>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
                {pets.map((pet) => {
                  const active = pet._id === activePetId;
                  const busy = switchingId === pet._id;
                  return (
                    <TouchableOpacity
                      key={pet._id}
                      style={[styles.row, active && styles.rowActive]}
                      onPress={() => onSelectPet(pet._id)}
                      disabled={busy || active}
                    >
                      <Image
                        source={
                          pet.image
                            ? { uri: resolveMediaUrl(pet.image) }
                            : require('../../assets/images/onboarding.png')
                        }
                        style={styles.avatar}
                      />
                      <View style={styles.info}>
                        <AppText variant="body" weight="700" color="#1A2B4E">
                          {pet.name}
                        </AppText>
                        <AppText variant="caption" color={Palette.gray[500]}>
                          {pet.ownerUserId && currentUserId && pet.ownerUserId !== currentUserId
                            ? 'Shared with you'
                            : pet.breed || pet.species || 'Pet'}
                        </AppText>
                      </View>
                      {busy ? (
                        <ActivityIndicator size="small" color="#5CB35D" />
                      ) : active ? (
                        <Ionicons name="checkmark-circle" size={24} color="#5CB35D" />
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color={Palette.gray[400]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.actionBlock}>
                {onAddPet ? (
                  <TouchableOpacity style={styles.addBtn} onPress={onAddPet}>
                    <Ionicons name="add" size={22} color={Palette.white} />
                    <AppText variant="body" weight="800" color={Palette.white}>
                      Add Another Pet
                    </AppText>
                  </TouchableOpacity>
                ) : null}
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 43, 78, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F1F7F1',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    maxHeight: '80%',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E5E5',
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 2,
  },
  list: {
    maxHeight: 250,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.sm,
    borderRadius: 14,
    marginBottom: Spacing.sm,
    backgroundColor: '#FCFCFD',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
  },
  rowActive: {
    backgroundColor: 'rgba(92, 179, 93, 0.08)',
    borderColor: '#5CB35D',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: Spacing.sm,
  },
  info: {
    flex: 1,
  },
  actionBlock: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#5CB35D',
    shadowColor: '#5CB35D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
});
