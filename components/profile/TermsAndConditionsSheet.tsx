import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';

const SECTIONS = [
  {
    title: 'Subscription & billing',
    body:
      'Premium subscriptions are billed in advance on a monthly or yearly basis. Prices shown in the app are before applicable taxes. Your payment method is charged at the start of each billing period.',
  },
  {
    title: 'Free trial',
    body:
      'If a free trial is offered, you will not be charged until the trial ends. Cancel before the trial ends to avoid being charged for the selected plan.',
  },
  {
    title: 'Auto-renewal',
    body:
      'Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Renewal charges use the same payment method on file.',
  },
  {
    title: 'Cancellation & refunds',
    body:
      'You may cancel anytime from Billing & Subscription in My Hub. Cancellation takes effect at the end of the current billing period. Refunds are handled according to platform store policies unless required otherwise by law.',
  },
  {
    title: 'Premium features',
    body:
      'Premium unlocks additional pets, advanced stats, and enhanced reminders. Feature availability may change as the product evolves; core care tracking remains available on free accounts.',
  },
  {
    title: 'Privacy',
    body:
      'We use your account and pet data to provide scheduling, reminders, and subscription services. We do not sell personal data. Contact support for data or account deletion requests.',
  },
];

interface TermsAndConditionsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function TermsAndConditionsSheet({ visible, onClose }: TermsAndConditionsSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="h3" weight="800" color={ProfileTheme.text}>
              Terms & Conditions
            </AppText>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={ProfileTheme.text} />
            </Pressable>
          </View>

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
