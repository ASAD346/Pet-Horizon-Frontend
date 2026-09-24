import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useQueryClient } from '@tanstack/react-query';
import { type Href } from 'expo-router';

import { AppText } from '@/components/ui/AppText';
import { CustomButton } from '@/components/ui/AppButton';
import { AppConfirmModal } from '@/components/ui/AppConfirmModal';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { ProfileTheme } from '@/components/profile/profileTheme';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useDebouncedRouter } from '@/hooks/useDebounce';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api/errors';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { activatePetSession } from '@/lib/pet/activatePetSession';
import { clearActivePetCache } from '@/lib/pet/activePetCache';
import { calculatePetAge } from '@/lib/pet/birthdayUtils';
import { fetchAccessiblePets } from '@/lib/pet/fetchAccessiblePets';
import { clearPetListCache } from '@/lib/pet/petListCache';
import { canAddAnotherPet } from '@/lib/premium/canAddPet';
import { deletePet } from '@/services/pets/petApi';
import { getSpeciesIcon } from '@/services/pets/speciesIcons';
import type { ApiPet } from '@/types/pet';
import { isPetOwner } from '@/lib/family/formatters';

export default function ManagePetsScreen() {
  const router = useDebouncedRouter();
  const { token, user, setSession } = useAuth();
  const { isPremium } = usePremiumStatus();
  const { showSuccessToast, showErrorToast, showToast } = useToast();
  const queryClient = useQueryClient();

  const [pets, setPets] = useState<ApiPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  // Modals state
  const [deleteTargetPet, setDeleteTargetPet] = useState<ApiPet | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [premiumPromptVisible, setPremiumPromptVisible] = useState(false);

  const activePetId = user?.activePetId ?? null;

  const loadPets = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchAccessiblePets(token, user?._id);
      setPets(data);
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, user?._id, showErrorToast]);

  useEffect(() => {
    void loadPets();
  }, [loadPets]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPets();
    setRefreshing(false);
  }, [loadPets]);

  const handleAddPet = useCallback(() => {
    const allowed = canAddAnotherPet(pets.length, isPremium);
    if (!allowed) {
      setPremiumPromptVisible(true);
      return;
    }
    router.navigate({ pathname: '/pet/register', params: { mode: 'add' } } as any);
  }, [pets.length, isPremium, router]);

  const handleSelectActive = useCallback(
    async (pet: ApiPet) => {
      if (!token || pet._id === activePetId || switchingId) return;
      setSwitchingId(pet._id);
      try {
        await activatePetSession({
          token,
          petId: pet._id,
          user: user ?? null,
          setSession,
          nextPet: pet,
        });
        showSuccessToast(`${pet.name} is now your active pet!`);
        void queryClient.invalidateQueries();
      } catch (err) {
        showErrorToast(getErrorMessage(err));
      } finally {
        setSwitchingId(null);
      }
    },
    [token, activePetId, switchingId, user, setSession, showSuccessToast, showErrorToast, queryClient],
  );

  const handleEditPet = useCallback(
    (pet: ApiPet) => {
      router.navigate({
        pathname: '/pet/register',
        params: { mode: 'edit', petId: pet._id },
      } as any);
    },
    [router],
  );

  const handleDeletePress = useCallback((pet: ApiPet) => {
    setDeleteTargetPet(pet);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!token || !deleteTargetPet) return;
    setDeleting(true);
    try {
      await deletePet(token, deleteTargetPet._id);
      showSuccessToast(`${deleteTargetPet.name} was removed.`);

      const remainingPets = pets.filter((p) => p._id !== deleteTargetPet._id);
      setPets(remainingPets);

      clearPetListCache();

      // If active pet was deleted, switch to the first remaining pet if available
      if (deleteTargetPet._id === activePetId) {
        if (remainingPets.length > 0) {
          const fallback = remainingPets[0];
          await activatePetSession({
            token,
            petId: fallback._id,
            user: user ?? null,
            setSession,
            nextPet: fallback,
          });
        } else {
          clearActivePetCache();
          if (user) {
            await setSession({ token, user: { ...user, activePetId: undefined } });
          }
        }
      }

      void queryClient.invalidateQueries();
      setDeleteTargetPet(null);
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }, [token, deleteTargetPet, pets, activePetId, user, setSession, queryClient, showSuccessToast, showErrorToast]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ProfileScreenHeader
        title="Manage Pets"
        onBack={() => router.back()}
        rightLabel="+ Add"
        onRightPress={handleAddPet}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={ProfileTheme.green}
          />
        }
      >
        {/* Top Banner / Add Pet Quick Action */}
        <View style={styles.actionCard}>
          <View style={styles.actionCardLeft}>
            <View style={styles.actionIconCircle}>
              <Ionicons name="paw" size={22} color="#2E7D32" />
            </View>
            <View style={styles.actionTextCol}>
              <AppText variant="body" weight="800" color="#0E3821">
                Add Another Pet
              </AppText>
              <AppText variant="caption" color="#556B5D" style={styles.actionSubtitle}>
                {isPremium
                  ? 'Unlimited pet profiles with Premium'
                  : pets.length > 0
                    ? 'Upgrade to Premium for multiple pets'
                    : 'Track meals, health, expenses & schedules'}
              </AppText>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleAddPet}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <AppText variant="bodySmall" weight="800" color="#FFFFFF">
              Add
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Pet List Section */}
        <View style={styles.sectionHeader}>
          <AppText variant="caption" weight="800" color="#64748B" style={styles.sectionTitle}>
            REGISTERED PETS ({pets.length})
          </AppText>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ProfileTheme.green} />
            <AppText variant="bodySmall" color="#64748B" style={{ marginTop: Spacing.sm }}>
              Loading your pets...
            </AppText>
          </View>
        ) : pets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="paw-outline" size={42} color="#94A3B8" />
            </View>
            <AppText variant="h3" weight="800" color="#1A2B4E" style={styles.emptyTitle}>
              No Pets Found
            </AppText>
            <AppText variant="bodySmall" color="#64748B" style={styles.emptyText}>
              You haven’t registered any pets yet. Add your companion to get started with full health, schedule, and expense tracking!
            </AppText>
            <CustomButton
              title="Add Your First Pet"
              onPress={handleAddPet}
              style={styles.emptyBtn}
            />
          </View>
        ) : (
          <View style={styles.petsList}>
            {pets.map((pet) => {
              const isActive = pet._id === activePetId;
              const isBusy = switchingId === pet._id;
              const isOwner = isPetOwner(pet.ownerUserId, user?._id);
              const age = calculatePetAge(pet.birthday);
              const speciesIcon = getSpeciesIcon(pet.species ?? 'other');

              return (
                <View
                  key={pet._id}
                  style={[styles.petCard, isActive && styles.petCardActive]}
                >
                  {/* Active Indicator Top-Right */}
                  {isActive && (
                    <View style={styles.activePill}>
                      <Ionicons name="checkmark-circle" size={13} color="#2E7D32" />
                      <AppText variant="caption" weight="800" color="#2E7D32" style={styles.activePillText}>
                        ACTIVE PET
                      </AppText>
                    </View>
                  )}

                  <View style={styles.petCardMain}>
                    {/* Pet Avatar */}
                    {pet.image ? (
                      <Image
                        source={{ uri: resolveMediaUrl(pet.image) }}
                        style={styles.petAvatar}
                        contentFit="cover"
                        cachePolicy="disk"
                      />
                    ) : (
                      <View style={styles.petAvatarFallback}>
                        <MaterialCommunityIcons name={speciesIcon} size={28} color="#2E7D32" />
                      </View>
                    )}

                    {/* Pet Info */}
                    <View style={styles.petDetails}>
                      <View style={styles.petNameRow}>
                        <AppText variant="body" weight="800" color="#0E3821" numberOfLines={1} style={styles.petName}>
                          {pet.name}
                        </AppText>
                        {!isOwner && (
                          <View style={styles.sharedBadge}>
                            <Ionicons name="people" size={10} color="#0284C7" />
                            <AppText variant="caption" weight="700" color="#0284C7" style={styles.sharedText}>
                              Shared
                            </AppText>
                          </View>
                        )}
                      </View>

                      <AppText variant="bodySmall" color="#475569" numberOfLines={1} style={styles.breedText}>
                        {pet.breed || pet.species || 'Pet'}
                        {pet.gender ? ` • ${pet.gender}` : ''}
                      </AppText>

                      {/* Badges / Chips */}
                      <View style={styles.chipsRow}>
                        {age !== 'Not set' && (
                          <View style={styles.chip}>
                            <Ionicons name="calendar-outline" size={11} color="#64748B" />
                            <AppText variant="caption" weight="600" color="#64748B" style={styles.chipText}>
                              {age}
                            </AppText>
                          </View>
                        )}
                        {pet.weight != null && (
                          <View style={styles.chip}>
                            <MaterialCommunityIcons name="scale-bathroom" size={11} color="#64748B" />
                            <AppText variant="caption" weight="600" color="#64748B" style={styles.chipText}>
                              {pet.weight} {pet.weightUnit || 'kg'}
                            </AppText>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Card Actions Footer */}
                  <View style={styles.cardActionsRow}>
                    {/* Switch / Active Status Button */}
                    <TouchableOpacity
                      style={[
                        styles.actionPillBtn,
                        isActive ? styles.actionPillBtnActive : styles.actionPillBtnInactive,
                      ]}
                      onPress={() => handleSelectActive(pet)}
                      disabled={isActive || isBusy}
                      activeOpacity={0.7}
                    >
                      {isBusy ? (
                        <ActivityIndicator size="small" color="#2E7D32" />
                      ) : isActive ? (
                        <>
                          <Ionicons name="shield-checkmark" size={14} color="#2E7D32" />
                          <AppText variant="caption" weight="800" color="#2E7D32">
                            Current Active
                          </AppText>
                        </>
                      ) : (
                        <>
                          <Ionicons name="swap-horizontal" size={14} color="#475569" />
                          <AppText variant="caption" weight="700" color="#334155">
                            Set as Active
                          </AppText>
                        </>
                      )}
                    </TouchableOpacity>

                    {/* Secondary Actions: Edit & Delete */}
                    <View style={styles.rightActionsGroup}>
                      <TouchableOpacity
                        style={styles.iconActionBtn}
                        onPress={() => handleEditPet(pet)}
                        hitSlop={8}
                        accessibilityLabel="Edit Pet"
                      >
                        <Ionicons name="create-outline" size={18} color="#2E7D32" />
                        <AppText variant="caption" weight="700" color="#2E7D32" style={{ marginLeft: 4 }}>
                          Edit
                        </AppText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.iconActionBtn, styles.deleteActionBtn]}
                        onPress={() => handleDeletePress(pet)}
                        hitSlop={8}
                        accessibilityLabel="Delete Pet"
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <AppConfirmModal
        visible={Boolean(deleteTargetPet)}
        title={`Delete ${deleteTargetPet?.name || 'Pet'}?`}
        message={`Are you sure you want to delete ${deleteTargetPet?.name || 'this pet'}? All schedules, expenses, health logs, and journals associated with this pet will be permanently removed.`}
        confirmLabel="Delete Pet"
        cancelLabel="Keep Pet"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetPet(null)}
      />

      {/* Premium Upgrade Modal */}
      <AppConfirmModal
        visible={premiumPromptVisible}
        title="Upgrade to Premium"
        message="Free accounts can register 1 pet profile. Upgrade to PetHorizon Premium for unlimited pets, advanced insights, and family collaboration!"
        confirmLabel="View Plans"
        cancelLabel="Maybe Later"
        variant="warning"
        onConfirm={() => {
          setPremiumPromptVisible(false);
          router.navigate('/profile/premium' as Href);
        }}
        onCancel={() => setPremiumPromptVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ProfileTheme.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
    paddingTop: Spacing.xs,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    marginBottom: Spacing.lg,
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  actionTextCol: {
    flex: 1,
  },
  actionSubtitle: {
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    gap: 4,
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    letterSpacing: 0.8,
  },
  loadingContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    marginBottom: Spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  emptyBtn: {
    width: '100%',
  },
  petsList: {
    gap: Spacing.md,
  },
  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2EBE2',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#0E3821',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  petCardActive: {
    borderColor: '#5CB35D',
    borderWidth: 1.5,
    backgroundColor: '#FAFCFA',
  },
  activePill: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  activePillText: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  petCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.xs,
  },
  petAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2EBE2',
  },
  petAvatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
  },
  petDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  petNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingRight: 60, // Avoid overlapping the active pill
  },
  petName: {
    fontSize: 17,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  sharedText: {
    fontSize: 9,
  },
  breedText: {
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  chipText: {
    fontSize: 11,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  actionPillBtnActive: {
    backgroundColor: '#E8F5E9',
  },
  actionPillBtnInactive: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rightActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  deleteActionBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    paddingHorizontal: 8,
  },
});
