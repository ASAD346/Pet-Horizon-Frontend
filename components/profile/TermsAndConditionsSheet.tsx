import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { ProfileModalShell } from './ProfileModalShell';

const SECTIONS = [
  {
    title: 'Acceptance of Terms',
    summary: 'By using this app, you agree to these rules.',
    body: 'By downloading, installing, or using the PetHorizon mobile application, you agree to comply with and be bound by these Terms & Conditions. If you do not agree to these terms, please do not use the application.',
  },
  {
    title: 'User Eligibility & Accounts',
    summary: 'You must be 13 or older. Keep your password safe.',
    body: 'You must be at least 13 years of age to create an account on PetHorizon. You are solely responsible for maintaining the confidentiality of your account authentication credentials and for all activities that occur under your profile.',
  },
  {
    title: 'Google Play Subscriptions & Billing',
    summary: 'Subscriptions are handled and billed securely by Google Play.',
    body: 'Premium subscription plans (Monthly and Yearly) are purchased and billed directly through your Google Play Store account. Prices shown are exclusive of applicable local sales taxes, which will be calculated and collected by Google Play. Recurring charges will apply at the start of each billing period (monthly or yearly) until cancelled.',
  },
  {
    title: 'Auto-Renewal & Cancellation',
    summary: 'Subscriptions auto-renew. Cancel in Google Settings at least 24 hours before renewal.',
    body: 'Subscriptions will automatically renew for the same duration and price unless auto-renewal is turned off or the subscription is cancelled through your Google Play Store account settings at least 24 hours prior to the end of the current billing cycle. Uninstalling the app does not cancel your subscription.',
  },
  {
    title: 'Refunds & Purchases',
    summary: 'Refunds are subject to Google Play Store refund policies.',
    body: 'All transactions are handled securely by Google. Refund requests, payment disputes, or billing questions must be submitted directly through the Google Play Store support console and are subject to Google Play Store Refund Policies.',
  },
  {
    title: 'Veterinary Advice Disclaimer',
    summary: 'This app is a tracker, NOT a vet. Ask a doctor for pet health concerns.',
    body: 'PetHorizon is a tool designed to help you track care logs, log entries, medications, budgets, and scheduling for your pets. The content, scheduling recommendations, and tracking tools provided in the app do not constitute professional veterinary medical advice, diagnosis, or treatment. Always consult a licensed veterinarian for health-related questions.',
  },
  {
    title: 'Data Policy & Conduct',
    summary: 'You own your notes and photos. No illegal or offensive uploads.',
    body: 'You represent that you own or have the right to input all information, text, notes, and photos you add to the app. You agree not to upload offensive, illegal, or copy-protected content. We reserve the right to delete content or suspend accounts that violate these guidelines.',
  },
  {
    title: 'Contact Information',
    summary: 'Email support at: pethorizon2026@gmail.com',
    body: 'For support inquiries, legal notices, or feedback, please reach out to us at pethorizon2026@gmail.com.',
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
        <View style={styles.introBanner}>
          <AppText variant="bodySmall" weight="700" color="#334155" style={styles.introTitle}>
            Last Updated: July 2026
          </AppText>
          <AppText variant="caption" color="#475569" style={styles.introSub}>
            Please read these Terms & Conditions. We have summarized each section to make it simple!
          </AppText>
        </View>

        {SECTIONS.map((section, index) => {
          return (
            <View key={section.title} style={styles.sectionCard}>
              <AppText variant="body" weight="700" color="#1E293B" style={styles.sectionTitle}>
                {index + 1}. {section.title}
              </AppText>
              
              {/* Simplified summary line */}
              <AppText variant="bodySmall" weight="700" color="#D97706" style={styles.summaryText}>
                Summary: {section.summary}
              </AppText>

              <AppText variant="bodySmall" color="#64748B" style={styles.sectionBody}>
                {section.body}
              </AppText>
            </View>
          );
        })}
      </ScrollView>
    </ProfileModalShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  introBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  introTitle: { marginBottom: 4 },
  introSub: { lineHeight: 18 },
  sectionCard: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: { marginBottom: 2 },
  summaryText: {
    marginBottom: 6,
    lineHeight: 18,
  },
  sectionBody: { lineHeight: 18 },
});
