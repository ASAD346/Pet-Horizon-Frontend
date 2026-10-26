import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import type { HealthCardPet, HealthCardSummaryStats } from '@/services/pets/healthCardApi';
import { formatPetAge, formatPetWeight } from '@/services/pets/petDisplay';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface HealthPassportCardProps {
  pet: HealthCardPet;
  stats?: HealthCardSummaryStats;
  isPremium?: boolean;
  onShowVet?: () => void;
  onEditVitals?: () => void;
}

export function HealthPassportCard({
  pet,
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

  const displaySpecies = pet.species
    ? pet.species.charAt(0).toUpperCase() + pet.species.slice(1).toLowerCase()
    : 'Companion';

  return (
    <View style={styles.cardContainer}>
      {/* Patient Header: Avatar, Name, Breed, and Edit Button */}
      <View style={styles.patientHeader}>
        <View style={styles.avatarWrapper}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.avatar}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <MaterialCommunityIcons name="paw" size={26} color="#0E3821" />
            </View>
          )}
        </View>

        <View style={styles.nameBlock}>
          <AppText variant="h3" weight="800" color="#0E3821" numberOfLines={1}>
            {pet.name}
          </AppText>
          <AppText variant="caption" weight="600" color="#64748B" style={styles.breedText}>
            {pet.breed ? `${pet.breed} • ${displaySpecies}` : displaySpecies}
          </AppText>
        </View>

        {onEditVitals && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={onEditVitals}
            hitSlop={10}
            activeOpacity={0.8}
            accessibilityLabel="Edit clinical details"
          >
            <Ionicons name="create-outline" size={18} color="#0E3821" />
          </TouchableOpacity>
        )}
      </View>

      {/* 4-Metric Vitals Grid */}
      <View style={styles.vitalsGrid}>
        <View style={styles.vitalCol}>
          <AppText variant="caption" weight="700" color="#64748B" style={styles.vitalLabel}>
            AGE
          </AppText>
          <AppText variant="bodySmall" weight="800" color="#0E3821">
            {displayAge}
          </AppText>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.vitalCol}>
          <AppText variant="caption" weight="700" color="#64748B" style={styles.vitalLabel}>
            WEIGHT
          </AppText>
          <AppText variant="bodySmall" weight="800" color="#0E3821">
            {displayWeight}
          </AppText>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.vitalCol}>
          <AppText variant="caption" weight="700" color="#64748B" style={styles.vitalLabel}>
            SEX
          </AppText>
          <AppText variant="bodySmall" weight="800" color="#0E3821">
            {displayGender}
          </AppText>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.vitalCol}>
          <AppText variant="caption" weight="700" color="#64748B" style={styles.vitalLabel}>
            SPECIES
          </AppText>
          <AppText variant="bodySmall" weight="800" color="#0E3821" numberOfLines={1}>
            {displaySpecies}
          </AppText>
        </View>
      </View>

      {/* Structured Clinical Identification Strip */}
      <TouchableOpacity
        style={styles.clinicalSection}
        onPress={onEditVitals}
        activeOpacity={0.8}
        accessibilityLabel="Edit clinical records and emergency contact"
      >
        {/* Known Allergies Row */}
        <View style={styles.clinicalRow}>
          <View style={[styles.rowIconCircle, pet.allergies ? styles.iconCircleAlert : styles.iconCircleNeutral]}>
            <Ionicons
              name={pet.allergies ? 'alert-circle' : 'shield-checkmark-outline'}
              size={15}
              color={pet.allergies ? '#D32F2F' : '#2E7D32'}
            />
          </View>
          <View style={styles.rowContent}>
            <AppText variant="caption" weight="700" color="#475569">
              Known Allergies
            </AppText>
            <AppText
              variant="caption"
              weight="800"
              color={pet.allergies ? '#D32F2F' : '#64748B'}
              numberOfLines={1}
            >
              {pet.allergies || 'None reported'}
            </AppText>
          </View>
        </View>

        <View style={styles.rowDivider} />

        {/* Primary Care Vet Clinic Row */}
        <View style={styles.clinicalRow}>
          <View style={[styles.rowIconCircle, styles.iconCircleBlue]}>
            <MaterialCommunityIcons name="hospital-building" size={15} color="#1565C0" />
          </View>
          <View style={styles.rowContent}>
            <AppText variant="caption" weight="700" color="#475569">
              Primary Clinic
            </AppText>
            <AppText
              variant="caption"
              weight="700"
              color={pet.vetClinic ? '#0E3821' : '#94A3B8'}
              numberOfLines={1}
            >
              {pet.vetClinic || 'Tap to add primary clinic'}
            </AppText>
          </View>
        </View>

        <View style={styles.rowDivider} />

        {/* Emergency Contact Row */}
        <View style={styles.clinicalRow}>
          <View style={[styles.rowIconCircle, styles.iconCircleRed]}>
            <Ionicons name="call-outline" size={14} color="#D32F2F" />
          </View>
          <View style={styles.rowContent}>
            <AppText variant="caption" weight="700" color="#475569">
              Emergency 24/7 Hospital
            </AppText>
            <AppText
              variant="caption"
              weight="700"
              color={pet.emergencyContact ? '#D32F2F' : '#94A3B8'}
              numberOfLines={1}
            >
              {pet.emergencyContact || 'Tap to add emergency contact'}
            </AppText>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarWrapper: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  nameBlock: {
    flex: 1,
  },
  breedText: {
    marginTop: 2,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    marginBottom: Spacing.md,
  },
  vitalCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalLabel: {
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  verticalDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#E2E8F0',
  },
  clinicalSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  clinicalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  iconCircleNeutral: {
    backgroundColor: '#F0FDF4',
  },
  iconCircleAlert: {
    backgroundColor: '#FEF2F2',
  },
  iconCircleBlue: {
    backgroundColor: '#EFF6FF',
  },
  iconCircleRed: {
    backgroundColor: '#FEF2F2',
  },
  rowContent: {
    flex: 1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
});
