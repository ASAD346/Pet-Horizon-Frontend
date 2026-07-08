import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { ProfileModalShell } from './ProfileModalShell';

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
    question: 'How do I manage my premium subscription?',
    answer: 'Your active plan is listed under Profile > Billing & Subscription. Subscription renewals and cancellations are handled securely via your Google Play Store account settings.',
  },
  {
    question: 'How can I request my account to be deleted?',
    answer: 'You can delete your account instantly by going to Profile > Profile Information (Edit Profile) and selecting "Delete Account" under the actions block.',
  },
];

function FaqItem({ faq, isExpanded, onToggle }: { faq: typeof FAQS[number]; isExpanded: boolean; onToggle: () => void }) {
  return (
    <View style={faqStyles.card}>
      <TouchableOpacity style={faqStyles.header} onPress={onToggle} activeOpacity={0.7}>
        <AppText variant="body" weight="700" color="#1E293B" style={faqStyles.question}>
          {faq.question}
        </AppText>
        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
      </TouchableOpacity>
      {isExpanded && (
        <View style={faqStyles.body}>
          <AppText variant="bodySmall" color="#475569" style={faqStyles.answer}>
            {faq.answer}
          </AppText>
        </View>
      )}
    </View>
  );
}

const faqStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: 12,
  },
  question: { flex: 1, lineHeight: 20 },
  body: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: 0,
  },
  answer: { lineHeight: 20 },
});

interface HelpSupportSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function HelpSupportSheet({ visible, onClose }: HelpSupportSheetProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleContactSupport = () => {
    const email = 'pethorizon2026@gmail.com';
    const subject = 'Pet Horizon Support Request';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Support Contact', 'Could not open your email client. Please reach us at pethorizon2026@gmail.com');
    });
  };

  return (
    <ProfileModalShell visible={visible} onClose={onClose} title="Help & Support">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.contactCard}>
          <View style={styles.contactText}>
            <AppText variant="body" weight="800" color="#1E293B">
              Contact Support Team
            </AppText>
            <AppText variant="caption" color="#64748B">
              We're available 24/7 to help you
            </AppText>
          </View>
          <TouchableOpacity style={styles.emailBtn} onPress={handleContactSupport} activeOpacity={0.8}>
            <AppText variant="bodySmall" weight="700" color="#1E293B">
              support@pethorizon.app
            </AppText>
          </TouchableOpacity>
        </View>

        <AppText variant="bodySmall" weight="700" color="#64748B" style={styles.faqLabel}>
          FREQUENTLY ASKED QUESTIONS
        </AppText>

        {FAQS.map((faq, index) => (
          <FaqItem
            key={index}
            faq={faq}
            isExpanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
          />
        ))}
      </ScrollView>
    </ProfileModalShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  contactCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  contactText: { alignItems: 'center', gap: 2 },
  emailBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginTop: Spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  faqLabel: {
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
});
