import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';
import { ProfileModalShell } from './ProfileModalShell';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body:
      'By downloading, installing, or using the PetHorizon mobile application, you agree to comply with and be bound by these Terms & Conditions. If you do not agree to these terms, please do not use the application.',
  },
  {
    title: '2. User Eligibility & Accounts',
    body:
      'You must be at least 13 years of age to create an account on PetHorizon. You are solely responsible for maintaining the confidentiality of your account authentication credentials and for all activities that occur under your profile.',
  },
  {
    title: '3. Google Play Store Subscriptions & Billing',
    body:
      'Premium subscription plans (Monthly and Yearly) are purchased and billed directly through your Google Play Store account. Prices shown are exclusive of applicable local sales taxes, which will be calculated and collected by Google Play. Recurring charges will apply at the start of each billing period (monthly or yearly) until cancelled.',
  },
  {
    title: '4. Auto-Renewal & Cancellation',
    body:
      'Subscriptions will automatically renew for the same duration and price unless auto-renewal is turned off or the subscription is cancelled through your Google Play Store account settings at least 24 hours prior to the end of the current billing cycle. Uninstalling the app does not cancel your subscription.',
  },
  {
    title: '5. Refunds & Purchases',
    body:
      'All transactions are handled securely by Google. Refund requests, payment disputes, or billing questions must be submitted directly through the Google Play Store support console and are subject to Google Play Store Refund Policies.',
  },
  {
    title: '6. Veterinary Advice Disclaimer',
    body:
      'PetHorizon is a tool designed to help you track care logs, log entries, medications, budgets, and scheduling for your pets. The content, scheduling recommendations, and tracking tools provided in the app do not constitute professional veterinary medical advice, diagnosis, or treatment. Always consult a licensed veterinarian for health-related questions.',
  },
  {
    title: '7. Data Policy & Conduct',
    body:
      'You represent that you own or have the right to input all information, text, notes, and photos you add to the app. You agree not to upload offensive, illegal, or copy-protected content. We reserve the right to delete content or suspend accounts that violate these guidelines.',
  },
  {
    title: '8. Contact Information',
    body:
      'For support inquiries, legal notices, or feedback, please reach out to us at support@pethorizon.app.',
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
          Last Updated: July 2026. Please read these Terms & Conditions carefully before activating premium plans or logging pet records.
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
    lineHeight: 18,
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
