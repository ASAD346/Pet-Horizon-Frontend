import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { ProfileModalShell } from './ProfileModalShell';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By downloading, installing, accessing, or using the PetHorizon mobile application and services, you agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree to these terms, you must immediately discontinue using the application.',
  },
  {
    title: '2. User Accounts & Google Authentication',
    body: 'You must be at least 13 years of age (or the minimum legal age in your territory) to create an account. You may register using Google Sign-In or email credentials. You are responsible for safeguarding your login credentials and for all activities conducted under your account. You agree to notify us immediately of any unauthorized access or breach of security.',
  },
  {
    title: '3. Subscriptions, In-App Purchases & Google Play Billing',
    body: '• Billing Mechanism: All digital purchases, monthly plans, and annual premium subscriptions within PetHorizon are processed exclusively through Google Play In-App Billing.\n\n• Payment & Taxes: Payment will be charged to your Google Play account at confirmation of purchase. Prices are subject to applicable local taxes, managed and collected directly by Google Play.\n\n• Automatic Renewal: Subscriptions automatically renew unless auto-renew is cancelled at least 24 hours prior to the end of the current billing cycle.\n\n• Cancellation: You can manage or cancel your subscription at any time via your Google Play Store account settings (Google Play Store > Subscriptions > PetHorizon). Uninstalling or deleting the app does not automatically cancel your Google Play subscription.',
  },
  {
    title: '4. Refund Policy',
    body: 'Refund requests and billing disputes are governed by Google Play Store Refund Policies and must be submitted directly through Google Play customer support. PetHorizon does not directly handle payment information or process cash refunds.',
  },
  {
    title: '5. Veterinary & Medical Information Disclaimer',
    body: 'PetHorizon provides tools for pet tracking, medication logging, scheduling, care reminders, and budget management. ALL CONTENT, LOGGING RECOMMENDATIONS, AND NOTIFICATIONS PROVIDED BY PETHORIZON ARE FOR INFORMATIONAL PURPOSES ONLY AND DO NOT CONSTITUTE LICENSED VETERINARY ADVICE, MEDICAL DIAGNOSIS, OR TREATMENT. Always seek the advice of a qualified veterinarian regarding your pet\'s health, symptoms, or medical conditions.',
  },
  {
    title: '6. User Content & Acceptable Use',
    body: 'You retain ownership of any photos, notes, or pet information you upload. By uploading content, you grant PetHorizon a non-exclusive license to host, store, and display such content solely to provide the services to you. You agree not to upload unlawful, offensive, harassing, or copyright-infringing material. We reserve the right to remove content or suspend accounts violating these standards.',
  },
  {
    title: '7. Account Deletion & Termination',
    body: 'You may terminate your account at any time directly in the app settings (Profile > Account Settings > Delete Account). Upon deletion, all personal data, pet records, care histories, and uploaded media are permanently purged from our active systems. We reserve the right to suspend or terminate accounts that breach these terms.',
  },
  {
    title: '8. Limitation of Liability & Warranty Disclaimer',
    body: 'PetHorizon is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. To the maximum extent permitted by applicable law, PetHorizon and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the app.',
  },
  {
    title: '9. Changes to Terms',
    body: 'We reserve the right to revise these Terms & Conditions at any time. Any updates will be effective immediately upon publication in the app with an updated "Last Updated" date.',
  },
  {
    title: '10. Contact & Support',
    body: 'For legal questions, support requests, or feedback regarding these terms, please contact us at:\n\n• Email: pethorizon2026@gmail.com\n• Application: PetHorizon Support Team',
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
            Last Updated: September 2026
          </AppText>
          <AppText variant="caption" color="#475569" style={styles.introSub}>
            Please read these Terms & Conditions carefully before using PetHorizon.
          </AppText>
        </View>

        {SECTIONS.map((section) => {
          return (
            <View key={section.title} style={styles.sectionCard}>
              <AppText variant="body" weight="700" color="#1E293B" style={styles.sectionTitle}>
                {section.title}
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
  sectionTitle: { marginBottom: 4 },
  sectionBody: { lineHeight: 18 },
});
