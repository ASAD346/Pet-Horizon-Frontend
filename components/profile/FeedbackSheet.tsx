import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { useToast } from '@/hooks/useToast';
import { Radius, Spacing, Palette } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';
import { submitFeedback } from '@/services/feedback/feedbackApi';
import { FormSheetShell, FormTextInput } from '../sheets';

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
    <FormSheetShell
      visible={visible}
      onClose={onClose}
      title="Share Feedback"
      icon="heart-outline"
      accentColor={ProfileTheme.purple}
      accentBg="#F5F3FF"
      saveLabel="Submit Feedback"
      onSave={handleSubmit}
      saving={submitting}
      compact
    >
      <View style={styles.infoContainer}>
        <AppText variant="bodySmall" color={ProfileTheme.textMuted} style={styles.description}>
          Your feedback helps us make Pet Horizon better for pets and their parents in the US, UK, Australia, and Canada.
        </AppText>
      </View>

      <View style={styles.ratingSection}>
        <AppText variant="caption" weight="800" color={ProfileTheme.text} style={styles.sectionLabel}>
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
                size={32}
                color={star <= rating ? Palette.premium.gold : Palette.gray[300]}
              />
            </TouchableOpacity>
          ))}
        </View>
        
        <AppText variant="caption" weight="800" color={Palette.premium.gold} style={styles.ratingText}>
          {rating === 5 ? 'EXCELLENT' : rating === 4 ? 'VERY GOOD' : rating === 3 ? 'GOOD' : rating === 2 ? 'FAIR' : 'POOR'}
        </AppText>
      </View>

      <FormTextInput
        label="YOUR COMMENTS (OPTIONAL)"
        value={comment}
        onChangeText={setComment}
        placeholder="What can we improve? What features do you love?"
        multiline
      />
    </FormSheetShell>
  );
}

const styles = StyleSheet.create({
  infoContainer: {
    marginBottom: Spacing.md,
  },
  description: {
    lineHeight: 18,
  },
  ratingSection: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    alignSelf: 'flex-start',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: Spacing.xs,
  },
  starTouch: {
    padding: 2,
  },
  ratingText: {
    letterSpacing: 1,
    marginTop: 2,
  },
});
