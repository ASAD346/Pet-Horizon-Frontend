import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';
import { usePets } from '@/hooks/usePets';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useDebouncedRouter } from '@/hooks/useDebounce';
import { usePetHealthCard } from '@/hooks/usePetHealthCard';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import {
  HealthPassportCard,
  HealthTimelineSection,
  ShowVetModal,
  EditVitalsModal,
  type HealthCategory,
} from '@/components/health-card';
import type { HealthCardPet } from '@/services/pets/healthCardApi';

export default function PetHealthCardScreen() {
  const router = useDebouncedRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const { pet: activePet } = useActivePet(token);
  const { isPremium } = usePremiumStatus();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showVetModalVisible, setShowVetModalVisible] = useState(false);
  const [editVitalsVisible, setEditVitalsVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HealthCategory>('all');

  const effectivePetId = activePet?._id ?? user?.activePetId;

  const { pets, switchPet } = usePets(
    token,
    effectivePetId,
    user?._id
  );

  // Health Card Server Aggregation Query
  const { data: healthData, isRefetching, refetch } = usePetHealthCard(
    token,
    effectivePetId,
    selectedCategory
  );

  // Robust fallback: if server query hasn't finished or is loading, use activePet immediately so screen is NEVER blank
  const effectivePet: HealthCardPet | null = useMemo(() => {
    if (healthData?.pet) return healthData.pet;
    if (activePet) {
      return {
        id: activePet._id,
        name: activePet.name,
        species: activePet.species || '',
        breed: activePet.breed || '',
        gender: activePet.gender || '',
        age: activePet.age ?? null,
        birthday: activePet.birthday ? String(activePet.birthday) : null,
        weight: activePet.weight ?? null,
        weightUnit: activePet.weightUnit || 'kg',
        color: activePet.color || '',
        medicalNotes: activePet.medicalNotes || '',
        allergies: activePet.allergies || '',
        vetClinic: activePet.vetClinic || '',
        emergencyContact: activePet.emergencyContact || '',
        bloodGroup: activePet.bloodGroup || '',
        image: activePet.image || null,
      };
    }
    return null;
  }, [healthData?.pet, activePet]);

  const effectiveStats = useMemo(() => {
    if (healthData?.summaryStats) return healthData.summaryStats;
    return {
      vaccineStatus: {
        status: 'not_recorded' as const,
        label: 'No Vaccine Record',
      },
      activeMedsCount: 0,
      lastGroomedDate: null,
    };
  }, [healthData?.summaryStats]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [router]);

  const handleSelectPet = useCallback(
    async (petId: string) => {
      setDropdownOpen(false);
      if (petId !== effectivePetId) {
        await switchPet(petId);
      }
    },
    [effectivePetId, switchPet]
  );

  // Matching Notifications header gradient colors
  const gradientColors = isPremium
    ? (['#0E3821', '#184F2E', '#267343'] as const)
    : (['#3A8F3B', '#5CB35D'] as const);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* TOP HEADER: Matching Notifications & Home screens perfectly */}
      <View style={styles.headerWrapper}>
        <View style={styles.curveClipper}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerGradient, { paddingTop: Math.max(insets.top, Spacing.sm) + 6 }]}
          >
            {/* Background Decorative Rings */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={styles.bgRing1} />
              <View style={styles.bgRing2} />
            </View>

            <View style={styles.headerRow}>
              {/* Back Button matching notifications */}
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backButton}
                hitSlop={12}
                accessibilityLabel="Go back"
              >
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color={isPremium ? '#184F2E' : '#3A8F3B'}
                />
              </TouchableOpacity>

              {/* Center: Pet Dropdown Selector Trigger */}
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setDropdownOpen((prev) => !prev)}
                activeOpacity={0.85}
                accessibilityLabel="Select pet"
              >
                <View style={styles.dropdownHeaderRow}>
                  <AppText variant="h3" weight="800" color="#FFFFFF" numberOfLines={1}>
                    {effectivePet?.name || 'Pet Health Passport'}
                  </AppText>
                  <Ionicons
                    name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#FFFFFF"
                    style={{ marginLeft: 4 }}
                  />
                </View>
                <AppText variant="caption" weight="600" color="rgba(255, 255, 255, 0.82)">
                  Digital Health Passport
                </AppText>
              </TouchableOpacity>

              {/* Right Action: Show Vet Mode Button */}
              <TouchableOpacity
                onPress={() => setShowVetModalVisible(true)}
                style={styles.rightActionBtn}
                hitSlop={12}
                accessibilityLabel="Show vet summary view"
              >
                <Ionicons name="medkit" size={16} color={isPremium ? '#184F2E' : '#3A8F3B'} />
              </TouchableOpacity>
            </View>

            {/* Bottom accent divider line */}
            <View
              style={[
                styles.headerDivider,
                isPremium
                  ? { backgroundColor: 'rgba(212, 160, 23, 0.3)' }
                  : { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
              ]}
            />
          </LinearGradient>
        </View>
      </View>

      {/* DROPDOWN MENU MODAL: Actual floating dropdown anchored right below header */}
      {dropdownOpen && (
        <Modal
          transparent
          animationType="fade"
          visible={dropdownOpen}
          onRequestClose={() => setDropdownOpen(false)}
        >
          <Pressable style={styles.dropdownOverlay} onPress={() => setDropdownOpen(false)}>
            <View
              style={[
                styles.dropdownMenu,
                { top: Math.max(insets.top, Spacing.sm) + 68 },
              ]}
            >
              <AppText variant="caption" weight="800" color="#64748B" style={styles.dropdownSectionLabel}>
                SELECT COMPANION
              </AppText>

              <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
                {pets.map((p) => {
                  const isSelected = p._id === effectivePetId;
                  const petImg = p.image ? resolveMediaUrl(p.image) : null;

                  return (
                    <TouchableOpacity
                      key={p._id}
                      style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                      onPress={() => handleSelectPet(p._id)}
                      activeOpacity={0.75}
                    >
                      {petImg ? (
                        <Image source={{ uri: petImg }} style={styles.dropdownPetAvatar} />
                      ) : (
                        <View style={styles.dropdownPetAvatarFallback}>
                          <MaterialCommunityIcons name="paw" size={16} color="#2E7D32" />
                        </View>
                      )}

                      <View style={styles.dropdownItemText}>
                        <AppText
                          variant="bodySmall"
                          weight={isSelected ? '800' : '600'}
                          color={isSelected ? '#1B5E20' : '#1E293B'}
                          numberOfLines={1}
                        >
                          {p.name}
                        </AppText>
                        <AppText variant="caption" color="#64748B">
                          {p.breed || p.species || 'Pet'}
                        </AppText>
                      </View>

                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Add Pet Action */}
              <TouchableOpacity
                style={styles.dropdownAddBtn}
                onPress={() => {
                  setDropdownOpen(false);
                  router.push('/pet/register');
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={18} color="#2E7D32" />
                <AppText variant="bodySmall" weight="700" color="#2E7D32">
                  Register New Pet
                </AppText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* MAIN SCREEN BODY */}
      {!effectivePet ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <MaterialCommunityIcons name="paw" size={36} color="#5CB35D" />
          </View>
          <AppText variant="h3" weight="800" color="#0E3821" style={{ marginTop: Spacing.sm }}>
            No Pet Registered
          </AppText>
          <AppText variant="caption" color="#64748B" style={styles.emptyText}>
            Register your pet companion to view their digital health passport, vaccines, and medical history.
          </AppText>
          <TouchableOpacity
            style={styles.emptyRegisterBtn}
            onPress={() => router.push('/pet/register')}
            activeOpacity={0.85}
          >
            <AppText variant="bodySmall" weight="800" color="#FFFFFF">
              Register a Pet
            </AppText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={isPremium ? '#184F2E' : '#2E7D32'}
            />
          }
        >
          {/* 1. Health Passport Card */}
          <HealthPassportCard
            pet={effectivePet}
            stats={effectiveStats}
            isPremium={isPremium}
            onShowVet={() => setShowVetModalVisible(true)}
            onEditVitals={() => setEditVitalsVisible(true)}
          />

          {/* 2. Chronological Medical History Timeline */}
          <HealthTimelineSection
            timeline={healthData?.timeline || []}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={healthData?.categoryCounts}
            petName={effectivePet.name}
          />
        </ScrollView>
      )}

      {/* FULLSCREEN VET SUMMARY MODAL */}
      {effectivePet && (
        <ShowVetModal
          visible={showVetModalVisible}
          onClose={() => setShowVetModalVisible(false)}
          pet={effectivePet}
          timeline={healthData?.timeline || []}
        />
      )}

      {/* EDIT MEDICAL DETAILS MODAL */}
      {effectivePet && (
        <EditVitalsModal
          visible={editVitalsVisible}
          onClose={() => setEditVitalsVisible(false)}
          pet={effectivePet}
          token={token}
          onSuccess={() => void refetch()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F6F4',
  },
  headerWrapper: {
    width: '100%',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#0E3821',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },
  curveClipper: {
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#F1F7F1',
  },
  headerGradient: {
    paddingBottom: 0,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
    paddingHorizontal: Spacing.lg,
  },
  bgRing1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -60,
    right: -40,
  },
  bgRing2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -40,
    left: -20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingBottom: 8,
    position: 'relative',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2EBE2',
    ...Platform.select({
      ios: {
        shadowColor: '#0E3821',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  rightActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2EBE2',
    ...Platform.select({
      ios: {
        shadowColor: '#0E3821',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  dropdownTrigger: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  dropdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  dropdownMenu: {
    position: 'absolute',
    alignSelf: 'center',
    width: '88%',
    maxHeight: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  },
  dropdownSectionLabel: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  dropdownList: {
    maxHeight: 220,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    marginBottom: 4,
  },
  dropdownItemActive: {
    backgroundColor: '#E8F5E9',
  },
  dropdownPetAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  dropdownPetAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dropdownItemText: {
    flex: 1,
  },
  dropdownAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    lineHeight: 18,
  },
  emptyRegisterBtn: {
    marginTop: Spacing.lg,
    backgroundColor: '#2E7D32',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
});
