import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { SkeletonPetProfileCard } from '@/components/ui/skeletons';
import { HomeTheme, Spacing } from '../../constants/theme';

interface PetProfileCardProps {
  name?: string;
  breed?: string;
  species?: string;
  age?: string;
  gender?: string | null;
  weight?: string;
  activity?: string;
  health?: string;
  mood?: string;
  imageSource?: number;
  imageUrl?: string;
  loading?: boolean;
  isBirthdayToday?: boolean;
  onPress?: () => void;
  onEditPress?: () => void;
  isPremium?: boolean;
}

export function PetProfileCard({
  name = 'Your pet',
  breed = '—',
  species = '—',
  age = '—',
  gender = '—',
  weight = '—',
  activity = '—',
  health = '—',
  mood = '—',
  imageSource,
  imageUrl,
  loading = false,
  isBirthdayToday = false,
  onPress,
  onEditPress,
  isPremium = false,
}: PetProfileCardProps) {
  const displayImage = imageUrl ? { uri: imageUrl } : (imageSource ? imageSource : null);
  const CardWrapper = onPress ? TouchableOpacity : View;
  const cardProps = onPress ? { onPress, activeOpacity: 0.92 } : {};

  if (loading) {
    return <SkeletonPetProfileCard />;
  }

  // Deep Forest Emerald gradient for Premium with gold trim, vibrant brand green for Free (same as header)
  const gradientColors = isPremium 
    ? (['#0E3821', '#184F2E', '#267343'] as const)
    : (['#3A8F3B', '#5CB35D'] as const);

  const shadowColor = isPremium ? '#082113' : '#1B5E20';
  const borderColor = isPremium ? '#D4A017' : 'rgba(255, 255, 255, 0.16)';

  // Ensure gender is a safe string before processing
  const safeGender = gender || '—';
  const genderIconName = safeGender.toLowerCase() === 'male' 
    ? 'gender-male' 
    : safeGender.toLowerCase() === 'female' 
    ? 'gender-female' 
    : 'gender-male-female';

  const badgeIconColor = isPremium ? '#184F2E' : '#429B46';
  const goldColor = '#FFF176';           // bright lemon gold — pops on dark amber
  const textAccentColor = isPremium ? '#FFF9E6' : '#FFFFFF';

  return (
    <CardWrapper style={[styles.card, { shadowColor }]} {...cardProps}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient, 
          { 
            borderWidth: isPremium ? 1.5 : 1, 
            borderColor 
          }
        ]}
      >
        {/* Soft Background Accent Circles */}
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />

        {/* Large Decorative Paw Watermark */}
        <MaterialCommunityIcons name="paw" size={72} color="rgba(255, 255, 255, 0.07)" style={styles.watermark} />

        {/* Top-Right Absolute Positioned Premium / Free Pill and Edit Button */}
        <View style={styles.rightSection}>
          {isPremium ? (
            <View style={styles.premiumPill}>
              <MaterialCommunityIcons name="crown" size={10} color={goldColor} style={{ marginRight: 3 }} />
              <AppText variant="caption" weight="800" color={textAccentColor} style={styles.pillText}>
                PREMIUM
              </AppText>
            </View>
          ) : (
            <View style={styles.freePill}>
              <AppText variant="caption" weight="800" color="rgba(255,255,255,0.9)" style={styles.pillText}>
                FREE
              </AppText>
            </View>
          )}
          {onEditPress && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onEditPress();
              }}
              style={styles.editCardButton}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="pencil" size={13} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.top}>
          <View style={styles.avatarContainer}>
            {displayImage ? (
              <Image 
                source={displayImage} 
                style={[
                  styles.avatar, 
                  { borderColor: isPremium ? '#D4A017' : 'rgba(255,255,255,0.95)' }
                ]} 
                contentFit="cover" 
                cachePolicy="disk"
              />
            ) : (
              <View 
                style={[
                  styles.avatar, 
                  styles.placeholderAvatar,
                  { borderColor: isPremium ? '#D4A017' : 'rgba(255,255,255,0.95)' }
                ]}
              >
                <MaterialCommunityIcons name="paw" size={32} color="#FFFFFF" />
              </View>
            )}
            <View style={[styles.avatarBadge, { borderColor: isPremium ? '#D4A017' : '#429B46' }]}>
              <MaterialCommunityIcons name="swap-horizontal" size={11} color={badgeIconColor} />
            </View>
          </View>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <AppText variant="h3" weight="800" color={HomeTheme.white} style={styles.name}>
                {name}
              </AppText>
              {isPremium && (
                <View style={styles.crownBadge}>
                  <MaterialCommunityIcons name="crown" size={12} color={goldColor} />
                </View>
              )}
            </View>
            <AppText variant="bodySmall" color={HomeTheme.white} style={styles.meta} numberOfLines={1}>
              {isBirthdayToday ? `🎂 Birthday today · ${breed}` : `${breed} · ${age}`}
            </AppText>
          </View>
        </View>

        <View style={[styles.divider, isPremium && { backgroundColor: 'rgba(212, 160, 23, 0.4)' }]} />

        <View style={styles.stats}>
          <StatColumn 
            label="Species" 
            value={species ? species.charAt(0).toUpperCase() + species.slice(1).toLowerCase() : '—'} 
            icon="paw" 
            isPremium={isPremium} 
          />
          <StatColumn 
            label="Weight" 
            value={health} 
            icon="weight-kilogram" 
            isPremium={isPremium} 
          />
          <StatColumn 
            label="Gender" 
            value={safeGender !== '—' ? safeGender.charAt(0).toUpperCase() + safeGender.slice(1).toLowerCase() : '—'} 
            icon={genderIconName as any} 
            isPremium={isPremium} 
          />
        </View>
      </LinearGradient>
    </CardWrapper>
  );
}

interface StatColumnProps {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  isPremium?: boolean;
}

function StatColumn({ label, value, icon, isPremium = false }: StatColumnProps) {
  return (
    <View style={[styles.statCol, isPremium && { borderColor: 'rgba(212, 160, 23, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
      <View style={styles.statLabelRow}>
        <MaterialCommunityIcons name={icon} size={12} color="rgba(255,255,255,0.8)" style={styles.statIcon} />
        <AppText variant="caption" weight="800" color="rgba(255,255,255,0.7)" style={styles.statLabel}>
          {label}
        </AppText>
      </View>
      <AppText variant="bodySmall" color={HomeTheme.white} weight="800">
        {value}
      </AppText>
    </View>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  android: { elevation: 6 },
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: Spacing.sm,
    position: 'relative',
    ...cardShadow,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 20,
    padding: 16,
    position: 'relative',
  },
  bgCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -40,
    right: -30,
  },
  bgCircle2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: -30,
    left: -20,
  },
  watermark: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  crownBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    padding: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  placeholderAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCardButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A2B4E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 1.2,
  },
  info: {
    flex: 1,
    paddingRight: 64, // Large padding to avoid overlay clash with top-right pill
  },
  rightSection: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 220, 80, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 220, 80, 0.45)',
  },
  freePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  pillText: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  meta: {
    opacity: 0.95,
    marginTop: 1,
    marginBottom: Spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: Spacing.sm,
    zIndex: 2,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
    gap: 8,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statIcon: {
    marginRight: 3,
  },
  statLabel: {
    opacity: 0.85,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
