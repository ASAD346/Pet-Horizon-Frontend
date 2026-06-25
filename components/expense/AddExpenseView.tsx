import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AuthErrorBanner } from '../auth/AuthErrorBanner';
import { SheetColors } from '../sheets/sheetUi';
import { Radius, Spacing } from '../../constants/theme';
import { API_EXPENSE_CATEGORIES } from '@/lib/expense/expenseMappers';
import { getErrorMessage } from '@/lib/api/errors';
import { createExpense } from '@/services/expense/expenseApi';
import { ExpenseCategoryChips } from './ExpenseCategoryChips';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';

const BRAND_GREEN = '#2E7D32';
const BRAND_GREEN_LIGHT = '#43A047';

interface AddExpenseViewProps {
  petId?: string | null;
  token?: string | null;
  onClose?: () => void;
  onJournalPress?: () => void;
  onSaved?: () => void;
  embeddedInTabs?: boolean;
  isPremium?: boolean;
}

export function AddExpenseView({
  petId,
  token,
  onClose,
  onJournalPress,
  onSaved,
  embeddedInTabs = false,
  isPremium = false,
}: AddExpenseViewProps) {
  const insets = useSafeAreaInsets();
  const { clearance: tabBarClearance } = useTabBarLayout();
  const footerPadding =
    Math.max(insets.bottom, Spacing.md) + (embeddedInTabs ? tabBarClearance : 0);
  const scrollBottomPadding = embeddedInTabs ? tabBarClearance : Spacing.lg;

  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Focus tracking for premium input states
  const [activeField, setActiveField] = useState<'amount' | 'merchant' | 'note' | null>(null);

  const categoryLabels = API_EXPENSE_CATEGORIES.map((item) => item.label);

  const handleSubmit = async () => {
    if (!petId || !token) {
      setError('Select a pet before adding an expense.');
      return;
    }
    const value = Number(amount);
    if (!value || Number.isNaN(value) || value <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const selected = API_EXPENSE_CATEGORIES.find((item) => item.label === category);
      await createExpense(token, {
        petId,
        category: selected?.value ?? 'other',
        amount: value,
        note: [merchant.trim(), note.trim()].filter(Boolean).join(' — ') || undefined,
      });
      if (onSaved) {
        onSaved();
      } else {
        onClose?.();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Premium gradient header */}
        <LinearGradient
          colors={
            isPremium
              ? (['#0E3821', '#184F2E', '#267343'] as const)
              : (['#3A8F3B', '#5CB35D'] as const)
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBadge}>
                <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#FFFFFF" />
              </View>
              <View>
                <AppText variant="h3" weight="800" color="#FFFFFF" style={styles.headerTitle}>
                  Add Expense
                </AppText>
                <AppText variant="caption" color="rgba(255,255,255,0.75)">
                  Track your pet&apos;s spending
                </AppText>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              style={styles.closeButton}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>
          {/* Accent line */}
          <View style={styles.headerDivider} />
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {error ? (
            <View style={styles.errorWrapper}>
              <AuthErrorBanner message={error} />
            </View>
          ) : null}

          {/* Category */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <View style={styles.labelDot} />
              <AppText variant="caption" weight="800" color="#64748B" style={styles.labelText}>
                CATEGORY
              </AppText>
            </View>
            <ExpenseCategoryChips
              categories={categoryLabels}
              selected={category}
              onSelect={setCategory}
            />
          </View>

          {/* Amount */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <View style={[styles.labelDot, activeField === 'amount' && styles.labelDotActive]} />
              <AppText
                variant="caption"
                weight="800"
                color={activeField === 'amount' ? BRAND_GREEN : '#64748B'}
                style={styles.labelText}
              >
                AMOUNT
              </AppText>
            </View>
            <View style={[styles.amountField, activeField === 'amount' && styles.inputActive]}>
              <AppText
                variant="h2"
                weight="800"
                color={activeField === 'amount' ? BRAND_GREEN : '#94A3B8'}
                style={styles.currency}
              >
                $
              </AppText>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={SheetColors.placeholder}
                onFocus={() => setActiveField('amount')}
                onBlur={() => setActiveField(null)}
              />
            </View>
          </View>

          {/* Merchant */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <View style={[styles.labelDot, activeField === 'merchant' && styles.labelDotActive]} />
              <AppText
                variant="caption"
                weight="800"
                color={activeField === 'merchant' ? BRAND_GREEN : '#64748B'}
                style={styles.labelText}
              >
                MERCHANT
              </AppText>
            </View>
            <View style={[styles.regularField, activeField === 'merchant' && styles.inputActive]}>
              <Ionicons
                name="storefront-outline"
                size={18}
                color={activeField === 'merchant' ? BRAND_GREEN : '#94A3B8'}
              />
              <TextInput
                value={merchant}
                onChangeText={setMerchant}
                style={styles.regularInput}
                placeholder="Store or vendor name"
                placeholderTextColor={SheetColors.placeholder}
                onFocus={() => setActiveField('merchant')}
                onBlur={() => setActiveField(null)}
              />
            </View>
          </View>

          {/* Note */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <View style={[styles.labelDot, activeField === 'note' && styles.labelDotActive]} />
              <AppText
                variant="caption"
                weight="800"
                color={activeField === 'note' ? BRAND_GREEN : '#64748B'}
                style={styles.labelText}
              >
                NOTE <AppText variant="caption" color="#94A3B8">(OPTIONAL)</AppText>
              </AppText>
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a quick note..."
              placeholderTextColor={SheetColors.placeholder}
              style={[styles.noteInput, activeField === 'note' && styles.inputActive]}
              multiline
              textAlignVertical="top"
              onFocus={() => setActiveField('note')}
              onBlur={() => setActiveField(null)}
            />
          </View>
        </ScrollView>

        {/* Footer CTA */}
        <View style={[styles.footer, { paddingBottom: footerPadding }]}>
          <AppButton
            title="Add Expense"
            onPress={handleSubmit}
            loading={saving}
            variant="success"
            size="lg"
            style={styles.submitBtn}
            textStyle={styles.submitText}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  headerGradient: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  headerIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 24,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  errorWrapper: {
    marginBottom: Spacing.md,
  },
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
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
    backgroundColor: BRAND_GREEN,
  },
  labelText: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    gap: Spacing.xs,
  },
  currency: {
    fontSize: 26,
    lineHeight: 34,
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    padding: 0,
  },
  regularField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    gap: Spacing.sm,
    minHeight: 48,
  },
  regularInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
    padding: 0,
  },
  noteInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 100,
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  inputActive: {
    borderColor: BRAND_GREEN,
    ...Platform.select({
      ios: {
        shadowColor: BRAND_GREEN,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAF8',
  },
  submitBtn: {
    borderRadius: Radius.full,
    width: '100%',
    minHeight: 52,
    ...Platform.select({
      ios: {
        shadowColor: BRAND_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  submitText: {
    fontSize: 17,
    fontWeight: '800',
  },
});
