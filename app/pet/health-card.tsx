import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useDebouncedRouter } from '@/hooks/useDebounce';
import { usePetHealthCard } from '@/hooks/usePetHealthCard';
import { Radius, Spacing } from '@/constants/theme';
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

  const [showVetModalVisible, setShowVetModalVisible] = useState(false);
  const [editVitalsVisible, setEditVitalsVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HealthCategory>('all');

  const effectivePetId = activePet?._id ?? user?.activePetId;

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

  // Matching Notifications header gradient colors
  const gradientColors = isPremium
    ? (['#0E3821', '#184F2E', '#267343'] as const)
    : (['#3A8F3B', '#5CB35D'] as const);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* TOP HEADER: Matching Notifications & Home screens */}
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

              {/* Center: Title & Subtitle */}
              <View style={styles.headerTitleContainer}>
                <AppText variant="h3" weight="800" color="#FFFFFF" numberOfLines={1}>
                  {effectivePet?.name ? `${effectivePet.name}'s Health Card` : 'Pet Health Card'}
                </AppText>
                <AppText variant="caption" weight="600" color="rgba(255, 255, 255, 0.85)">
                  Digital Health Passport
                </AppText>
              </View>

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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
