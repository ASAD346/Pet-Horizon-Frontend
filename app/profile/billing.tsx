import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { ProfileTheme, formatPlanPrice } from '@/components/profile/profileTheme';
import { SectionLabel, SheetColors } from '@/components/sheets';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { SkeletonBillingHistory } from '@/components/ui/skeletons';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/api/errors';
import {
  cancelPremium,
  fetchPaymentInvoices,
  fetchPremiumStatus,
  updatePaymentMethod,
} from '@/services/premium/premiumApi';
import type { PaymentInvoice, PremiumStatusResponse } from '@/types/premium';

import { homeCardShadow } from '@/components/home/homeStyles';

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

  // Focus state for the text input
  const [isInputFocused, setIsInputFocused] = useState(false);

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

  const displayPlanName = status?.isPremium ? (status.plan ?? 'Premium').toUpperCase() : 'FREE PLAN';
  const displayRenewLabel = status?.expiresAt 
    ? `${status.autoRenew ? 'Next Renewal' : 'Expires on'} ${new Date(status.expiresAt).toLocaleDateString()}`
    : 'No renewal date';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ProfileScreenHeader title="Billing" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <View style={styles.banner}><AuthErrorBanner message={error} /></View> : null}
        {info ? <View style={styles.banner}><AuthInfoBanner message={info} /></View> : null}

        {/* Current plan stylized card */}
        <View style={styles.ticketCard}>
          <LinearGradient
            colors={status?.isPremium ? ['#0E3821', '#184F2E', '#267343'] : ['#E8F5E9', '#C8E6C9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ticketGradient}
          >
            {/* Header row */}
            <View style={styles.ticketHeader}>
              <View style={status?.isPremium ? styles.premiumBadge : styles.freeBadge}>
                <Ionicons name={status?.isPremium ? 'diamond' : 'paw'} size={12} color={status?.isPremium ? '#D4A017' : '#2E7D32'} />
                <AppText variant="caption" weight="800" color={status?.isPremium ? '#FFF9E6' : '#2E7D32'} style={styles.badgeText}>
                  {status?.isPremium ? 'PREMIUM ACTIVE' : 'FREE ACCOUNT'}
                </AppText>
              </View>
              {status?.isPremium && (
                <Ionicons name="star" size={18} color="#D4A017" />
              )}
            </View>

            {/* Plan Info */}
            <AppText variant="h2" weight="800" color={status?.isPremium ? '#FFFFFF' : '#1B5E20'} style={styles.ticketPlanTitle}>
              {displayPlanName}
            </AppText>

            {status?.isPremium ? (
              <AppText variant="bodySmall" color="rgba(255,255,255,0.75)" style={styles.ticketDesc}>
                Unlimited pet registrations, advanced analytics, and smart notifications.
              </AppText>
            ) : (
              <AppText variant="bodySmall" color="#4E704F" style={styles.ticketDesc}>
                Basic pet tracking and scheduling features.
              </AppText>
            )}

            <View style={status?.isPremium ? styles.ticketDividerPremium : styles.ticketDividerFree} />

            {/* Footer row */}
            <View style={styles.ticketFooter}>
              <View>
                <AppText variant="caption" color={status?.isPremium ? 'rgba(255,255,255,0.6)' : '#668068'} weight="700">
                  BILLING TERMS
                </AppText>
                <AppText variant="bodySmall" weight="800" color={status?.isPremium ? '#FFFFFF' : '#1B5E20'} style={styles.ticketFooterVal}>
                  {displayRenewLabel}
                </AppText>
              </View>
              <View style={styles.alignEnd}>
                <AppText variant="caption" color={status?.isPremium ? 'rgba(255,255,255,0.6)' : '#668068'} weight="700">
                  PRICE
                </AppText>
                <AppText variant="bodySmall" weight="800" color={status?.isPremium ? '#FFF176' : '#1B5E20'} style={styles.ticketFooterVal}>
                  {status?.isPremium ? '$9.99/mo' : 'Free'}
                </AppText>
              </View>
            </View>
          </LinearGradient>
        </View>

        {status?.isPremium ? (
          <AppButton
            title="Cancel Auto-Renewal"
            onPress={handleCancel}
            loading={cancelling}
            variant="outline"
            size="md"
            style={styles.cancelBtn}
            textStyle={styles.cancelText}
          />
        ) : (
          <AppButton
            title="Upgrade to Premium"
            onPress={() => router.push('/profile/premium')}
            variant="success"
            size="md"
            style={styles.upgradeBtn}
            textStyle={styles.upgradeText}
          />
        )}

        {/* Update payment method form */}
        <View style={styles.formCard}>
          <View style={styles.labelContainer}>
            <View style={[styles.labelDot, isInputFocused && styles.labelDotActive]} />
            <AppText variant="caption" weight="800" color={isInputFocused ? '#2E7D32' : '#64748B'} style={styles.labelText}>
              UPDATE PAYMENT METHOD
            </AppText>
          </View>
          <AppText variant="caption" color={HomeTheme.textMuted} style={styles.stubNote}>
            Stripe integration is simulated on the backend. Enter a stub token (e.g. pm_stub_123) to verify.
          </AppText>
          <View style={[
            styles.inputRow,
            isInputFocused && styles.inputRowActive
          ]}>
            <Ionicons name="card-outline" size={18} color={isInputFocused ? '#2E7D32' : '#94A3B8'} />
            <TextInput
              value={paymentMethodId}
              onChangeText={setPaymentMethodId}
              style={styles.input}
              placeholder="pm_stub_456"
              placeholderTextColor={SheetColors.placeholder}
              autoCapitalize="none"
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
          </View>
          <AppButton
            title="Save Payment Method"
            onPress={handleUpdateMethod}
            loading={savingMethod}
            variant="success"
            size="md"
            style={styles.methodBtn}
          />
        </View>

        {/* Billing History Section */}
        <View style={styles.historyLabelContainer}>
          <View style={styles.labelDotHistory} />
          <AppText variant="caption" weight="800" color="#64748B" style={styles.labelText}>
            BILLING HISTORY
          </AppText>
        </View>
        <View style={styles.historyCard}>
          {loading ? (
            <SkeletonBillingHistory count={3} />
          ) : invoices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={32} color="#CBD5E1" />
              <AppText variant="bodySmall" color={ProfileTheme.textMuted} style={styles.emptyText}>
                No invoices found on this account.
              </AppText>
            </View>
          ) : (
            invoices.map((invoice, index) => (
              <View key={invoice.id} style={styles.invoiceItem}>
                {index > 0 && <View style={styles.invoiceDivider} />}
                <View style={styles.invoiceRow}>
                  <View style={styles.invoiceLeft}>
                    <View style={styles.receiptBadge}>
                      <Ionicons name="document-text-outline" size={16} color="#2E7D32" />
                    </View>
                    <View>
                      <AppText variant="bodySmall" weight="800" color={ProfileTheme.text}>
                        Invoice #{invoice.id.slice(-6).toUpperCase()}
                      </AppText>
                      <AppText variant="caption" color={ProfileTheme.textMuted} style={styles.invoiceDate}>
                        {invoice.date}
                      </AppText>
                    </View>
                  </View>
                  <View style={styles.invoiceRight}>
                    <AppText variant="body" weight="800" color={ProfileTheme.green}>
                      {formatPlanPrice(invoice.amount)}
                    </AppText>
                    <View style={styles.statusPill}>
                      <AppText variant="caption" weight="800" color="#2E7D32" style={styles.statusText}>
                        {invoice.status.toUpperCase()}
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  banner: {
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
  },
  ticketCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...homeCardShadow,
  },
  ticketGradient: {
    padding: Spacing.lg,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  badgeText: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  ticketPlanTitle: {
    fontSize: 24,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  ticketDesc: {
    lineHeight: 16,
    marginBottom: Spacing.md,
  },
  ticketDividerPremium: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: Spacing.md,
  },
  ticketDividerFree: {
    height: 1,
    backgroundColor: 'rgba(46, 125, 50, 0.15)',
    marginBottom: Spacing.md,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketFooterVal: {
    marginTop: 2,
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  cancelBtn: {
    width: '100%',
    borderRadius: Radius.full,
    borderColor: '#E53935',
    marginBottom: Spacing.lg,
    minHeight: 52,
  },
  cancelText: {
    color: '#E53935',
    fontWeight: '800',
  },
  upgradeBtn: {
    width: '100%',
    borderRadius: Radius.full,
    marginBottom: Spacing.lg,
    minHeight: 52,
  },
  upgradeText: {
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.lg,
    ...homeCardShadow,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
    paddingLeft: 2,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  labelDotActive: {
    backgroundColor: '#2E7D32',
  },
  labelText: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  stubNote: {
    marginBottom: Spacing.md,
    lineHeight: 16,
    color: '#64748B',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    minHeight: 48,
  },
  inputRowActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#FCFDFC',
    ...Platform.select({
      ios: {
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: SheetColors.inputText,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  methodBtn: {
    width: '100%',
    borderRadius: Radius.full,
    marginBottom: 0,
    minHeight: 52,
  },
  historyLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
    paddingLeft: 2,
  },
  labelDotHistory: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    ...homeCardShadow,
  },
  invoiceItem: {
    width: '100%',
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  invoiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  receiptBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46, 125, 50, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceDate: {
    marginTop: 2,
  },
  invoiceRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusPill: {
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 8,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
  },
});
