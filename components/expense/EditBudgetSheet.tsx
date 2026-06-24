import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { SheetColors } from '@/components/sheets';
import { Radius, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/api/errors';
import { setBudget, updateBudget } from '@/services/expense/expenseApi';

const BRAND_GREEN = '#2E7D32';

interface EditBudgetSheetProps {
  visible: boolean;
  petId: string | null;
  token: string | null;
  budgetId?: string;
  currentLimit?: number;
  periodType?: 'weekly' | 'monthly';
  onClose: () => void;
  onSaved: (savedPeriod?: 'weekly' | 'monthly') => void;
  isPremium?: boolean;
  periodStart?: string;
  periodEnd?: string;
}

export function EditBudgetSheet({
  visible,
  petId,
  token,
  budgetId,
  currentLimit,
  periodType: initialPeriodType = 'weekly',
  onClose,
  onSaved,
  isPremium = false,
  periodStart,
  periodEnd,
}: EditBudgetSheetProps) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly'>(initialPeriodType);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAmountFocused, setIsAmountFocused] = useState(false);

  useEffect(() => {
    if (visible) {
      setAmount(currentLimit != null ? String(currentLimit) : '');
      setPeriodType(initialPeriodType);
      setError(null);
    }
  }, [visible, currentLimit, initialPeriodType]);

  const handleSave = async () => {
    if (!token || !petId) return;
    const limit = Number(amount);
    if (!limit || Number.isNaN(limit) || limit <= 0) {
      setError('Enter a valid budget amount.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (budgetId) {
        await updateBudget(token, budgetId, { amountLimit: limit, periodType });
      } else {
        await setBudget(token, { petId, amountLimit: limit, periodType });
      }
      onSaved(periodType);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const headerColors = isPremium
    ? (['#0E3821', '#184F2E', '#267343'] as const)
    : (['#3A8F3B', '#5CB35D'] as const);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <Pressable style={styles.overlayInner} onPress={onClose}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
            onPress={() => {}}
          >
            {/* Gradient header */}
            <LinearGradient
              colors={headerColors as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientHeader}
            >
              {/* Handle bar inside gradient */}
              <View style={styles.handle} />

              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <View style={styles.headerIconBadge}>
                    <Ionicons name="wallet-outline" size={18} color="#FFFFFF" />
                  </View>
                  <View>
                    <AppText variant="h3" weight="800" color="#FFFFFF" style={styles.headerTitle}>
                      {budgetId ? 'Edit Budget' : 'Set Budget'}
                    </AppText>
                    <AppText variant="caption" color="rgba(255,255,255,0.75)">
                      Configure your spending limit
                    </AppText>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={12}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={20} color="rgba(255,255,255,0.85)" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {error ? (
              <View style={styles.errorWrapper}>
                <AuthErrorBanner message={error} />
              </View>
            ) : null}

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Active Period Range */}
              {periodStart && periodEnd ? (
                <View style={styles.activePeriodBox}>
                  <Ionicons name="calendar-outline" size={16} color="#475569" />
                  <AppText variant="caption" weight="700" color="#475569">
                    Active Period: {new Date(periodStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(periodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </AppText>
                </View>
              ) : null}

              {/* Budget Period */}
              <View style={styles.labelRow}>
                <View style={styles.labelDot} />
                <AppText variant="caption" weight="800" color="#64748B" style={styles.labelText}>
                  BUDGET PERIOD
                </AppText>
              </View>
              <View style={styles.periodRow}>
                {(['weekly', 'monthly'] as const).map((option) => {
                  const selected = periodType === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.periodChip, selected && styles.periodChipActive]}
                      onPress={() => setPeriodType(option)}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={option === 'weekly' ? 'calendar-outline' : 'calendar'}
                        size={16}
                        color={selected ? '#FFFFFF' : '#64748B'}
                      />
                      <AppText
                        variant="bodySmall"
                        weight="700"
                        color={selected ? '#FFFFFF' : '#475569'}
                      >
                        {option === 'weekly' ? 'Weekly' : 'Monthly'}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Budget Amount */}
              <View style={styles.labelRow}>
                <View style={[styles.labelDot, isAmountFocused && styles.labelDotActive]} />
                <AppText
                  variant="caption"
                  weight="800"
                  color={isAmountFocused ? BRAND_GREEN : '#64748B'}
                  style={styles.labelText}
                >
                  BUDGET LIMIT (USD)
                </AppText>
              </View>
              <View style={[styles.amountInputRow, isAmountFocused && styles.amountInputRowActive]}>
                <AppText variant="h2" weight="800" color={isAmountFocused ? BRAND_GREEN : '#94A3B8'} style={styles.currencySymbol}>
                  $
                </AppText>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  style={styles.amountInput}
                  placeholder="500"
                  placeholderTextColor={SheetColors.placeholder}
                  onFocus={() => setIsAmountFocused(true)}
                  onBlur={() => setIsAmountFocused(false)}
                />
              </View>
            </ScrollView>

            <AppButton
              title={saving ? 'Saving…' : 'Save Budget'}
              onPress={handleSave}
              loading={saving}
              variant="success"
              size="md"
              style={styles.saveBtn}
            />
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  overlayInner: {
    flex: 1,
    backgroundColor: 'rgba(15, 30, 15, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FAFFFE',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: 0,
    maxHeight: '94%',
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.lg,
  },
  gradientHeader: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 22,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrapper: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  activePeriodBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
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
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  periodChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  periodChipActive: {
    backgroundColor: BRAND_GREEN,
    borderColor: BRAND_GREEN,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  amountInputRowActive: {
    borderColor: BRAND_GREEN,
    ...Platform.select({
      ios: {
        shadowColor: BRAND_GREEN,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  currencySymbol: {
    fontSize: 24,
    lineHeight: 32,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    padding: 0,
  },
  saveBtn: {
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
});
