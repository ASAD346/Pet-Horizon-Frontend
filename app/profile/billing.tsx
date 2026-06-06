import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { ProfileTheme, formatPlanPrice } from '@/components/profile/profileTheme';
import { SectionLabel, SheetColors } from '@/components/sheets';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/api/errors';
import {
  cancelPremium,
  fetchPaymentInvoices,
  fetchPremiumStatus,
  updatePaymentMethod,
} from '@/services/premium/premiumApi';
import type { PaymentInvoice, PremiumStatusResponse } from '@/types/premium';

export default function BillingScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [status, setStatus] = useState<PremiumStatusResponse | null>(null);
  const [invoices, setInvoices] = useState<PaymentInvoice[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState('pm_stub_saved');
  const [loading, setLoading] = useState(true);
  const [savingMethod, setSavingMethod] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [premiumStatus, invoiceList] = await Promise.all([
        fetchPremiumStatus(token),
        fetchPaymentInvoices(token),
      ]);
      setStatus(premiumStatus);
      setInvoices(invoiceList);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleCancel = () => {
    if (!token) return;
    Alert.alert(
      'Cancel subscription',
      'Auto-renew will be turned off. You keep premium until the current period ends.',
      [
        { text: 'Keep Premium', style: 'cancel' },
        {
          text: 'Cancel Renewal',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            setError(null);
            try {
              const result = await cancelPremium(token);
              setInfo(result.message);
              await reload();
            } catch (err) {
              setError(getErrorMessage(err));
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  const handleUpdateMethod = async () => {
    if (!token || !paymentMethodId.trim()) {
      setError('Enter a payment method ID.');
      return;
    }
    setSavingMethod(true);
    setError(null);
    try {
      const result = await updatePaymentMethod(token, paymentMethodId.trim());
      setInfo(result.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingMethod(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ProfileScreenHeader title="Billing" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        {error ? <AuthErrorBanner message={error} /> : null}
        {info ? <AuthInfoBanner message={info} /> : null}

        <View style={styles.card}>
          <AppText variant="body" weight="700" color={ProfileTheme.text}>
            Current plan
          </AppText>
          <AppText variant="h3" weight="800" color={ProfileTheme.text} style={styles.planValue}>
            {status?.isPremium ? status.plan ?? 'Premium' : 'Free'}
          </AppText>
          {status?.expiresAt ? (
            <AppText variant="caption" color={ProfileTheme.textMuted}>
              {status.autoRenew ? 'Renews' : 'Valid until'}{' '}
              {new Date(status.expiresAt).toLocaleDateString()}
            </AppText>
          ) : null}
        </View>

        {status?.isPremium ? (
          <AppButton
            title="Cancel Subscription"
            onPress={handleCancel}
            loading={cancelling}
            variant="outline"
            size="md"
            style={styles.cancelBtn}
            textStyle={styles.cancelText}
          />
        ) : null}

        <SectionLabel text="UPDATE PAYMENT METHOD" />
        <AppText variant="caption" color={HomeTheme.textMuted} style={styles.stubNote}>
          Stripe is stubbed on the backend — enter a placeholder payment method ID (e.g. pm_stub_456).
        </AppText>
        <TextInput
          value={paymentMethodId}
          onChangeText={setPaymentMethodId}
          style={styles.input}
          placeholder="pm_stub_456"
          placeholderTextColor={SheetColors.placeholder}
          autoCapitalize="none"
        />
        <AppButton
          title="Save Payment Method"
          onPress={handleUpdateMethod}
          loading={savingMethod}
          variant="success"
          size="md"
          style={styles.methodBtn}
        />

        <SectionLabel text="BILLING HISTORY" />
        {loading ? (
          <AppText variant="bodySmall" color={ProfileTheme.textMuted}>
            Loading invoices...
          </AppText>
        ) : invoices.length === 0 ? (
          <AppText variant="bodySmall" color={ProfileTheme.textMuted}>
            No invoices yet.
          </AppText>
        ) : (
          invoices.map((invoice) => (
            <View key={invoice.id} style={styles.invoiceRow}>
              <View>
                <AppText variant="bodySmall" weight="700" color={ProfileTheme.text}>
                  {invoice.date}
                </AppText>
                <AppText variant="caption" color={ProfileTheme.textMuted}>
                  {invoice.status}
                </AppText>
              </View>
              <AppText variant="body" weight="700" color={ProfileTheme.green}>
                {formatPlanPrice(invoice.amount)}
              </AppText>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ProfileTheme.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: ProfileTheme.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  planValue: {
    marginVertical: Spacing.xs,
  },
  cancelBtn: {
    width: '100%',
    borderRadius: Radius.full,
    borderColor: '#E53935',
    marginBottom: Spacing.lg,
  },
  cancelText: {
    color: '#E53935',
  },
  stubNote: {
    marginBottom: Spacing.sm,
    lineHeight: 16,
  },
  input: {
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: SheetColors.inputText,
    marginBottom: Spacing.md,
  },
  methodBtn: {
    width: '100%',
    borderRadius: Radius.full,
    marginBottom: Spacing.lg,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ProfileTheme.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
});
