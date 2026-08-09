import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { ProfileTheme, formatPlanPrice } from '@/components/profile/profileTheme';
import { Radius, Spacing } from '@/constants/theme';
import { SkeletonBillingHistory } from '@/components/ui/skeletons';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api/errors';
import {
  cancelPremium,
  fetchPaymentInvoices,
  fetchPremiumStatus,
  subscribePremium,
} from '@/services/premium/premiumApi';
import { SecureCheckoutSheet } from '@/components/profile/SecureCheckoutSheet';
import type { PaymentInvoice, PremiumStatusResponse } from '@/types/premium';

const FREE_FEATURES = [
  'Basic pet tracking & schedule limits',
  '1 daily photo upload in activity journal',
  'Single pet profile support',
];

const MONTHLY_FEATURES = [
  'Unlimited pet profile registrations',
  'Up to 5 daily photo uploads in journal',
  'Smart custom push notifications & reminders',
  'Invite family caregivers & customize access permissions',
  'Health metrics tracking & weight logging',
];

const YEARLY_FEATURES = [
  'All Monthly Premium benefits included',
  'Equivalent of 2 months free! (Save 17%)',
  'Dedicated Priority Customer Support agent access',
];

interface PlanCardProps {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  features: string[];
  price: string;
  isActive: boolean;
  onPress?: () => void;
  renewLabel?: string;
  isPopular?: boolean;
}

