import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';
import { ProfileModalShell } from './ProfileModalShell';
import { CustomButton } from '@/components/ui/AppButton';

const FAQS = [
  {
    question: 'How do I add a new pet?',
    answer: 'Go to the Home tab, tap the pet selector header at the top of your dashboard, and select "Add Pet".',
  },
  {
    question: 'Can I share my pet hub with family?',
    answer: 'Yes! Open the Family tab from the bottom navigation bar. From there, you can view your care team, generate invitation codes, or show a QR code for other members to scan and join.',
  },
  {
    question: 'How do I manage or cancel my premium subscription?',
    answer: 'Your active plan is listed under Profile > Billing & Subscription. Subscription renewals, payments, and cancellations are handled securely via your Google Play Store account settings under the "Subscriptions" section.',
  },
  {
    question: 'How can I request my account and data to be deleted?',
    answer: 'You can delete your account instantly by going to Profile > Profile Information (Edit Profile) and selecting "Delete Account" under the actions block. This will permanently wipe all your account, pet, schedule, budget, and journal photo records from our databases.',
  },
];

interface HelpSupportSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function HelpSupportSheet({ visible, onClose }: HelpSupportSheetProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleContactSupport = () => {
    const email = 'support@pethorizon.app';
    const subject = 'Pet Horizon Support Request';
    const body = 'Please write details of your issue here...';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'Support Contact',
        'Could not open your email client. Please reach us at support@pethorizon.app'
      );
    });
  };

  return (
    <ProfileModalShell visible={visible} onClose={onClose} title="Help & Support">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.supportBox}>
          <Ionicons name="mail-unread-outline" size={28} color={ProfileTheme.green} />
          <View style={styles.supportText}>
            <AppText variant="body" weight="700" color={ProfileTheme.text}>
              Contact Support Team
            </AppText>
            <AppText variant="bodySmall" color={ProfileTheme.textMuted}>
              Available 24/7 at support@pethorizon.app
            </AppText>
          </View>
        </View>

        <CustomButton
          title="Email Support"
          onPress={handleContactSupport}
          variant="primary"
          style={styles.contactBtn}
        />

        <AppText variant="body" weight="800" color={ProfileTheme.text} style={styles.faqTitle}>
          Frequently Asked Questions
        </AppText>

        {FAQS.map((faq, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <View key={index} style={styles.faqCard}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => setExpandedIndex(isExpanded ? null : index)}
                activeOpacity={0.7}
              >
                <AppText variant="body" weight="700" color={ProfileTheme.text} style={{ flex: 1 }}>
                  {faq.question}
                </AppText>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={ProfileTheme.textMuted}
                />
              </TouchableOpacity>
              {isExpanded && (
                <View style={styles.faqBody}>
                  <AppText variant="bodySmall" color={ProfileTheme.textMuted} style={styles.faqAnswer}>
                    {faq.answer}
                  </AppText>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </ProfileModalShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  supportBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ProfileTheme.background,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 12,
    marginBottom: Spacing.lg,
  },
  supportText: {
    flex: 1,
    gap: 2,
  },
  contactBtn: {
    marginBottom: Spacing.xl,
  },
  faqTitle: {
    marginBottom: Spacing.md,
  },
  faqCard: {
    backgroundColor: ProfileTheme.background,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  faqBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  faqAnswer: {
    lineHeight: 18,
    paddingTop: 8,
  },
});
