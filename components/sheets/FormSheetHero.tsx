import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { FormSheetColors, formSheetStyles } from './formSheetStyles';

interface FormSheetHeroProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  accentColor: string;
  accentBg: string;
  title?: string;
  subtitle?: string;
}

export function FormSheetHero({ icon, accentColor, accentBg, title, subtitle }: FormSheetHeroProps) {
  return (
    <View style={[formSheetStyles.hero, { backgroundColor: accentBg, borderColor: `${accentColor}22` }]}>
      <View style={[formSheetStyles.heroIconWrap, { backgroundColor: `${accentColor}18` }]}>
        <MaterialCommunityIcons name={icon} size={24} color={accentColor} />
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
