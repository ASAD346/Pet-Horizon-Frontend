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
} from '@/services/premium/premiumApi';
import type { PaymentInvoice, PremiumStatusResponse } from '@/types/premium';

const FREE_FEATURES = [
  'Basic pet tracking and care schedules',
  'Limit 1 daily photo upload in Journal',
  'Single pet profile',
];

const MONTHLY_FEATURES = [
  'Unlimited pet registrations',
  'Up to 5 daily photo uploads in Journal',
  'Smart notifications & reminders',
  'Caregiver permissions & access controls',
];

const YEARLY_FEATURES = [
  'Best Value — get 2 months free!',
  'All Monthly Premium features included',
  'Dedicated Priority Customer Support',
];

interface PlanCardProps {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  features: string[];
  price: string;
  isActive: boolean;
  onPress?: () => void;
  renewLabel?: string;
}

function PlanCard({
  title, icon, features, price,
  isActive, onPress, renewLabel,
}: PlanCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.planCard,
        isActive && styles.planCardActive,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      disabled={!onPress}
    >
      <View style={styles.planCardHeader}>
        <View style={styles.planTitleRow}>
          <Ionicons name={icon} size={20} color={isActive ? ProfileTheme.green : '#64748B'} />
          <AppText variant="body" weight="800" color={isActive ? ProfileTheme.green : '#334155'}>
            {title}
          </AppText>
        </View>
        {isActive ? (
          <View style={styles.activeBadge}>
            <AppText variant="caption" weight="800" color={ProfileTheme.green}>
              ACTIVE
            </AppText>
          </View>
        ) : onPress ? (
          <AppText variant="caption" weight="700" color={ProfileTheme.green}>
            Upgrade
          </AppText>
        ) : null}
      </View>

      <View style={styles.featureList}>
        {features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <AppText variant="caption" color="#475569" style={styles.featureText}>
              • {f}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.planPriceRow}>
        <AppText variant="bodySmall" weight="800" color="#334155">
          {price}
        </AppText>
        {renewLabel ? (
          <AppText variant="caption" color={ProfileTheme.green}>
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

        <AppText variant="bodySmall" weight="700" color="#64748B" style={styles.sectionTitle}>
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
            onPress={!isMonthlyActive ? () => router.push('/profile/premium') : undefined}
          />

          <PlanCard
            title="Yearly Premium"
            icon="ribbon-outline"
            features={YEARLY_FEATURES}
            price="$49.99 / year  ·  Save 17%"
            isActive={isYearlyActive}
            renewLabel={isYearlyActive ? renewLabel : undefined}
            onPress={!isYearlyActive ? () => router.push('/profile/premium') : undefined}
          />
        </View>

        {isPremium && (
          <TouchableOpacity style={styles.cancelCard} onPress={handleCancel} activeOpacity={0.8} disabled={cancelling}>
            <AppText variant="bodySmall" weight="700" color="#EF4444">
              Cancel Auto-Renewal
            </AppText>
            <AppText variant="caption" color="#94A3B8" style={{ marginTop: 2 }}>
              Keep premium access until the end of your billing cycle
            </AppText>
          </TouchableOpacity>
        )}

        <View style={styles.infoBanner}>
          <Ionicons name="logo-google-playstore" size={16} color="#64748B" />
          <AppText variant="caption" color="#64748B" style={styles.infoText}>
            Payment methods, invoices, and billing cycles are managed securely via your Google Play Store account settings.
          </AppText>
        </View>

        <AppText variant="bodySmall" weight="700" color="#64748B" style={[styles.sectionTitle, { marginTop: Spacing.md }]}>
          BILLING HISTORY
        </AppText>

        <View style={styles.historyCard}>
          {loading ? (
            <SkeletonBillingHistory count={3} />
          ) : invoices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AppText variant="bodySmall" color="#94A3B8">
                No invoices on this account yet
              </AppText>
            </View>
          ) : (
            invoices.map((inv) => <InvoiceRow key={inv.id} invoice={inv} />)
          )}
        </View>
      </ScrollView>
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
    letterSpacing: 0.5,
  },
  planContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  planCardActive: {
    borderColor: ProfileTheme.green,
    backgroundColor: 'rgba(46,125,50,0.02)',
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeBadge: {
    backgroundColor: 'rgba(46,125,50,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  featureList: {
    gap: 4,
    marginBottom: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
  },
  featureText: {
    flex: 1,
  },
  planPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: Spacing.sm,
  },
  cancelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: Spacing.lg,
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
    borderWidth: 1,
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
    padding: Spacing.xl,
    alignItems: 'center',
  },
});
