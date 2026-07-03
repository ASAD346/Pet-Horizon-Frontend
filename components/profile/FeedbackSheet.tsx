import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { useToast } from '@/hooks/useToast';
import { Spacing } from '@/constants/theme';
import { submitFeedback } from '@/services/feedback/feedbackApi';
import { CustomButton } from '@/components/ui/AppButton';
import { ProfileModalShell } from './ProfileModalShell';
import { FormTextInput } from '../sheets';
import { ProfileTheme } from './profileTheme';

interface FeedbackSheetProps {
  visible: boolean;
  onClose: () => void;
  token: string | null;
}

export function FeedbackSheet({ visible, onClose, token }: FeedbackSheetProps) {
  const { showToast } = useToast();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (rating === 0) { showToast('Please select a rating'); return; }
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
    } catch {
      showToast('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProfileModalShell
      visible={visible}
      onClose={onClose}
      title="Rate Us & Feedback"
    >
      <AppText variant="bodySmall" color="#64748B" style={styles.intro}>
        We're always improving PetHorizon. Share your ideas or suggestions with us.
      </AppText>

      <View style={styles.ratingCard}>
        <AppText variant="bodySmall" weight="700" color="#334155" style={styles.ratingLabel}>
          Rate your experience
        </AppText>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? ProfileTheme.green : '#CBD5E1'}
              onPress={() => setRating(star)}
              suppressHighlighting
            />
          ))}
        </View>
      </View>

      <FormTextInput
        label="Comments (Optional)"
        value={comment}
        onChangeText={setComment}
        placeholder="What can we improve?"
        multiline
      />

      <CustomButton
        title={submitting ? 'Submitting…' : 'Submit Feedback'}
        onPress={handleSubmit}
        isLoading={submitting}
        variant="primary"
        style={styles.ctaBtn}
      />
    </ProfileModalShell>
  );
}

const styles = StyleSheet.create({
  intro: {
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  ratingCard: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ratingLabel: {
    marginBottom: Spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  ctaBtn: {
    marginTop: Spacing.md,
  },
});
