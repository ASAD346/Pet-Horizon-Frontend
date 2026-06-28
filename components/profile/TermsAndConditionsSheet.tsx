import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';
import { ProfileModalShell } from './ProfileModalShell';

const SECTIONS = [
  {
    title: 'Subscription & Billing',
    body:
      'Premium subscriptions are billed in advance on a monthly or yearly basis. Prices shown in the app are before applicable taxes. Your payment method is charged at the start of each billing period.',
  },
  {
    title: 'Auto-Renewal',
    body:
      'Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Renewal charges use the same payment method on file.',
  },
  {
    title: 'Cancellation & Refunds',
    body:
      'You may cancel anytime from Billing & Subscription in My Hub. Cancellation takes effect at the end of the current billing period. Refunds are handled according to platform store policies unless required otherwise by law.',
  },
  {
    title: 'Premium Features',
    body:
      'Premium unlocks additional pets, advanced stats, and enhanced reminders. Feature availability may change as the product evolves; core care tracking remains available on free accounts.',
  },
  {
    title: 'Privacy Policy',
    body:
      'We use your account and pet data to provide scheduling, reminders, and subscription services. We do not sell personal data. Contact support for data or account deletion requests.',
  },
];

interface TermsAndConditionsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function TermsAndConditionsSheet({ visible, onClose }: TermsAndConditionsSheetProps) {
  return (
    <ProfileModalShell visible={visible} onClose={onClose} title="Terms & Conditions">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <AppText variant="bodySmall" color={ProfileTheme.textMuted} style={styles.intro}>
          Please read these terms carefully, especially sections related to payments and
          subscriptions.
        </AppText>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <AppText variant="body" weight="700" color={ProfileTheme.text}>
              {section.title}
            </AppText>
            <AppText variant="bodySmall" color={ProfileTheme.textMuted} style={styles.sectionBody}>
              {section.body}
            </AppText>
          </View>
        ))}
      </ScrollView>
    </ProfileModalShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  intro: {
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: ProfileTheme.background,
    borderRadius: Radius.lg,
    gap: 6,
  },
  sectionBody: {
    lineHeight: 20,
  },
});
