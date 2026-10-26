import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import type { HealthCardPet, HealthCardSummaryStats } from '@/services/pets/healthCardApi';

interface HealthPassportCardProps {
  pet: HealthCardPet;
  stats: HealthCardSummaryStats;
  isPremium?: boolean;
  onShowVet?: () => void;
}

export function HealthPassportCard({
  pet,
  stats,
  isPremium = false,
  onShowVet,
}: HealthPassportCardProps) {
  const imageUrl = pet.image ? resolveMediaUrl(pet.image) : null;

  // Premium: Deep Forest Emerald with Gold trim; Free: Brand Rich Green
  const gradientColors = isPremium
    ? (['#0E331E', '#184F2E', '#226D3F'] as const)
    : (['#1E5E3A', '#2E7D32', '#388E3C'] as const);

  const cardBorderColor = isPremium ? 'rgba(212, 160, 23, 0.45)' : 'rgba(255, 255, 255, 0.2)';

  // Vaccine status color helper
  const getVaccineBadge = () => {
    const s = stats.vaccineStatus?.status;
    if (s === 'up_to_date') {
      return {
        bg: '#E8F5E9',
        text: '#1B5E20',
        icon: 'checkmark-circle' as const,
        label: 'Vaccines Up to Date',
      };
    }
    if (s === 'due_soon') {
      return {
        bg: '#FFF8E1',
        text: '#B78103',
        icon: 'time' as const,
        label: 'Vaccine Due Soon',
      };
    }
    if (s === 'overdue') {
      return {
        bg: '#FFEBEE',
        text: '#C62828',
        icon: 'alert-circle' as const,
        label: 'Vaccine Overdue',
      };
    }
    return {
      bg: '#F5F5F5',
      text: '#616161',
      icon: 'help-circle' as const,
      label: 'No Vaccine Record',
    };
  };

  const vBadge = getVaccineBadge();

  // Format last groomed date
  const formatGroomedDate = (isoStr: string | null) => {
    if (!isoStr) return 'None recorded';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'None recorded';
    }
  };

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor: cardBorderColor }]}
    >
      {/* Background Decorative Paw Print Watermark */}
      <MaterialCommunityIcons
        name="paw"
        size={110}
        color="rgba(255, 255, 255, 0.05)"
        style={styles.watermark}
      />

      {/* Top Bar: Pet Avatar + Details + Show Vet Button */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrapper}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="paw" size={32} color="#FFFFFF" />
            </View>
          )}
          {isPremium && (
            <View style={styles.crownBadge}>
              <Ionicons name="star" size={10} color="#0E331E" />
            </View>
          )}
        </View>

        <View style={styles.petIdentity}>
          <View style={styles.nameRow}>
            <AppText variant="h3" weight="800" color="#FFFFFF" numberOfLines={1}>
              {pet.name}
            </AppText>
          </View>
          <AppText variant="caption" weight="600" color="rgba(255, 255, 255, 0.85)">
            {pet.breed || pet.species ? `${pet.breed || pet.species} • ${pet.species || 'Pet'}` : 'Companion'}
          </AppText>
          <View style={styles.passportTag}>
            <MaterialCommunityIcons name="card-account-details-outline" size={12} color="#E8F5E9" />
            <AppText variant="caption" weight="700" color="#E8F5E9" style={styles.passportTagText}>
              DIGITAL HEALTH PASSPORT
            </AppText>
          </View>
        </View>

        {onShowVet && (
          <TouchableOpacity
            style={styles.showVetBtn}
            onPress={onShowVet}
            activeOpacity={0.8}
            accessibilityLabel="Show vet summary view"
          >
            <Ionicons name="medkit" size={14} color="#0E3821" />
            <AppText variant="caption" weight="800" color="#0E3821">
              Show Vet
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Vitals Grid: Age, Weight, Gender, Allergies, Vet Clinic */}
      <View style={styles.vitalsGrid}>
        <View style={styles.vitalItem}>
          <AppText variant="caption" color="rgba(255, 255, 255, 0.65)" style={styles.vitalLabel}>
            AGE
          </AppText>
          <AppText variant="bodySmall" weight="700" color="#FFFFFF">
            {pet.age !== null && pet.age !== undefined ? `${pet.age} yr` : '—'}
          </AppText>
        </View>

        <View style={styles.vitalItem}>
          <AppText variant="caption" color="rgba(255, 255, 255, 0.65)" style={styles.vitalLabel}>
            WEIGHT
          </AppText>
          <AppText variant="bodySmall" weight="700" color="#FFFFFF">
            {pet.weight ? `${pet.weight} ${pet.weightUnit || 'kg'}` : '—'}
          </AppText>
        </View>

        <View style={styles.vitalItem}>
          <AppText variant="caption" color="rgba(255, 255, 255, 0.65)" style={styles.vitalLabel}>
            GENDER
          </AppText>
          <AppText variant="bodySmall" weight="700" color="#FFFFFF">
            {pet.gender ? pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1) : '—'}
          </AppText>
        </View>

        <View style={styles.vitalItem}>
          <AppText variant="caption" color="rgba(255, 255, 255, 0.65)" style={styles.vitalLabel}>
            ALLERGIES
          </AppText>
          <AppText variant="bodySmall" weight="700" color="#FFFFFF" numberOfLines={1}>
            {pet.allergies || 'None'}
          </AppText>
        </View>

        <View style={[styles.vitalItem, styles.vitalItemFull]}>
          <AppText variant="caption" color="rgba(255, 255, 255, 0.65)" style={styles.vitalLabel}>
            VET CLINIC
          </AppText>
          <AppText variant="bodySmall" weight="700" color="#FFFFFF" numberOfLines={1}>
            {pet.vetClinic || 'Not specified'}
          </AppText>
        </View>
      </View>

      {/* Quick Status Badges Bar */}
      <View style={styles.badgesBar}>
        {/* Vaccine Status Pill */}
        <View style={[styles.statusPill, { backgroundColor: vBadge.bg }]}>
          <Ionicons name={vBadge.icon} size={13} color={vBadge.text} />
          <AppText variant="caption" weight="700" color={vBadge.text} style={styles.statusPillText}>
            {vBadge.label}
          </AppText>
        </View>

        {/* Active Meds Pill */}
        <View style={[styles.statusPill, styles.medsPill]}>
          <MaterialCommunityIcons name="pill" size={13} color="#0D47A1" />
          <AppText variant="caption" weight="700" color="#0D47A1" style={styles.statusPillText}>
            {stats.activeMedsCount > 0
              ? `${stats.activeMedsCount} Active Med${stats.activeMedsCount > 1 ? 's' : ''}`
              : '0 Active Meds'}
          </AppText>
        </View>

        {/* Last Groomed Pill */}
        <View style={[styles.statusPill, styles.groomPill]}>
          <MaterialCommunityIcons name="content-cut" size={13} color="#4A148C" />
          <AppText variant="caption" weight="700" color="#4A148C" style={styles.statusPillText}>
            Groomed: {formatGroomedDate(stats.lastGroomedDate)}
          </AppText>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: Spacing.md,
  },
  watermark: {
    position: 'absolute',
    right: -15,
    bottom: -15,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#E8F5E9',
  },
  avatarPlaceholder: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFF176',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petIdentity: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passportTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  passportTagText: {
    marginLeft: 4,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  showVetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  vitalItem: {
    width: '48%',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  vitalItemFull: {
    width: '98%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 6,
    marginTop: 2,
  },
  vitalLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  badgesBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    gap: 4,
  },
  medsPill: {
    backgroundColor: '#E3F2FD',
  },
  groomPill: {
    backgroundColor: '#F3E5F5',
  },
  statusPillText: {
    fontSize: 11,
  },
});
