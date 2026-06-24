import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AppText } from '../ui/AppText';
import { SectionHeader } from './SectionHeader';
import { QUICK_ACTION_MODULES } from '@/lib/pet/petPermissionAccess';
import type { AppModuleId } from '@/lib/pet/petPermissionAccess';
import { HomeTheme, Spacing } from '../../constants/theme';

type ActionIcon = 'silverware-fork-knife' | 'walk' | 'pill' | 'content-cut' | 'needle';

interface ActionItem {
  label: string;
  displayLabel: string;
  icon: ActionIcon;
  subText: string;
}

const ACTIONS: ActionItem[] = [
  {
    label: 'Log Food',
    displayLabel: 'Food',
    icon: 'silverware-fork-knife',
    subText: 'Log meal',
  },
  {
    label: 'Log Walk',
    displayLabel: 'Walk',
    icon: 'walk',
    subText: 'Track route',
  },
  {
    label: 'Medicine',
    displayLabel: 'Meds',
    icon: 'pill',
    subText: 'Add dose',
  },
  {
    label: 'Grooming',
    displayLabel: 'Grooming',
    icon: 'content-cut',
    subText: 'Style pet',
  },
  {
    label: 'Vaccination',
    displayLabel: 'Vaccine',
    icon: 'needle',
    subText: 'Add shot',
  },
];

interface QuickActionsSectionProps {
  onLogFoodPress?: () => void;
  onLogWalkPress?: () => void;
  onMedicinePress?: () => void;
  onGroomingPress?: () => void;
  onVaccinationPress?: () => void;
  groomingVisible?: boolean;
  canView?: (moduleId: AppModuleId) => boolean;
  canEdit?: (moduleId: AppModuleId) => boolean;
  isPremium?: boolean;
}

const ACTION_HANDLERS: Record<
  string,
  'onLogFoodPress' | 'onLogWalkPress' | 'onMedicinePress' | 'onGroomingPress' | 'onVaccinationPress'
> = {
  'Log Food': 'onLogFoodPress',
  'Log Walk': 'onLogWalkPress',
  Medicine: 'onMedicinePress',
  Grooming: 'onGroomingPress',
  Vaccination: 'onVaccinationPress',
};

export function QuickActionsSection({
  onLogFoodPress,
  onLogWalkPress,
  onMedicinePress,
  onGroomingPress,
  onVaccinationPress,
  groomingVisible = true,
  canView,
  canEdit,
  isPremium = false,
}: QuickActionsSectionProps) {
  const handlers = {
    onLogFoodPress,
    onLogWalkPress,
    onMedicinePress,
    onGroomingPress,
    onVaccinationPress,
  };

  const visibleActions = ACTIONS.filter((action) => {
    if (action.label === 'Grooming' && !groomingVisible) return false;
    const moduleId = QUICK_ACTION_MODULES[action.label];
    if (!moduleId) return true;
    if (canEdit) return canEdit(moduleId);
    if (canView) return canView(moduleId);
    return true;
  });

  if (visibleActions.length === 0) {
    return null;
  }

  const handlePress = (onPress?: () => void) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onPress) {
      onPress();
    }
  };

  // Dynamic color palette based on premium status
  const cardColors = ['#FFFFFF', '#FFFFFF'] as const; // White cards to pop out from the soft green background

  const cardBorderColor = isPremium
    ? 'rgba(212, 160, 23, 0.35)'  // Gold trim for premium
    : 'rgba(46, 125, 50, 0.12)';  // Soft green border

  const cardTint = isPremium
    ? '#184F2E'  // Deep emerald green text/icons for premium
    : '#2E7D32';  // Standard brand green text/icons

  const cardPlusBg = isPremium
    ? 'rgba(212, 160, 23, 0.12)'  // Translucent gold indicator
    : 'rgba(46, 125, 50, 0.08)';  // Translucent green indicator

  const plusIconColor = isPremium
    ? '#D4A017'  // Gold plus
    : '#2E7D32';  // Green plus

  const iconCircleBg = isPremium
    ? 'rgba(212, 160, 23, 0.08)'
    : 'rgba(46, 125, 50, 0.06)';

  return (
    <View style={styles.section}>
      <SectionHeader title="Quick Actions" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {visibleActions.map((action) => {
          const handlerKey = ACTION_HANDLERS[action.label];
          const onPress = handlerKey ? handlers[handlerKey] : undefined;

          return (
            <TouchableOpacity
              key={action.label}
              activeOpacity={0.8}
              onPress={() => handlePress(onPress)}
              style={styles.cardWrapper}
            >
              <LinearGradient
                colors={cardColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.tileCard, { borderColor: cardBorderColor }]}
              >
                {/* Header elements: Icon container on left, plus icon on right */}
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: iconCircleBg }]}>
                    <MaterialCommunityIcons name={action.icon} size={16} color={cardTint} />
                  </View>
                  <View style={[styles.plusButton, { backgroundColor: cardPlusBg }]}>
                    <Feather name="plus" size={10} color={plusIconColor} style={styles.plusIcon} />
                  </View>
                </View>

                {/* Footer elements: Action title and subtext */}
                <View style={styles.textContainer}>
                  <AppText variant="bodySmall" weight="800" color={cardTint} style={styles.label}>
                    {action.displayLabel}
                  </AppText>
                  <AppText variant="caption" weight="500" color={cardTint} style={styles.subLabel}>
                    {action.subText}
                  </AppText>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.md,
  },
  scrollContainer: {
    paddingLeft: 4,
    paddingRight: Spacing.md,
    paddingVertical: 8,
    gap: 10,
  },
  cardWrapper: {
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  tileCard: {
    width: 82,
    height: 78,
    borderRadius: 18,
    padding: 8,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontWeight: 'bold',
  },
  textContainer: {
    width: '100%',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 1,
  },
  subLabel: {
    fontSize: 8,
    lineHeight: 10,
    opacity: 0.6,
  },
});

