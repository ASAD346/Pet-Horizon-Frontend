import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { FormSheetColors, formSheetStyles } from './formSheetStyles';
import { useAuth } from '@/hooks/useAuth';

interface FormSheetHeroProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  accentColor: string;
  accentBg: string;
  title?: string;
  subtitle?: string;
}

export function FormSheetHero({ icon, title, subtitle }: FormSheetHeroProps) {
  const { user } = useAuth();
  const isPremium = user?.premiumStatus === 'premium';

  const brandColor = isPremium ? '#184F2E' : '#3A8F3B';
  const brandBg = isPremium ? '#E8F5E9' : '#EEF8EE';

  return (
    <View style={[formSheetStyles.hero, { backgroundColor: brandBg, borderColor: `${brandColor}22` }]}>
      <View style={[formSheetStyles.heroIconWrap, { backgroundColor: `${brandColor}18` }]}>
        <MaterialCommunityIcons name={icon} size={24} color={brandColor} />
      </View>
      <View style={formSheetStyles.heroText}>
        {title ? (
          <AppText variant="body" weight="800" color={FormSheetColors.text}>
            {title}
          </AppText>
        ) : null}
        {subtitle ? (
          <AppText
            variant={title ? 'caption' : 'bodySmall'}
            weight={title ? '400' : '500'}
            color={FormSheetColors.label}
            style={styles.subtitle}
          >
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    lineHeight: 18,
  },
});
