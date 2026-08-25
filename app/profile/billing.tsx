import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
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
} from '@/services/premium/premiumApi';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
} from 'expo-iap';
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
  period: string;
  badge?: string;
  isActive: boolean;
  onPress?: () => void;
  renewLabel?: string;
  isPopular?: boolean;
}

function PlanCard({
  title, icon, features, price, period, badge,
  isActive, onPress, renewLabel, isPopular,
}: PlanCardProps) {
  const headerIconColor = isActive ? '#2E7D32' : isPopular ? '#D4A017' : '#64748B';
  const titleColor = isActive ? '#1B5E20' : isPopular ? '#B47E00' : '#1E293B';

  return (
    <TouchableOpacity
      style={[
        styles.planCard,
        isActive && styles.planCardActive,
        isPopular && !isActive && styles.planCardPopular,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.85 : 1}
      disabled={!onPress}
    >
      {/* Top accent strip for popular card */}
      {isPopular && !isActive && (
        <View style={styles.popularTopStrip} />
      )}

      {/* Header Row */}
      <View style={styles.planCardHeader}>
        <View style={styles.planTitleRow}>
          <Ionicons name={icon} size={18} color={headerIconColor} />
          <AppText variant="body" weight="800" color={titleColor} style={{ fontSize: 14 }}>
            {title}
          </AppText>
        </View>
        
        {isActive ? (
          <View style={styles.activeBadge}>
            <AppText variant="caption" weight="800" color="#2E7D32" style={{ fontSize: 9 }}>
              ACTIVE
            </AppText>
          </View>
        ) : isPopular ? (
          <View style={styles.popularBadge}>
            <AppText variant="caption" weight="800" color="#FFFFFF" style={{ fontSize: 9 }}>
              POPULAR
            </AppText>
          </View>
        ) : onPress ? (
          <View style={styles.upgradeBadge}>
            <AppText variant="caption" weight="800" color="#2E7D32" style={{ fontSize: 9 }}>
              UPGRADE
            </AppText>
          </View>
        ) : null}
      </View>

      {/* Pricing Row */}
      <View style={styles.priceContainer}>
        <View style={styles.priceRow}>
          <AppText variant="h2" weight="800" color="#0F172A" style={styles.priceText} numberOfLines={1}>
            {price}
            <AppText variant="caption" weight="600" color="#64748B" style={{ fontSize: 12 }}>
              {` ${period}`}
            </AppText>
          </AppText>
        </View>
        {badge && !isPopular ? (
          <View style={styles.saveBadge}>
            <AppText variant="caption" weight="800" color="#B47E00" style={{ fontSize: 9 }}>
              {badge}
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.cardDivider} />

      {/* Features List */}
      <View style={styles.featureList}>
        {features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Ionicons
              name="checkmark"
              size={13}
              color={isActive ? '#2E7D32' : isPopular ? '#D4A017' : '#2E7D32'}
              style={styles.checkIcon}
            />
            <AppText variant="caption" color="#475569" weight="600" style={styles.featureText}>
              {f}
            </AppText>
          </View>
        ))}
      </View>

      {renewLabel ? (
        <View style={styles.renewRow}>
          <Ionicons name="time-outline" size={12} color="#64748B" />
          <AppText variant="caption" color="#64748B" weight="600" style={styles.renewText}>
            {renewLabel}
          </AppText>
        </View>
      ) : null}
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
  const { premiumStatus: status, isPremium, refetch: refetchPremium } = usePremiumStatus();
  const [invoices, setInvoices] = useState<PaymentInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const { showToast, showErrorToast } = useToast();

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [livePlans, setLivePlans] = useState<any[]>([]);

  useEffect(() => {
    let purchaseUpdateSubscription: any;
    let purchaseErrorSubscription: any;

    const setupIapListeners = async () => {
      try {
        await initConnection();
        
        purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
          const receipt = purchase.purchaseToken;
          if (receipt) {
            try {
              setCheckoutLoading(true);
              const { verifyGooglePlayPurchase } = require('@/services/premium/premiumApi');
              const verifyRes = await verifyGooglePlayPurchase(token!, {
                productId: purchase.productId,
                purchaseToken: purchase.purchaseToken!,
                packageName: 'com.anonymous.PetHorizon',
              });

              if (verifyRes.success) {
                await finishTransaction({ purchase, isConsumable: false });
                showToast('Successfully subscribed to Premium!');
                await reload();
              } else {
                throw new Error('Verification failed.');
              }
            } catch (err) {
              Alert.alert('Verification Failed', 'Could not verify your purchase with Google Play. Please try again or contact support.');
            } finally {
              setCheckoutLoading(false);
            }
          }
        });

        purchaseErrorSubscription = purchaseErrorListener((error) => {
          console.warn('Google Play purchase error:', error);
          setCheckoutLoading(false);
        });
      } catch (err) {
        console.log('IAP Listener Setup Error:', err);
      }
    };

    const fetchLivePlans = async () => {
      console.log('[IAP Diagnostics] Starting Billing screen plan load...');
      console.log('[IAP Diagnostics] Target Product ID: pethorizon_premium');
      console.log('[IAP Diagnostics] Query Type: subs');
      try {
        console.log('[IAP Diagnostics] Initializing connection to Google Play Store...');
        const connResult = await initConnection();
        console.log('[IAP Diagnostics] Connection initialization result:', connResult);

        console.log('[IAP Diagnostics] Calling fetchProducts with SKU: pethorizon_premium...');
        const products = await fetchProducts({ skus: ['pethorizon_premium'], type: 'subs' });
        console.log('[IAP Diagnostics] fetchProducts succeeded. Result count:', products?.length ?? 0);
        console.log('[IAP Diagnostics] Returned product list details:', JSON.stringify(products, null, 2));

        if (products && products.length > 0) {
          const premiumProduct = products.find(
            (p: any) => p.productId === 'pethorizon_premium' || p.id === 'pethorizon_premium'
          );
          if (premiumProduct) {
            const mapped: any[] = [];
            
            // Map standard subscriptionOffers
            const offers = premiumProduct.subscriptionOffers || [];
            console.log('[IAP Diagnostics] subscriptionOffers count in Billing:', offers.length);
            offers.forEach((offer: any) => {
              const basePlanId = offer.basePlanIdAndroid || offer.basePlanId;
              if (basePlanId === 'monthly' || basePlanId === 'yearly') {
                console.log(`[IAP Diagnostics] Found basePlanId=${basePlanId} in subscriptionOffers`);
                mapped.push({
                  productId: 'pethorizon_premium',
                  basePlanId,
                  offerToken: offer.offerTokenAndroid || offer.offerToken || '',
                });
              }
            });

            // Map legacy subscriptionOfferDetailsAndroid
            if (mapped.length === 0 && (premiumProduct as any).subscriptionOfferDetailsAndroid) {
              console.log('[IAP Diagnostics] Fallback to subscriptionOfferDetailsAndroid count:', (premiumProduct as any).subscriptionOfferDetailsAndroid.length);
              (premiumProduct as any).subscriptionOfferDetailsAndroid.forEach((detail: any) => {
                const basePlanId = detail.basePlanId;
                if (basePlanId === 'monthly' || basePlanId === 'yearly') {
                  console.log(`[IAP Diagnostics] Found basePlanId=${basePlanId} in subscriptionOfferDetailsAndroid`);
                  mapped.push({
                    productId: 'pethorizon_premium',
                    basePlanId,
                    offerToken: detail.offerToken || '',
                  });
                }
              });
            }

            console.log('[IAP Diagnostics] Mapped live plans to state:', JSON.stringify(mapped));
            setLivePlans(mapped);
          } else {
            console.warn('[IAP Diagnostics] Product pethorizon_premium not found in query results.');
          }
        } else {
          console.warn('[IAP Diagnostics] Google Play returned no products.');
        }
      } catch (err: any) {
        console.error('[IAP Diagnostics ERROR] Failed to fetch subscriptions from Google Play.');
        console.error('[IAP Diagnostics ERROR] Code:', err?.code || err?.errorCode || 'N/A');
        console.error('[IAP Diagnostics ERROR] Message:', err?.message || err?.message || 'N/A');
        console.error('[IAP Diagnostics ERROR] Full Error Details:', JSON.stringify(err, null, 2));
      }
    };

    if (token) {
      setupIapListeners();
      fetchLivePlans();
    }

    return () => {
      if (purchaseUpdateSubscription) purchaseUpdateSubscription.remove();
      if (purchaseErrorSubscription) purchaseErrorSubscription.remove();
      endConnection();
    };
  }, [token]);

  const handleSelectPlan = async (planId: 'monthly' | 'yearly') => {
    if (isPremium) {
      Alert.alert('Already Premium', 'You already have an active premium subscription.');
      return;
    }
    setCheckoutLoading(true);
    const matched = livePlans.find((p) => p.basePlanId === planId);
    if (!matched) {
      const errorMsg = `Offer for ${planId} plan was not retrieved from Google Play. Please try again.`;
      console.error(errorMsg);
      Alert.alert('Subscription Error', errorMsg);
      setCheckoutLoading(false);
      return;
    }
    const offerToken = matched.offerToken || '';
    console.log(`IAP Requesting Purchase: sku: pethorizon_premium, basePlanId: ${planId}, offerToken: ${offerToken}`);
    try {
      await requestPurchase({
        request: {
          google: {
            skus: ['pethorizon_premium'],
            subscriptionOffers: [
              {
                sku: 'pethorizon_premium',
                offerToken,
              }
            ]
          }
        },
        type: 'subs'
      });
    } catch (error: any) {
      console.error('IAP Purchase Launch Failed:', error);
      console.error('IAP Purchase Launch Failed details:', JSON.stringify(error, null, 2));
      Alert.alert(
        'Purchase Error',
        `Failed to launch Google Play billing flow.\nCode: ${error?.code || 'unknown'}\nMessage: ${error?.message || 'unknown'}`
      );
      setCheckoutLoading(false);
    }
  };

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [, invoiceList] = await Promise.all([
        refetchPremium(),
        fetchPaymentInvoices(token),
      ]);
      setInvoices(invoiceList);
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, refetchPremium]);

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
              <View style={{ flex: 1 }}>
                <AppText variant="bodySmall" weight="800" color="#1E293B">
                  Active Subscription
                </AppText>
                <AppText variant="caption" color="#64748B" style={{ fontSize: 11 }}>
                  Premium member benefits unlocked
                </AppText>
              </View>
              <View style={styles.detailsActiveBadge}>
                <AppText variant="caption" weight="800" color="#2E7D32" style={{ fontSize: 9 }}>
                  ACTIVE
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
            price="Free"
            period="forever"
            isActive={!isPremium}
          />

          <PlanCard
            title="Monthly Premium"
            icon="star-outline"
            features={MONTHLY_FEATURES}
            price="$4.99"
            period="/ month"
            isActive={isMonthlyActive}
            renewLabel={isMonthlyActive ? renewLabel : undefined}
            onPress={!isMonthlyActive ? () => handleSelectPlan('monthly') : undefined}
          />

          <PlanCard
            title="Yearly Premium"
            icon="ribbon-outline"
            features={YEARLY_FEATURES}
            price="$49.99"
            period="/ year"
            badge="SAVE 17%"
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
    gap: 10,
    marginBottom: Spacing.lg,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md || 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  planCardActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#F6FBF6',
    borderWidth: 1.2,
  },
  planCardPopular: {
    borderColor: '#D4A017',
    borderWidth: 1.5,
    backgroundColor: '#FFFDF0',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#D4A017',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  popularTopStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#D4A017',
  },
  popularBadge: {
    backgroundColor: '#D4A017',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  activeBadgePremium: {
    backgroundColor: '#FEF3C7',
    borderColor: 'rgba(212, 160, 23, 0.3)',
  },
  upgradeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 22,
    lineHeight: 26,
  },
  periodText: {
    marginLeft: 3,
  },
  saveBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.15)',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: Spacing.xs,
  },
  featureList: {
    gap: 4,
    marginBottom: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: 6,
  },
  featureText: {
    flex: 1,
    lineHeight: 18,
  },
  renewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  renewText: {
    fontSize: 11,
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
    borderRadius: Radius.md || 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.lg,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsActiveBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  detailsGrid: {
    gap: 6,
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
