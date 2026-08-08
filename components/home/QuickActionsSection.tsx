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
  onPermissionDenied?: (actionLabel: string) => void;
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

export const QuickActionsSection = React.memo(function QuickActionsSection({
  onLogFoodPress,
  onLogWalkPress,
  onMedicinePress,
  onGroomingPress,
  onVaccinationPress,
  groomingVisible = true,
  canView,
  canEdit,
  isPremium = false,
  onPermissionDenied,
}: QuickActionsSectionProps) {
  const handlers = {
    onLogFoodPress,
    onLogWalkPress,
    onMedicinePress,
    onGroomingPress,
    onVaccinationPress,
  };

  const visibleActions = ACTIONS.filter((action) => {
    // Hide species-incompatible modules (e.g. Grooming for species that don't support it)
    if (action.label === 'Grooming' && !groomingVisible) return false;
    // Keep modules visible regardless of edit/view permissions (they will be disabled)
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

  const ACTION_COLORS: Record<string, { color: string; bg: string; border: string; plusBg: string; plusColor: string }> = {
    'Log Food': { color: '#D97706', bg: 'rgba(217, 119, 6, 0.08)', border: 'rgba(217, 119, 6, 0.15)', plusBg: 'rgba(217, 119, 6, 0.12)', plusColor: '#D97706' },
    'Log Walk': { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(37, 99, 235, 0.15)', plusBg: 'rgba(37, 99, 235, 0.12)', plusColor: '#2563EB' },
    'Medicine': { color: '#9333EA', bg: 'rgba(147, 51, 234, 0.08)', border: 'rgba(147, 51, 234, 0.15)', plusBg: 'rgba(147, 51, 234, 0.12)', plusColor: '#9333EA' },
    'Grooming': { color: '#0D9488', bg: 'rgba(13, 148, 136, 0.08)', border: 'rgba(13, 148, 136, 0.15)', plusBg: 'rgba(13, 148, 136, 0.12)', plusColor: '#0D9488' },
    'Vaccination': { color: '#DB2777', bg: 'rgba(219, 39, 119, 0.08)', border: 'rgba(219, 39, 119, 0.15)', plusBg: 'rgba(219, 39, 119, 0.12)', plusColor: '#DB2777' },
  };

  const cardColors = ['#FFFFFF', '#FFFFFF'] as const;

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
          const moduleId = QUICK_ACTION_MODULES[action.label];
          const isDisabled = moduleId ? (canView ? !canView(moduleId) : false) : false;

          const colors = ACTION_COLORS[action.label] || {
            color: '#2E7D32',
            bg: 'rgba(46, 125, 50, 0.06)',
            border: 'rgba(46, 125, 50, 0.12)',
            plusBg: 'rgba(46, 125, 50, 0.08)',
            plusColor: '#2E7D32',
          };

          const finalBorderColor = isDisabled
            ? 'rgba(0, 0, 0, 0.08)'
            : (isPremium ? 'rgba(212, 160, 23, 0.35)' : colors.border);

          const finalTint = isDisabled ? 'rgba(0, 0, 0, 0.4)' : colors.color;
          const finalIconCircleBg = isDisabled ? 'rgba(0, 0, 0, 0.04)' : colors.bg;
          const finalPlusBg = isDisabled ? 'rgba(0, 0, 0, 0.06)' : colors.plusBg;
          const finalPlusColor = isDisabled ? 'rgba(0, 0, 0, 0.5)' : colors.plusColor;

          return (
            <TouchableOpacity
              key={action.label}
              activeOpacity={isDisabled ? 0.55 : 0.8}
              disabled={isDisabled}
              onPress={() => {
                if (!isDisabled && onPress) {
                  handlePress(onPress);
                }
              }}
              style={[styles.cardWrapper, isDisabled && { opacity: 0.55 }]}
            >
              <LinearGradient
                colors={cardColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.tileCard, { borderColor: finalBorderColor }]}
              >
                {/* Header elements: Icon container on left, plus/lock icon on right */}
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: finalIconCircleBg }]}>
                    <MaterialCommunityIcons name={action.icon} size={16} color={finalTint} />
                  </View>
                  <View style={[styles.plusButton, { backgroundColor: finalPlusBg }]}>
                    {isDisabled ? (
                      <Feather name="lock" size={9} color={finalPlusColor} style={styles.plusIcon} />
                    ) : (
                      <Feather name="plus" size={10} color={finalPlusColor} style={styles.plusIcon} />
                    )}
                  </View>
                </View>

                {/* Footer elements: Action title and subtext */}
                <View style={styles.textContainer}>
                  <AppText variant="bodySmall" weight="800" color={isDisabled ? 'rgba(0,0,0,0.5)' : finalTint} style={styles.label}>
                    {action.displayLabel}
                  </AppText>
                  <AppText variant="caption" weight="500" color={isDisabled ? 'rgba(0,0,0,0.35)' : finalTint} style={styles.subLabel}>
                    {isDisabled ? 'Restricted' : action.subText}
                  </AppText>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

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
