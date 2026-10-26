import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { formatPetAge, formatPetWeight } from '@/services/pets/petDisplay';
import type { HealthCardPet, HealthCardSummaryStats } from '@/services/pets/healthCardApi';

interface HealthPassportCardProps {
  pet: HealthCardPet;
  stats: HealthCardSummaryStats;
  isPremium?: boolean;
  onShowVet?: () => void;
  onEditVitals?: () => void;
}

export function HealthPassportCard({
  pet,
  stats,
  isPremium = false,
  onShowVet,
  onEditVitals,
}: HealthPassportCardProps) {
  const imageUrl = pet.image ? resolveMediaUrl(pet.image) : null;

  // Accurately compute age from birthday or age field
  const displayAge = useMemo(() => {
    if (pet.birthday) {
      const formatted = formatPetAge(pet.birthday);
      if (formatted && formatted !== '—' && formatted !== 'Not set') {
        return formatted;
      }
    }
    if (pet.age !== null && pet.age !== undefined && !Number.isNaN(Number(pet.age))) {
      const num = Number(pet.age);
      return `${num} ${num === 1 ? 'yr' : 'yrs'}`;
    }
    return 'Not set';
  }, [pet.birthday, pet.age]);

  // Formatted weight
  const displayWeight = formatPetWeight(pet.weight, pet.weightUnit);

  // Formatted gender
  const displayGender = pet.gender
    ? pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1).toLowerCase()
    : 'Not set';

  // Vaccine status color helper
  const vBadge = useMemo(() => {
    const s = stats.vaccineStatus?.status;
    if (s === 'up_to_date') {
      return {
        bg: '#E8F5E9',
        text: '#1B5E20',
        dot: '#2E7D32',
        label: 'Vaccines Up to Date',
      };
    }
    if (s === 'due_soon') {
      return {
        bg: '#FFF8E1',
        text: '#B78103',
        dot: '#F57F17',
        label: 'Vaccine Due Soon',
      };
    }
    if (s === 'overdue') {
      return {
        bg: '#FFEBEE',
        text: '#C62828',
        dot: '#D32F2F',
        label: 'Vaccine Overdue',
      };
    }
    return {
      bg: '#F1F5F9',
      text: '#475569',
      dot: '#94A3B8',
      label: 'No Vaccine Record',
    };
  }, [stats.vaccineStatus]);

  // Format last groomed date
  const formatGroomedDate = (isoStr: string | null) => {
    if (!isoStr) return 'None';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'None';
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* Top Slim Gradient Accent Ribbon */}
      <LinearGradient
        colors={
          isPremium
            ? ['#D4A017', '#F1C40F', '#D4A017']
            : ['#1B5E20', '#2E7D32', '#43A047']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentRibbon}
      />

      {/* Main Card Content */}
      <View style={styles.innerCard}>
        {/* Header Row: Pet Photo, Identity, and Action Buttons */}
        <View style={styles.headerRow}>
          <View style={styles.avatarWrapper}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.avatar} contentFit="cover" transition={150} />
            ) : (
              <View style={styles.avatarFallback}>
                <MaterialCommunityIcons name="paw" size={26} color="#2E7D32" />
              </View>
            )}
            {isPremium && (
              <View style={styles.crownTag}>
                <Ionicons name="star" size={9} color="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={styles.nameBlock}>
            <View style={styles.nameRow}>
              <AppText variant="h3" weight="800" color="#0E3821" numberOfLines={1}>
                {pet.name}
              </AppText>
              <View style={[styles.passportSeal, isPremium && styles.passportSealPremium]}>
                <AppText
                  variant="caption"
                  weight="800"
                  color={isPremium ? '#B78103' : '#2E7D32'}
                  style={styles.sealText}
                >
                  {isPremium ? 'PREMIUM PASSPORT' : 'DIGITAL PASSPORT'}
                </AppText>
              </View>
            </View>

            <AppText variant="caption" weight="600" color="#64748B">
              {pet.breed ? `${pet.breed} • ${pet.species || 'Pet'}` : pet.species || 'Companion'}
            </AppText>
          </View>

          {/* Show Vet Button */}
          {onShowVet && (
            <TouchableOpacity
              style={styles.showVetBtn}
              onPress={onShowVet}
              activeOpacity={0.8}
              accessibilityLabel="Show veterinary clinical summary"
            >
              <Ionicons name="medkit" size={13} color="#2E7D32" />
              <AppText variant="caption" weight="800" color="#2E7D32">
                Vet Card
              </AppText>
            </TouchableOpacity>
          )}
        </View>

        {/* 3-Column Metrics Capsule Bar (Age, Weight, Sex) */}
        <View style={styles.vitalsBar}>
          <View style={styles.vitalSegment}>
            <AppText variant="caption" weight="700" color="#64748B" style={styles.vitalLabel}>
              AGE
            </AppText>
            <AppText variant="bodySmall" weight="800" color="#0E3821">
              {displayAge}
            </AppText>
          </View>

          <View style={styles.vitalDivider} />

          <View style={styles.vitalSegment}>
            <AppText variant="caption" weight="700" color="#64748B" style={styles.vitalLabel}>
              WEIGHT
            </AppText>
            <AppText variant="bodySmall" weight="800" color="#0E3821">
              {displayWeight}
            </AppText>
          </View>

          <View style={styles.vitalDivider} />

          <View style={styles.vitalSegment}>
            <AppText variant="caption" weight="700" color="#64748B" style={styles.vitalLabel}>
              SEX
            </AppText>
            <AppText variant="bodySmall" weight="800" color="#0E3821">
              {displayGender}
            </AppText>
          </View>
        </View>

        {/* Clinical Notes & Allergies Strip (Interactive with Edit Pencil) */}
        <TouchableOpacity
          style={styles.medicalStrip}
          onPress={onEditVitals}
          activeOpacity={0.75}
          accessibilityLabel="Edit allergies and clinic details"
        >
          <View style={styles.medicalStripContent}>
            {/* Allergies Row */}
            <View style={styles.clinicalItemRow}>
              <View style={styles.alertDot}>
                <Ionicons
                  name={pet.allergies ? 'alert-circle' : 'checkmark-circle'}
                  size={14}
                  color={pet.allergies ? '#D32F2F' : '#2E7D32'}
                />
              </View>
              <AppText variant="caption" weight="700" color="#334155">
                Allergies:
              </AppText>
              <AppText
                variant="caption"
                weight="700"
                color={pet.allergies ? '#D32F2F' : '#64748B'}
                style={styles.clinicalItemValue}
                numberOfLines={1}
              >
                {pet.allergies || 'None reported'}
              </AppText>
            </View>

            {/* Clinic Row */}
            <View style={styles.clinicalItemRow}>
              <View style={styles.clinicIcon}>
                <MaterialCommunityIcons name="hospital-building" size={14} color="#1565C0" />
              </View>
              <AppText variant="caption" weight="700" color="#334155">
                Vet Clinic:
              </AppText>
              <AppText
                variant="caption"
                weight="600"
                color={pet.vetClinic ? '#0E3821' : '#64748B'}
                style={styles.clinicalItemValue}
                numberOfLines={1}
              >
                {pet.vetClinic || 'Tap to add clinic details'}
              </AppText>
            </View>

            {/* Emergency Phone Row */}
            {pet.emergencyContact ? (
              <View style={styles.clinicalItemRow}>
                <View style={styles.emergencyIcon}>
                  <Ionicons name="call" size={13} color="#D32F2F" />
                </View>
                <AppText variant="caption" weight="700" color="#D32F2F">
                  Emergency:
                </AppText>
                <AppText
                  variant="caption"
                  weight="800"
                  color="#D32F2F"
                  style={styles.clinicalItemValue}
                  numberOfLines={1}
                >
                  {pet.emergencyContact}
                </AppText>
              </View>
            ) : null}
          </View>

          {/* Edit Pencil Icon Button */}
          <View style={styles.editPencilBtn}>
            <MaterialCommunityIcons name="pencil-outline" size={16} color="#2E7D32" />
          </View>
        </TouchableOpacity>

        {/* Status Badges Row: Vaccines, Active Meds, Grooming */}
        <View style={styles.badgesRow}>
          {/* Vaccine Badge */}
          <View style={[styles.badgePill, { backgroundColor: vBadge.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: vBadge.dot }]} />
            <AppText variant="caption" weight="800" color={vBadge.text} style={styles.badgeText}>
              {vBadge.label}
            </AppText>
          </View>

          {/* Active Meds Badge */}
          <View style={[styles.badgePill, styles.medsBadge]}>
            <MaterialCommunityIcons name="pill" size={13} color="#1565C0" />
            <AppText variant="caption" weight="800" color="#1565C0" style={styles.badgeText}>
              {stats.activeMedsCount > 0 ? `${stats.activeMedsCount} Active Meds` : '0 Active Meds'}
            </AppText>
          </View>

          {/* Grooming Badge */}
          <View style={[styles.badgePill, styles.groomBadge]}>
            <MaterialCommunityIcons name="content-cut" size={13} color="#6A1B9A" />
            <AppText variant="caption" weight="800" color="#6A1B9A" style={styles.badgeText}>
              Groomed: {formatGroomedDate(stats.lastGroomedDate)}
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#0E3821',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  accentRibbon: {
    height: 4,
    width: '100%',
  },
  innerCard: {
    padding: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F2',
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
  },
  crownTag: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#D4A017',
    borderRadius: 7,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  passportSeal: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  passportSealPremium: {
    backgroundColor: '#FFF8E1',
  },
  sealText: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  showVetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 4,
  },
  vitalsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: '#EEF2EE',
    marginBottom: Spacing.sm,
  },
  vitalSegment: {
    flex: 1,
    alignItems: 'center',
  },
  vitalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  vitalLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  medicalStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFDFB',
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E4EBE4',
    marginBottom: Spacing.sm,
  },
  medicalStripContent: {
    flex: 1,
    gap: 4,
  },
  clinicalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertDot: {
    marginRight: 6,
  },
  clinicIcon: {
    marginRight: 6,
  },
  emergencyIcon: {
    marginRight: 6,
  },
  clinicalItemValue: {
    marginLeft: 4,
    flex: 1,
  },
  editPencilBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  medsBadge: {
    backgroundColor: '#E3F2FD',
  },
  groomBadge: {
    backgroundColor: '#F3E5F5',
  },
  badgeText: {
    fontSize: 11,
  },
});
