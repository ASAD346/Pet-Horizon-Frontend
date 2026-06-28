import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';
import { ProfileModalShell } from './ProfileModalShell';

const SECTIONS = [
  {
    title: 'Information Collection',
    body:
      'We collect personal details such as your name, email, and profile photo to establish your account. We also store pet profiles, including names, species, health records, and care schedules.',
  },
  {
    title: 'Data Usage',
    body:
      'Your data is used solely to facilitate pet schedules, reminders, and user profiles. Analytics data may be collected in anonymized aggregates to improve app performance.',
  },
  {
    title: 'Third-Party Services',
    body:
      'We utilize trusted third-party providers for processing subscription payments and authentication (like Google Sign-In). These services strictly handle your data according to their own privacy policies.',
  },
  {
    title: 'Data Security & Storage',
    body:
      'All personal data is encrypted in transit and at rest. We implement modern cloud security standards to protect your profiles from unauthorized access or breaches.',
  },
  {
    title: 'Your Rights & Deletion',
    body:
      'You retain the right to access, edit, or permanently delete your account and all associated pet data. If you delete your account, your data will be permanently wiped from our systems within 30 days.',
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
          We are committed to safeguarding your personal information and pet data. Learn more below.
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
