import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
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
import type { ApiPet } from '@/types/pet';
import { isPetOwner } from '@/lib/family/formatters';

interface PetCardItemProps {
  pet: ApiPet;
  index: number;
  isActive: boolean;
  isBusy: boolean;
  currentUserId?: string;
  onSelectActive: (pet: ApiPet) => void;
  onEdit: (pet: ApiPet) => void;
  onDelete: (pet: ApiPet) => void;
}

function PetCardItem({
  pet,
  index,
  isActive,
  isBusy,
  currentUserId,
  onSelectActive,
  onEdit,
  onDelete,
}: PetCardItemProps) {
  const [imageError, setImageError] = useState(false);
  const isOwner = isPetOwner(pet.ownerUserId, currentUserId);
  const age = calculatePetAge(pet.birthday);

  const rawImg = pet.image || (pet as any).photoUrl || (pet as any).imageUrl || (pet as any).avatar;
  const resolvedUri = resolveMediaUrl(rawImg);
  const showRealImage = Boolean(resolvedUri && !imageError);

  // Staggered Entrance Animation
  const animValue = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: 1,
      duration: 350,
      delay: Math.min(index * 70, 400),
      useNativeDriver: true,
    }).start();
  }, [animValue, index]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  return (
    <Animated.View
      style={[
        styles.petCardWrapper,
        {
          opacity: animValue,
          transform: [{ translateY }, { scale: scaleAnim }],
        },
      ]}
    >
      <View style={[styles.petCard, isActive && styles.petCardActive]}>
        {/* Active Pill Badge on Top Right */}
        {isActive && (
          <View style={styles.activePillBadge}>
            <View style={styles.activeDot} />
            <AppText variant="caption" weight="800" color="#1B5E20" style={styles.activePillText}>
              ACTIVE
            </AppText>
          </View>
        )}

        {/* Card Header & Content */}
        <TouchableOpacity
          style={styles.cardHeaderArea}
          onPress={() => onSelectActive(pet)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isActive || isBusy}
          activeOpacity={0.9}
        >
          {/* Circular Pet Avatar (Matching Home Screen Pet Profile Card) */}
          <View style={styles.avatarContainer}>
            {showRealImage ? (
              <Image
                source={{ uri: resolvedUri }}
                style={[
                  styles.avatar,
                  { borderColor: isActive ? '#2E7D32' : '#E2E8F0' },
                ]}
                contentFit="cover"
                cachePolicy="disk"
                transition={200}
                onError={() => setImageError(true)}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.placeholderAvatar,
                  { borderColor: isActive ? '#2E7D32' : '#A5D6A7' },
                ]}
              >
                <MaterialCommunityIcons name="paw" size={30} color="#FFFFFF" />
              </View>
            )}
          </View>

          {/* Pet Details */}
          <View style={styles.petDetailsCol}>
            <View style={styles.nameHeaderRow}>
              <AppText
                variant="h3"
                weight="800"
                color="#0E3821"
                numberOfLines={1}
                style={styles.petNameText}
              >
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

            <AppText variant="bodySmall" color="#475569" numberOfLines={1} style={styles.speciesBreedText}>
              {pet.species ? pet.species.charAt(0).toUpperCase() + pet.species.slice(1).toLowerCase() : 'Pet'}
              {pet.breed ? ` • ${pet.breed}` : ''}
            </AppText>

            {/* Info Chips */}
            <View style={styles.chipsContainer}>
              {pet.gender && (
                <View style={styles.chip}>
                  <MaterialCommunityIcons
                    name={
                      pet.gender.toLowerCase() === 'female'
                        ? 'gender-female'
                        : pet.gender.toLowerCase() === 'male'
                        ? 'gender-male'
                        : 'gender-male-female'
                    }
                    size={12}
                    color="#475569"
                  />
                  <AppText variant="caption" weight="600" color="#475569" style={styles.chipText}>
                    {pet.gender}
                  </AppText>
                </View>
              )}

              {age !== 'Not set' && (
                <View style={styles.chip}>
                  <Ionicons name="calendar-outline" size={11} color="#475569" />
                  <AppText variant="caption" weight="600" color="#475569" style={styles.chipText}>
                    {age}
                  </AppText>
                </View>
              )}

              {pet.weight != null && (
                <View style={styles.chip}>
                  <MaterialCommunityIcons name="scale-bathroom" size={11} color="#475569" />
                  <AppText variant="caption" weight="600" color="#475569" style={styles.chipText}>
                    {pet.weight} {pet.weightUnit || 'kg'}
                  </AppText>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Card Footer Actions */}
        <View style={styles.cardFooter}>
          {/* Left Action: Set as Active if not active */}
          <View style={styles.footerLeft}>
            {!isActive ? (
              <TouchableOpacity
                style={styles.setActiveBtn}
                onPress={() => onSelectActive(pet)}
                disabled={isBusy}
                activeOpacity={0.7}
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color="#2E7D32" />
                ) : (
                  <>
                    <Ionicons name="swap-horizontal" size={15} color="#2E7D32" />
                    <AppText variant="caption" weight="800" color="#2E7D32">
                      Set as Active
                    </AppText>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.activeStatusHint}>
                <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
                <AppText variant="caption" weight="700" color="#2E7D32">
                  Currently Selected
                </AppText>
              </View>
            )}
          </View>

          {/* Right Action: Edit & Delete Buttons with 8px radius */}
          <View style={styles.footerRight}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => onEdit(pet)}
              hitSlop={6}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={15} color="#1E293B" />
              <AppText variant="caption" weight="700" color="#1E293B" style={{ marginLeft: 4 }}>
                Edit
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => onDelete(pet)}
              hitSlop={6}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={15} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ManagePetsScreen() {
  const router = useDebouncedRouter();
  const { token, user, setSession } = useAuth();
  const { isPremium } = usePremiumStatus();
  const { showSuccessToast, showErrorToast } = useToast();
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
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.navigate({
        pathname: '/pet/register',
        params: { mode: 'edit', petId: pet._id },
      } as any);
    },
    [router],
  );

  const handleDeletePress = useCallback((pet: ApiPet) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      {/* Header */}
      <ProfileScreenHeader
        title="Manage Pets"
        onBack={() => router.back()}
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
        {/* Hero Banner: Register New Companion */}
        <LinearGradient
          colors={['#1B5E20', '#2E7D32', '#388E3C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Subtle Background Rings */}
          <View style={styles.heroRing1} />
          <View style={styles.heroRing2} />
          <MaterialCommunityIcons
            name="paw"
            size={76}
            color="rgba(255, 255, 255, 0.08)"
            style={styles.heroWatermark}
          />

          <View style={styles.heroContent}>
            <View style={styles.heroTextContainer}>
              <View style={styles.heroTag}>
                <AppText variant="caption" weight="800" color="#E8F5E9" style={styles.heroTagText}>
                  {isPremium ? 'PREMIUM UNLIMITED' : `${pets.length} OF 1 PET REGISTERED`}
                </AppText>
              </View>
              <AppText variant="h3" weight="800" color="#FFFFFF" style={styles.heroTitle}>
                Register New Pet
              </AppText>
              <AppText variant="caption" color="rgba(255, 255, 255, 0.82)" style={styles.heroSubtitle}>
                Add companions to track health logs, schedules & expenses.
              </AppText>
            </View>

            {/* Add Pet Button with tighter 8px radius */}
            <TouchableOpacity
              style={styles.heroAddBtn}
              onPress={handleAddPet}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color="#1B5E20" />
              <AppText variant="bodySmall" weight="800" color="#1B5E20">
                Add Pet
              </AppText>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <AppText variant="caption" weight="800" color="#475569" style={styles.sectionTitle}>
            YOUR PETS ({pets.length})
          </AppText>
          <AppText variant="caption" color="#64748B">
            Tap a pet to switch profile
          </AppText>
        </View>

        {/* Pet List */}
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
              <MaterialCommunityIcons name="paw" size={36} color="#5CB35D" />
            </View>
            <AppText variant="h3" weight="800" color="#0E3821" style={styles.emptyTitle}>
              No Pets Registered
            </AppText>
            <AppText variant="bodySmall" color="#64748B" style={styles.emptyText}>
              Add your first pet companion to unlock health records, meal schedules, and smart tracking.
            </AppText>
            <CustomButton
              title="Register Your First Pet"
              onPress={handleAddPet}
              style={styles.emptyBtn}
            />
          </View>
        ) : (
          <View style={styles.petsList}>
            {pets.map((pet, index) => (
              <PetCardItem
                key={pet._id}
                pet={pet}
                index={index}
                isActive={pet._id === activePetId}
                isBusy={switchingId === pet._id}
                currentUserId={user?._id}
                onSelectActive={handleSelectActive}
                onEdit={handleEditPet}
                onDelete={handleDeletePress}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <AppConfirmModal
        visible={Boolean(deleteTargetPet)}
        title={`Delete ${deleteTargetPet?.name || 'Pet'}?`}
        message={`Are you sure you want to delete ${deleteTargetPet?.name || 'this pet'}? All schedules, expenses, and health logs associated with this pet will be permanently removed.`}
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
        message="Free accounts can register 1 pet profile. Upgrade to PetHorizon Premium for unlimited pet profiles, advanced insights, and family collaboration!"
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
    paddingTop: Spacing.sm,
  },
  heroCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#1B5E20',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  heroRing1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroRing2: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  heroWatermark: {
    position: 'absolute',
    right: 12,
    bottom: -4,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  heroTextContainer: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  heroTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginBottom: 6,
  },
  heroTagText: {
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 20,
    marginBottom: 2,
  },
  heroSubtitle: {
    lineHeight: 16,
  },
  heroAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E8F5E9',
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
    borderRadius: 8,
  },
  petsList: {
    gap: Spacing.md,
  },
  petCardWrapper: {
    width: '100%',
  },
  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#0E3821',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  petCardActive: {
    borderColor: '#2E7D32',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  activePillBadge: {
    position: 'absolute',
    top: Spacing.sm + 2,
    right: Spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    zIndex: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
  },
  activePillText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  cardHeaderArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30, // Circular matching home screen
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
  },
  placeholderAvatar: {
    backgroundColor: '#2E7D32', // Emerald green with white paw matching Home screen
    alignItems: 'center',
    justifyContent: 'center',
  },
  petDetailsCol: {
    flex: 1,
    paddingRight: 64, // room for active pill
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  petNameText: {
    fontSize: 18,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sharedText: {
    fontSize: 9,
  },
  speciesBreedText: {
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  chipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 11,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setActiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  activeStatusHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deleteBtn: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
});
