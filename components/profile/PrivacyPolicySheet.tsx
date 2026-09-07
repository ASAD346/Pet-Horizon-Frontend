import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { ProfileModalShell } from './ProfileModalShell';

const SECTIONS = [
  {
    title: '1. Overview & Data Controller',
    body: 'PetHorizon ("we", "our", or "us") is dedicated to protecting the privacy and security of your personal information. This Privacy Policy explains what personal and pet-related data we collect, why we collect it, how it is processed and protected, and the rights you have concerning your information when using the PetHorizon mobile application and associated backend services.',
  },
  {
    title: '2. Information We Collect & Why',
    body: 'We collect the following categories of information strictly to provide and enhance application functionality:\n\n• Account & Authentication Data: When you register or sign in using Google Sign-In / OAuth or email credentials, we receive your name, email address, profile picture URL, and unique account identifier. We do not access your Google password or private credentials.\n\n• Pet Profiles & Care Logs: Information you enter about your pets (names, species, breeds, gender, date of birth, weight logs, vaccinations, medication reminders, medical histories, and dietary preferences).\n\n• Financial & Budget Records: Expense entries, care budgets, and transaction categories you voluntarily track within the app.\n\n• User-Generated Media: Photos of pets or profile images you choose to upload.',
  },
  {
    title: '3. Device Permissions & System Access',
    body: 'PetHorizon only requests device permissions necessary for specific in-app features:\n\n• Camera & Media Library / Storage: Required exclusively when you choose to take or upload photos for pet avatars and user profiles. We do not scan or access your private photos or media library without explicit user interaction.\n\n• Push & Local Notifications: Used to alert you about scheduled pet care tasks, feeding routines, vet appointments, and medication schedules. You can toggle notifications off at any time in your device settings.',
  },
  {
    title: '4. Third-Party Services & Google OAuth',
    body: 'We integrate industry-standard third-party services that adhere to rigorous security standards:\n\n• Google Identity Services (OAuth 2.0): Used for secure authentication. PetHorizon complies with the Google API Services User Data Policy, including Limited Use requirements.\n\n• Google Play Billing: Subscription and in-app purchase transactions are processed securely by Google Play. We never receive or store your credit card numbers, bank accounts, or financial payment details.\n\n• Cloud Infrastructure & Hosting: Secure cloud databases and storage for synchronizing your pet logs.\n\nWe do not sell, rent, trade, or monetize your personal or pet data to third parties, data brokers, or advertising networks.',
  },
  {
    title: '5. Data Security & Encryption',
    body: 'We employ industry-standard administrative, physical, and technical safeguards. All data exchanged between the PetHorizon app and our servers is encrypted in transit using Transport Layer Security (TLS 1.2/1.3) and encrypted at rest in secure database infrastructure. Access to backend systems is restricted by strict role-based authentication.',
  },
  {
    title: '6. User Rights, Data Retention & Complete Account Deletion',
    body: 'In strict compliance with Google Play Developer Policy and global data protection regulations (GDPR/CCPA):\n\n• Access & Update: You can view and edit your profile and pet details directly within the app.\n\n• Permanent Account & Data Deletion: You can permanently delete your account at any time directly in the app via Profile > Account Settings > Delete Account. Upon deletion confirmation, your entire user profile, authentication credentials, registered pets, care logs, journal entries, uploaded media, and financial tracking data are permanently and irreversibly purged from our live databases and cloud storage.',
  },
  {
    title: "7. Children's Privacy",
    body: 'PetHorizon is not directed at children under the age of 13 (or 16 in certain jurisdictions). We do not knowingly collect or solicit personal data from children. If we learn that we have inadvertently collected data from a child without verified parental consent, we will promptly delete that information from our records.',
  },
  {
    title: '8. Changes to This Privacy Policy',
    body: 'We may update this Privacy Policy from time to time to reflect modifications in our features, legal requirements, or Google policies. Material changes will be communicated within the app or through the "Last Updated" revision date at the top of this policy.',
  },
  {
    title: '9. Contact Information & Data Protection Inquiries',
    body: 'If you have any questions, concerns, requests regarding data deletion, or inquiries about our data handling practices, please contact us:\n\n• Email: pethorizon2026@gmail.com\n• Application: PetHorizon Support Team',
  },
];

interface PrivacyPolicySheetProps {
  visible: boolean;
  onClose: () => void;
}

export function PrivacyPolicySheet({ visible, onClose }: PrivacyPolicySheetProps) {
  return (
    <ProfileModalShell visible={visible} onClose={onClose} title="Privacy Policy">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.introBanner}>
          <AppText variant="bodySmall" weight="700" color="#334155" style={styles.introTitle}>
            Last Updated: September 2026
          </AppText>
          <AppText variant="caption" color="#475569" style={styles.introSub}>
            This Privacy Policy describes how PetHorizon collects, uses, protects, and handles your personal information and pet data.
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
