import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';
import { ProfileModalShell } from './ProfileModalShell';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body:
      'We collect personal details you provide directly to us: your full name, email address, profile image, and authentication tokens. We also collect and store pet profiles (names, species, breeds, weight histories, and age) and all associated care schedules, budget configurations, and journal records.',
  },
  {
    title: '2. Device Permissions & Diagnostics',
    body:
      'To provide core application features, we request specific permissions: Camera and Media Library access (to upload pet and profile pictures) and Push Notifications (to deliver smart schedule alerts). Anonymized device logs, operating system versions, and app usage metrics may be collected to fix bugs and improve performance.',
  },
  {
    title: '3. Third-Party Integrations & Payments',
    body:
      'We use trusted third parties to facilitate core services, including Google Play Billing Services for managing in-app purchases and Firebase/Google Services for account authentication and push notifications. We do not sell your personal data to advertisers or third parties.',
  },
  {
    title: '4. Data Security & Storage',
    body:
      'Your personal and pet care information is encrypted during transit (using TLS) and at rest on secure cloud servers. We implement strict server-side access controls to protect your data against unauthorized access, loss, or leakage.',
  },
  {
    title: '5. Account Deletion & Data Control',
    body:
      'In compliance with Google Play Developer policies, you have complete control over your data. You can edit your profile information or delete your account permanently directly within the app settings. Account deletion immediately and permanently purges your user profile, registered pets, care logs, journal entries, and financial records from our active servers.',
  },
  {
    title: '6. Children\'s Privacy',
    body:
      'Our services are not designed for or targeted at children under the age of 13. We do not knowingly collect personal information from individuals under 13. If you become aware that a child has provided us with personal information, please contact us immediately.',
  },
  {
    title: '7. Contact & Support',
    body:
      'If you have any questions or feedback regarding this Privacy Policy or our data practices, please email us at support@pethorizon.app.',
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
        <AppText variant="bodySmall" color={ProfileTheme.textMuted} style={styles.intro}>
          Last Updated: July 2026. This Privacy Policy describes how PetHorizon collects, uses, protects, and handles your personal information and pet data.
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
