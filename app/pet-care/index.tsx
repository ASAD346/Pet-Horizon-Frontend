import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';

const HUB_ITEMS = [
  {
    title: 'Activity Timeline',
    subtitle: 'Daily care log — separate from journal',
    icon: 'timeline-clock-outline' as const,
    color: '#5CB35D',
    route: '/pet-care/activity-timeline',
  },
  {
    title: 'Inventory',
    subtitle: 'Stock, restock, and low-stock alerts',
    icon: 'package-variant' as const,
    color: '#F5A623',
    route: '/pet-care/inventory',
  },
  {
    title: 'Health Metrics',
    subtitle: 'Weight, activity, and sleep',
    icon: 'heart-pulse' as const,
    color: '#E91E8C',
    route: '/pet-care/health',
  },
  {
    title: 'Medical Records',
    subtitle: 'Vet visits and treatments',
    icon: 'medical-bag' as const,
    color: '#5B9BD5',
    route: '/pet-care/medical',
  },
];

export default function PetCareHubScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ProfileScreenHeader title="Pet Care" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="bodySmall" color={HomeTheme.textMuted} style={styles.intro}>
          Track daily activities, supplies, health trends, and medical history for your active pet.
        </AppText>
        {HUB_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push(item.route as never)}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${item.color}22` }]}>
              <MaterialCommunityIcons name={item.icon} size={26} color={item.color} />
            </View>
            <View style={styles.cardText}>
              <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
                {item.title}
              </AppText>
              <AppText variant="caption" color={HomeTheme.textMuted}>
                {item.subtitle}
              </AppText>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={HomeTheme.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: HomeTheme.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  intro: {
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HomeTheme.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
});
