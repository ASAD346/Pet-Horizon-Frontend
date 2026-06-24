import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';

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
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="h3" weight="800" color={ProfileTheme.text}>
              Privacy Policy
            </AppText>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={ProfileTheme.text} />
            </Pressable>
          </View>

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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: HomeTheme.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ProfileTheme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
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
