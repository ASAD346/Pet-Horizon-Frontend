import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/hooks/usePets';
import { getErrorMessage } from '@/lib/api/errors';
import { fetchContactHistory, sendContactMessage } from '@/services/contact/contactApi';
import type { ContactHistoryItem } from '@/types/contact';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { ProfileTheme } from '@/components/profile/profileTheme';

export default function SupportScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { pets } = usePets(token, user?.activePetId);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [petId, setPetId] = useState<string | undefined>(user?.activePetId ?? undefined);
  const [history, setHistory] = useState<ContactHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const rows = await fetchContactHistory(token);
      setHistory(rows);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleSend = async () => {
    if (!token || !user) return;
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    if (!trimmedSubject || !trimmedMessage) {
      setError('Subject and message are required.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await sendContactMessage(token, {
        name: user.fullName?.trim() || user.email.split('@')[0],
        email: user.email,
        subject: trimmedSubject,
        message: trimmedMessage,
        petId,
        appVersion: Constants.expoConfig?.version ?? '1.0.0',
      });
      setSuccess(result.message);
      setSubject('');
      setMessage('');
      await loadHistory();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ProfileScreenHeader title="Help & Support" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={ProfileTheme.green} />
        }
      >
        {success ? <AuthInfoBanner message={success} /> : null}
        {error ? <AuthErrorBanner message={error} /> : null}

        <AppText variant="bodySmall" color={HomeTheme.textMuted} style={styles.intro}>
          Send us a message and we will get back to you within 24 hours.
        </AppText>

        <AppText variant="caption" weight="700" color={HomeTheme.textMuted}>
          Subject
        </AppText>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="What do you need help with?"
          placeholderTextColor={HomeTheme.textMuted}
        />

        <AppText variant="caption" weight="700" color={HomeTheme.textMuted}>
          Message
        </AppText>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your issue or question"
          placeholderTextColor={HomeTheme.textMuted}
          multiline
        />

        {pets.length > 0 ? (
          <>
            <AppText variant="caption" weight="700" color={HomeTheme.textMuted}>
              Related pet (optional)
            </AppText>
            <View style={styles.petRow}>
              <AppButton
                title="None"
                size="sm"
                variant={!petId ? 'success' : 'secondary'}
                onPress={() => setPetId(undefined)}
                style={styles.petChip}
              />
              {pets.map((pet) => (
                <AppButton
                  key={pet._id}
                  title={pet.name}
                  size="sm"
                  variant={petId === pet._id ? 'success' : 'secondary'}
                  onPress={() => setPetId(pet._id)}
                  style={styles.petChip}
                />
              ))}
            </View>
          </>
        ) : null}

        <AppButton
          title="Send message"
          onPress={handleSend}
          loading={loading}
          variant="success"
          size="md"
          style={styles.sendBtn}
        />

        <AppText variant="bodySmall" weight="800" color={ProfileTheme.text} style={styles.historyTitle}>
          Message history
        </AppText>

        {historyLoading && history.length === 0 ? (
          <ActivityIndicator color={ProfileTheme.green} style={styles.historyLoader} />
        ) : history.length === 0 ? (
          <AppText variant="caption" color={HomeTheme.textMuted}>
            No previous messages yet.
          </AppText>
        ) : (
          history.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <AppText variant="bodySmall" weight="800" color={ProfileTheme.text}>
                {item.subject}
              </AppText>
              <AppText variant="caption" color={HomeTheme.textMuted}>
                {new Date(item.createdAt).toLocaleString()}
                {item.status ? ` · ${item.status}` : ''}
              </AppText>
              <AppText variant="caption" color={HomeTheme.textMuted} numberOfLines={3}>
                {item.message}
              </AppText>
              {item.reply ? (
                <AppText variant="caption" color={ProfileTheme.green} style={styles.reply}>
                  Reply: {item.reply}
                </AppText>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ProfileTheme.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  intro: {
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: HomeTheme.surfaceMuted,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: HomeTheme.text,
    backgroundColor: HomeTheme.white,
    marginBottom: Spacing.sm,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  petRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  petChip: {
    minWidth: 72,
  },
  sendBtn: {
    marginBottom: Spacing.lg,
  },
  historyTitle: {
    marginBottom: Spacing.sm,
  },
  historyLoader: {
    marginVertical: Spacing.md,
  },
  historyCard: {
    backgroundColor: HomeTheme.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  reply: {
    marginTop: Spacing.xs,
  },
});