function PlanCard({
  title, icon, features, price,
  isActive, onPress, renewLabel, isPopular,
}: PlanCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.planCard,
        isActive && styles.planCardActive,
        isPopular && !isActive && styles.planCardPopular,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      disabled={!onPress}
    >
      <View style={styles.planCardHeader}>
        <View style={styles.planTitleRow}>
          <Ionicons name={icon} size={20} color={isActive ? '#2E7D32' : isPopular ? '#D4A017' : '#64748B'} />
          <AppText variant="body" weight="800" color={isActive ? '#1B5E20' : isPopular ? '#B47E00' : '#334155'}>
            {title}
          </AppText>
        </View>
        {isActive ? (
          <View style={styles.activeBadge}>
            <AppText variant="caption" weight="800" color="#2E7D32">
              ACTIVE
            </AppText>
          </View>
        ) : isPopular ? (
          <View style={styles.popularBadge}>
            <AppText variant="caption" weight="800" color="#FFFFFF">
              POPULAR
            </AppText>
          </View>
        ) : onPress ? (
          <View style={styles.upgradeBadge}>
            <AppText variant="caption" weight="700" color="#2E7D32">
              Upgrade
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.featureList}>
        {features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={isActive ? '#4CAF50' : '#94A3B8'}
              style={styles.checkIcon}
            />
            <AppText variant="caption" color="#475569" style={styles.featureText}>
              {f}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.planPriceRow}>
        <AppText variant="bodySmall" weight="800" color="#334155">
          {price}
        </AppText>
        {renewLabel ? (
          <AppText variant="caption" color="#2E7D32" weight="600">
            {renewLabel}
          </AppText>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function InvoiceRow({ invoice }: { invoice: PaymentInvoice }) {
  const statusColor =
    invoice.status === 'paid' ? '#22C55E' :
    invoice.status === 'pending' ? '#F59E0B' : '#EF4444';

  return (
    <View style={styles.invoiceRow}>
      <View style={styles.invoiceLeft}>
        <AppText variant="bodySmall" weight="700" color="#1E293B">
          #{invoice.id.slice(-6).toUpperCase()}
        </AppText>
        <AppText variant="caption" color="#64748B">
          {invoice.date}
        </AppText>
      </View>
      <View style={styles.invoiceRight}>
        <AppText variant="bodySmall" weight="700">
          {formatPlanPrice(invoice.amount)}
        </AppText>
        <AppText variant="caption" weight="700" color={statusColor}>
          {invoice.status.toUpperCase()}
        </AppText>
      </View>
    </View>
  );
}

export default function BillingScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [status, setStatus] = useState<PremiumStatusResponse | null>(null);
  const [invoices, setInvoices] = useState<PaymentInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const { showToast, showErrorToast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleSelectPlan = (planId: 'monthly' | 'yearly') => {
    setSelectedPlan({
      planId,
      price: planId === 'yearly' ? 49.99 : 4.99,
      name: planId === 'yearly' ? 'Yearly Premium' : 'Monthly Premium',
    });
    setCheckoutVisible(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlan || !token) return;
    setCheckoutLoading(true);
    try {
      await subscribePremium(token, {
        planId: selectedPlan.planId,
      });
      showToast('Successfully subscribed to Premium!');
      setCheckoutVisible(false);
      await reload();
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const isPremium = status?.isPremium ?? user?.premiumStatus === 'premium';

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [premiumStatus, invoiceList] = await Promise.all([
        fetchPremiumStatus(token),
        fetchPaymentInvoices(token),
      ]);
      setStatus(premiumStatus);
      setInvoices(invoiceList);
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { reload(); }, [reload]);

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
            try {
              const result = await cancelPremium(token);
              showToast(result.message);
              await reload();
            } catch (err) {
              showErrorToast(getErrorMessage(err));
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  const planKey = status?.plan ?? '';
  const isMonthlyActive = isPremium && planKey !== 'yearly' && planKey !== 'annual';
  const isYearlyActive = isPremium && (planKey === 'yearly' || planKey === 'annual');

  const renewLabel = status?.expiresAt
    ? `${status.autoRenew ? 'Renews' : 'Expires'} ${new Date(status.expiresAt).toLocaleDateString()}`
    : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ProfileScreenHeader title="Billing & Subscription" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Active Premium Details Section */}
        {isPremium && status && (
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <View style={styles.goldBadge}>
                <Ionicons name="sparkles" size={16} color="#D4A017" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="body" weight="800" color="#0F172A">
                  Active Subscription
                </AppText>
                <AppText variant="caption" color="#64748B">
                  Premium member benefits unlocked
                </AppText>
              </View>
            </View>
            
            <View style={styles.divider} />

            <View style={styles.detailsGrid}>
              <View style={styles.detailsRow}>
                <AppText variant="caption" color="#64748B">Active Plan</AppText>
                <AppText variant="caption" weight="800" color="#0F172A">
                  {isYearlyActive ? 'Yearly Premium' : 'Monthly Premium'}
                </AppText>
              </View>
              
              <View style={styles.detailsRow}>
                <AppText variant="caption" color="#64748B">Status</AppText>
                <AppText variant="caption" weight="800" color="#22C55E">
                  ACTIVE
                </AppText>
              </View>

              <View style={styles.detailsRow}>
                <AppText variant="caption" color="#64748B">Billing Cycle</AppText>
                <AppText variant="caption" weight="800" color="#0F172A">
                  {isYearlyActive ? '$49.99/year' : '$4.99/month'}
                </AppText>
              </View>

              <View style={styles.detailsRow}>
                <AppText variant="caption" color="#64748B">
                  {status.autoRenew ? 'Next Renewal' : 'Expires On'}
                </AppText>
                <AppText variant="caption" weight="800" color="#0F172A">
                  {status.expiresAt ? new Date(status.expiresAt).toLocaleDateString() : 'N/A'}
                </AppText>
              </View>

              <View style={styles.detailsRow}>
                <AppText variant="caption" color="#64748B">Auto-Renew</AppText>
                <AppText variant="caption" weight="800" color={status.autoRenew ? '#22C55E' : '#EF4444'}>
                  {status.autoRenew ? 'Enabled' : 'Disabled'}
                </AppText>
              </View>
            </View>
          </View>
        )}

        <AppText variant="bodySmall" weight="800" color="#64748B" style={styles.sectionTitle}>
          MEMBERSHIP PLANS
        </AppText>

        <View style={styles.planContainer}>
          <PlanCard
            title="Free Plan"
            icon="paw-outline"
            features={FREE_FEATURES}
            price="Free forever"
            isActive={!isPremium}
          />

          <PlanCard
            title="Monthly Premium"
            icon="star-outline"
            features={MONTHLY_FEATURES}
            price="$4.99 / month"
            isActive={isMonthlyActive}
            renewLabel={isMonthlyActive ? renewLabel : undefined}
            onPress={!isMonthlyActive ? () => handleSelectPlan('monthly') : undefined}
          />

          <PlanCard
            title="Yearly Premium"
            icon="ribbon-outline"
            features={YEARLY_FEATURES}
            price="$49.99 / year  ·  Save 17%"
            isActive={isYearlyActive}
            renewLabel={isYearlyActive ? renewLabel : undefined}
            onPress={!isYearlyActive ? () => handleSelectPlan('yearly') : undefined}
            isPopular={true}
          />
        </View>

        {isPremium && status?.autoRenew && (
          <TouchableOpacity style={styles.cancelCard} onPress={handleCancel} activeOpacity={0.8} disabled={cancelling}>
            <View style={styles.cancelContent}>
              <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              <View style={{ flex: 1 }}>
                <AppText variant="bodySmall" weight="700" color="#EF4444">
                  Cancel Auto-Renewal
                </AppText>
                <AppText variant="caption" color="#94A3B8" style={{ marginTop: 2 }}>
                  Your premium access remains active until the end of your billing cycle.
                </AppText>
              </View>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.infoBanner}>
          <Ionicons name="logo-google-playstore" size={18} color="#64748B" />
          <AppText variant="caption" color="#64748B" style={styles.infoText}>
            Payment methods, invoices, and billing cycles are managed securely via your Google Play Store account settings.
          </AppText>
        </View>

        <AppText variant="bodySmall" weight="800" color="#64748B" style={[styles.sectionTitle, { marginTop: Spacing.md }]}>
          BILLING HISTORY
        </AppText>

        <View style={styles.historyCard}>
          {loading ? (
            <SkeletonBillingHistory count={3} />
          ) : invoices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={28} color="#CBD5E1" style={{ marginBottom: 8 }} />
              <AppText variant="bodySmall" color="#94A3B8">
                No invoices on this account yet
              </AppText>
            </View>
          ) : (
            invoices.map((inv) => <InvoiceRow key={inv.id} invoice={inv} />)
          )}
        </View>
      </ScrollView>

      <SecureCheckoutSheet
        visible={checkoutVisible}
        plan={selectedPlan}
        onClose={() => setCheckoutVisible(false)}
        onConfirm={handleConfirmPayment}
        loading={checkoutLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ProfileTheme.background },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  planContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  planCardActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#F0FAF0',
  },
  planCardPopular: {
    borderColor: '#D4A017',
    borderWidth: 2,
    backgroundColor: '#FFFDF0',
  },
  popularBadge: {
    backgroundColor: '#D4A017',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  upgradeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  featureList: {
    gap: 8,
    marginBottom: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    lineHeight: 16,
  },
  planPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: Spacing.sm,
  },
  /* Subscription Details Card */
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.xl,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goldBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: Spacing.md,
  },
  detailsGrid: {
    gap: Spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  /* Cancel Card */
  cancelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    marginBottom: Spacing.lg,
  },
  cancelContent: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.md,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.xl,
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  invoiceLeft: {
    gap: 4,
  },
  invoiceRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
