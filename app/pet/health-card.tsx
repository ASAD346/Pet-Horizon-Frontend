import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppText } from '@/components/ui/AppText';
import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';
import { usePets } from '@/hooks/usePets';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useDebouncedRouter } from '@/hooks/useDebounce';
import { usePetHealthCard } from '@/hooks/usePetHealthCard';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { Radius, Spacing } from '@/constants/theme';
import { PetSwitcherSheet } from '@/components/pet/PetSwitcherSheet';
import {
  HealthPassportCard,
  HealthTimelineSection,
  ShowVetModal,
  type HealthCategory,
} from '@/components/health-card';

export default function PetHealthCardScreen() {
  const router = useDebouncedRouter();
  const { token, user } = useAuth();
  const { pet: activePet, loading: activePetLoading } = useActivePet(token);
  const { isPremium } = usePremiumStatus();

  // Pet Switcher
  const [petSwitcherVisible, setPetSwitcherVisible] = useState(false);
  const [showVetModalVisible, setShowVetModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HealthCategory>('all');

  const { pets, switchingId, switchPet } = usePets(
    token,
    activePet?._id ?? user?.activePetId,
    user?._id
  );

  const effectivePetId = activePet?._id ?? user?.activePetId;

  // Health Card Server Aggregation Query
  const { data: healthData, loading: healthLoading, isRefetching, refetch } = usePetHealthCard(
    token,
    effectivePetId,
    selectedCategory
  );

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [router]);

  const handleSelectPet = useCallback(
    async (newPetId: string) => {
      setPetSwitcherVisible(false);
      if (newPetId !== effectivePetId) {
        await switchPet(newPetId);
      }
    },
    [effectivePetId, switchPet]
  );

  const activePetImage = activePet?.image ? resolveMediaUrl(activePet.image) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Top Header with Back Button, Pet Dropdown Switcher, and Show Vet Action */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.iconButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color="#0E3821" />
        </TouchableOpacity>

        {/* Center: Interactive Pet Dropdown Switcher */}
        <TouchableOpacity
          style={styles.petSwitcherDropdown}
          onPress={() => setPetSwitcherVisible(true)}
          activeOpacity={0.8}
          accessibilityLabel="Switch active pet"
        >
          {activePetImage ? (
            <Image source={{ uri: activePetImage }} style={styles.dropdownAvatar} contentFit="cover" />
          ) : (
            <View style={styles.dropdownAvatarPlaceholder}>
              <MaterialCommunityIcons name="paw" size={14} color="#0E3821" />
            </View>
          )}

          <View style={styles.dropdownInfo}>
            <View style={styles.dropdownTitleRow}>
              <AppText variant="bodySmall" weight="800" color="#0E3821" numberOfLines={1}>
                {activePet?.name || 'Select Pet'}
              </AppText>
              <Ionicons name="chevron-down" size={14} color="#0E3821" style={{ marginLeft: 4 }} />
            </View>
            <AppText variant="caption" color="#64748B" style={styles.dropdownSubtitle}>
              Health Passport
            </AppText>
          </View>
        </TouchableOpacity>

        {/* Right: Quick Show Vet Mode */}
        <TouchableOpacity
          style={styles.showVetHeaderBtn}
          onPress={() => setShowVetModalVisible(true)}
          disabled={!healthData?.pet}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Show vet summary view"
        >
          <Ionicons name="medkit-outline" size={20} color="#0E3821" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {healthLoading && !healthData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <AppText variant="caption" color="#64748B" style={{ marginTop: Spacing.sm }}>
            Loading Health Passport & Medical Records...
          </AppText>
        </View>
      ) : !healthData?.pet ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="paw-off" size={48} color="#94A3B8" />
          <AppText variant="h3" weight="800" color="#0E3821" style={{ marginTop: Spacing.sm }}>
            No Pet Selected
          </AppText>
          <AppText variant="caption" color="#64748B" style={styles.emptyText}>
            Please select or register a pet companion to view their health card and medical timeline.
          </AppText>
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
          {/* 1. Digital Health Passport Card */}
          <HealthPassportCard
            pet={healthData.pet}
            stats={healthData.summaryStats}
            isPremium={isPremium}
            onShowVet={() => setShowVetModalVisible(true)}
          />

          {/* 2. Chronological Medical & Care History Timeline */}
          <HealthTimelineSection
            timeline={healthData.timeline || []}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={healthData.categoryCounts}
            petName={healthData.pet?.name}
          />
        </ScrollView>
      )}

      {/* Bottom Sheet Pet Switcher */}
      <PetSwitcherSheet
        visible={petSwitcherVisible}
        pets={pets}
        activePetId={effectivePetId}
        currentUserId={user?._id}
        loading={activePetLoading}
        switchingId={switchingId}
        onClose={() => setPetSwitcherVisible(false)}
        onSelectPet={handleSelectPet}
        onAddPet={() => {
          setPetSwitcherVisible(false);
          router.push('/pet/register');
        }}
      />

      {/* Fullscreen Veterinary Clinical Review Modal */}
      {healthData?.pet && (
        <ShowVetModal
          visible={showVetModalVisible}
          onClose={() => setShowVetModalVisible(false)}
          pet={healthData.pet}
          timeline={healthData.timeline || []}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEFEA',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petSwitcherDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F2',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    maxWidth: '65%',
  },
  dropdownAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 6,
  },
  dropdownAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  dropdownInfo: {
    justifyContent: 'center',
  },
  dropdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownSubtitle: {
    fontSize: 10,
    marginTop: -2,
  },
  showVetHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
});
