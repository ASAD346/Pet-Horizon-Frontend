import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View, Linking, Alert } from 'react-native';
import { SafeModal } from '@/components/ui/SafeModal';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';

const FAQS = [
  {
    question: 'How do I add a new pet?',
    answer: 'Navigate to the Home tab and click on the pet selector or Add Pet button in your dashboard settings.',
  },
  {
    question: 'Can I share my pet hub with family?',
    answer: 'Yes! Navigate to Profile > Family Sharing to invite members to view and collaborate on your pet schedules.',
  },
  {
    question: 'How do I cancel my premium subscription?',
    answer: 'You can manage or cancel subscriptions anytime via "Billing & Subscription" inside your profile screen.',
  },
];

interface HelpSupportSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function HelpSupportSheet({ visible, onClose }: HelpSupportSheetProps) {
  const insets = useSafeAreaInsets();
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
    <SafeModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="h3" weight="800" color={ProfileTheme.text}>
              Help & Support
            </AppText>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={ProfileTheme.text} />
            </Pressable>
          </View>

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
              <TouchableOpacity style={styles.contactBtn} onPress={handleContactSupport}>
                <AppText variant="bodySmall" weight="700" color="#FFFFFF">
                  Email
                </AppText>
              </TouchableOpacity>
            </View>

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
        </View>
      </View>
    </SafeModal>
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
    backgroundColor: ProfileTheme.green,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
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
