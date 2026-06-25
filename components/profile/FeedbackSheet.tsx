import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useToast } from '@/hooks/useToast';
import { Radius, Spacing, Palette } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';
import { submitFeedback } from '@/services/feedback/feedbackApi';

interface FeedbackSheetProps {
  visible: boolean;
  onClose: () => void;
  token: string | null;
}

export function FeedbackSheet({ visible, onClose, token }: FeedbackSheetProps) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast('Please select a star rating');
      return;
    }
    setSubmitting(true);
    try {
      const response = await submitFeedback(token, { rating, comment });
      if (response.success) {
        showToast('Thank you for your feedback!');
        setComment('');
        setRating(5);
        onClose();
      } else {
        showToast(response.message || 'Submission failed');
      }
    } catch (err) {
      showToast('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <AppText variant="h3" weight="800" color={ProfileTheme.text}>
              Share Feedback
            </AppText>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={ProfileTheme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.infoContainer}>
              <AppText variant="body" color={ProfileTheme.textMuted} style={styles.description}>
                Your feedback helps us make PetHorizon better for pets and their parents in the US, UK, Australia, and Canada.
              </AppText>
            </View>

            <View style={styles.ratingSection}>
              <AppText variant="bodySmall" weight="700" color={ProfileTheme.text} style={styles.sectionLabel}>
                RATE YOUR EXPERIENCE
              </AppText>
              
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    activeOpacity={0.7}
                    style={styles.starTouch}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={36}
                      color={star <= rating ? Palette.premium.gold : Palette.gray[400]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              
              <AppText variant="caption" weight="800" color={Palette.premium.gold} style={styles.ratingText}>
                {rating === 5 ? 'EXCELLENT' : rating === 4 ? 'VERY GOOD' : rating === 3 ? 'GOOD' : rating === 2 ? 'FAIR' : 'POOR'}
              </AppText>
            </View>

            <View style={styles.commentSection}>
              <AppText variant="bodySmall" weight="700" color={ProfileTheme.text} style={styles.sectionLabel}>
                YOUR COMMENTS (OPTIONAL)
              </AppText>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="What can we improve? What features do you love?"
                placeholderTextColor={Palette.gray[400]}
                multiline
                numberOfLines={4}
                style={styles.textInput}
                textAlignVertical="top"
              />
            </View>

            <AppButton
              title="Submit Feedback"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              variant="primary"
              size="lg"
              style={styles.submitBtn}
            />
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
    backgroundColor: 'rgba(10, 15, 30, 0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Palette.gray[200],
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.gray[100],
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
  },
  infoContainer: {
    marginBottom: Spacing.lg,
  },
  description: {
    lineHeight: 20,
  },
  ratingSection: {
    alignItems: 'center',
    backgroundColor: Palette.gray[50],
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.gray[200],
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: Spacing.sm,
  },
  starTouch: {
    padding: 4,
  },
  ratingText: {
    letterSpacing: 1,
    marginTop: 4,
  },
  commentSection: {
    marginBottom: Spacing.xl,
  },
  textInput: {
    backgroundColor: Palette.gray[50],
    borderColor: Palette.gray[200],
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    height: 100,
    fontSize: 14,
    color: Palette.gray[900],
  },
  submitBtn: {
    marginTop: Spacing.xs,
  },
});
