import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';

interface ReminderCardProps {
  variant: 'warning' | 'info';
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction?: () => void;
}

function ReminderCard({ variant, title, subtitle, actionLabel, onAction }: ReminderCardProps) {
  const isWarning = variant === 'warning';

  return (
    <View style={[styles.card, isWarning ? styles.cardWarning : styles.cardInfo]}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={isWarning ? 'warning' : 'medical'}
          size={18}
          color={isWarning ? HomeTheme.warningAccent : HomeTheme.infoAccent}
        />
      </View>
      <AppText variant="bodySmall" weight="800" color={HomeTheme.text} numberOfLines={1}>
        {title}
      </AppText>
      <AppText variant="caption" color={HomeTheme.textMuted} numberOfLines={2} style={styles.subtitle}>
        {subtitle}
      </AppText>
      <TouchableOpacity
        style={[styles.actionBtn, isWarning ? styles.actionWarning : styles.actionInfo]}
        onPress={onAction}
        activeOpacity={0.85}
      >
        <AppText variant="caption" weight="700" color={HomeTheme.white}>
          {actionLabel}
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

interface ReminderCardsRowProps {
  lowStockVisible?: boolean;
  lowStockSubtitle?: string;
  onLowStockPress?: () => void;
  onRestockPress?: () => void;
  medicalVisible?: boolean;
  medicalTitle?: string;
  medicalSubtitle?: string;
  onMedicalPress?: () => void;
}

export function ReminderCardsRow({
  lowStockVisible = false,
  lowStockSubtitle = 'Stock is below your threshold.',
  onLowStockPress,
  onRestockPress,
  medicalVisible = false,
  medicalTitle = 'Upcoming visit',
  medicalSubtitle = 'Check medical records',
  onMedicalPress,
}: ReminderCardsRowProps) {
  if (!lowStockVisible && !medicalVisible) {
    return null;
  }

  return (
    <View style={styles.row}>
      {lowStockVisible ? (
        <ReminderCard
          variant="warning"
          title="Low stock"
          subtitle={lowStockSubtitle}
          actionLabel="Restock"
          onAction={onRestockPress ?? onLowStockPress}
        />
      ) : null}
      {medicalVisible ? (
        <ReminderCard
          variant="info"
          title={medicalTitle}
          subtitle={medicalSubtitle}
          actionLabel="View details"
          onAction={onMedicalPress}
        />
      ) : null}
    </View>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  android: { elevation: 2 },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  card: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    minHeight: 130,
    ...cardShadow,
  },
  cardWarning: {
    backgroundColor: HomeTheme.warningBg,
  },
  cardInfo: {
    backgroundColor: HomeTheme.infoBg,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: HomeTheme.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    flex: 1,
    marginTop: 2,
    marginBottom: Spacing.sm,
    lineHeight: 15,
  },
  actionBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  actionWarning: {
    backgroundColor: HomeTheme.teal,
  },
  actionInfo: {
    backgroundColor: HomeTheme.infoAccent,
  },
});
