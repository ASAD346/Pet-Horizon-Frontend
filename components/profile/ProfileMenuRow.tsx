import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { homePillCard } from '@/components/home/homeStyles';
import { HomeTheme, Spacing } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';

interface ProfileMenuRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
  iconColor?: string;
  iconBg?: string;
}

export function ProfileMenuRow({
  icon,
  title,
  subtitle,
  onPress,
  iconColor = '#2E7D32',
  iconBg = 'rgba(46, 125, 50, 0.08)',
}: ProfileMenuRowProps) {
  return (
    <TouchableOpacity style={[homePillCard.card, styles.row]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.textBlock}>
        <AppText variant="body" weight="700" color={ProfileTheme.text}>
          {title}
        </AppText>
        <AppText variant="caption" color={ProfileTheme.textMuted}>
          {subtitle}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={HomeTheme.textMuted} />
    </TouchableOpacity>
  );
}


interface ProfileMenuSectionProps {
  title: string;
  children: React.ReactNode;
}

export function ProfileMenuSection({ title, children }: ProfileMenuSectionProps) {
  return (
    <View style={styles.section}>
      <AppText variant="bodySmall" weight="700" color={ProfileTheme.textMuted} style={styles.sectionTitle}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  row: {
    paddingVertical: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
});
