import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Switch, TouchableOpacity, TextInput, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import {
  FormSheetShell,
  FormSegmentedControl,
  FormSheetColors,
} from '@/components/sheets';
import { SheetColors } from '../sheets/sheetUi';
import { Radius, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/api/errors';
import { setBudget, updateBudget } from '@/services/expense/expenseApi';
import { useLocalization } from '@/hooks/useLocalization';
import { useToast } from '@/hooks/useToast';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/pet/birthdayUtils';

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
  autoRenew?: boolean;
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
  autoRenew: initialAutoRenew = true,
}: EditBudgetSheetProps) {
  const { currency } = useLocalization();
  const { canEdit, loading: permissionsLoading } = usePermissionGuard(petId, 'expenses');
  const resolvedReadOnly = !canEdit;

  const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    GBP: '£',
    CAD: '$',
    AUD: '$',
    EUR: '€',
  };
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';

  const [amount, setAmount] = useState('');
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly'>(initialPeriodType);
  const [autoRenew, setAutoRenew] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const amountRef = useRef<TextInput>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (visible) {
      setAmount(currentLimit != null && currentLimit > 0 ? String(currentLimit) : '');
      setPeriodType(initialPeriodType);
      setAutoRenew(initialAutoRenew ?? true);
      setError(null);
    }
  }, [visible, currentLimit, initialPeriodType, initialAutoRenew]);

  const handleSave = async () => {
    if (!canEdit) {
      showToast('Read-only access: You cannot modify this entry.');
      return;
    }
    if (saving || resolvedReadOnly) return;
    if (!token || !petId) return;
    const limit = Number(amount);
    if (!limit || Number.isNaN(limit) || limit <= 0) {
      setError('Please enter a valid budget limit amount.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (budgetId) {
        await updateBudget(token, budgetId, { amountLimit: limit, periodType, autoRenew });
      } else {
        await setBudget(token, { petId, amountLimit: limit, periodType, autoRenew });
      }
      showToast('Budget configured successfully!');
      onSaved(periodType);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (permissionsLoading) {
    return (
      <FormSheetShell
        visible={visible}
        onClose={onClose}
        title={budgetId ? 'Edit Budget' : 'Set Budget'}
        subtitle="Configure your pet spending limit"
        icon="wallet-outline"
        saveLabel={undefined}
        onSave={undefined}
        saving={false}
        error={null}
        isReadOnly={true}
        isLoading={true}
        compact
      >
        <View style={{ padding: 16, gap: 16 }}>
          <Skeleton width="40%" height={16} />
          <Skeleton width="100%" height={48} borderRadius={8} />
          <Skeleton width="30%" height={16} style={{ marginTop: 8 }} />
          <Skeleton width="100%" height={48} borderRadius={8} />
        </View>
      </FormSheetShell>
    );
  }

  return (
    <FormSheetShell
      visible={visible}
      onClose={onClose}
      title={budgetId ? 'Edit Budget' : 'Set Budget'}
      subtitle="Configure your pet spending limit"
      icon="wallet-outline"
      saveLabel={resolvedReadOnly ? undefined : 'Save Budget'}
      onSave={handleSave}
      saving={saving}
      saveDisabled={resolvedReadOnly || !amount}
      error={error}
      isReadOnly={resolvedReadOnly}
      compact
    >
      <View style={styles.formContainer}>
        {periodStart && periodEnd ? (
          <View style={styles.activePeriodBox}>
            <Ionicons name="calendar-outline" size={14} color="#5C6470" />
            <AppText variant="caption" weight="700" color="#5C6470">
              Active Period: {formatDate(periodStart)} – {formatDate(periodEnd)}
            </AppText>
          </View>
        ) : null}

        {/* Period Card */}
        <View style={styles.sectionCard}>
          <AppText variant="caption" weight="700" color="#64748B" style={styles.sectionHeader}>
            BUDGET CYCLE <AppText variant="caption" weight="700" color="#EF4444">*</AppText>
          </AppText>
          <FormSegmentedControl
            label="Frequency"
            options={[
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ]}
            selected={periodType}
            onSelect={(val) => setPeriodType(val as 'weekly' | 'monthly')}
          />
        </View>

        {/* Limit Amount Card */}
        <View style={styles.sectionCard}>
          <AppText variant="caption" weight="700" color="#64748B" style={styles.sectionHeader}>
            BUDGET LIMIT ({currency}) <AppText variant="caption" weight="700" color="#EF4444">*</AppText>
          </AppText>
          <Pressable
            onPress={() => amountRef.current?.focus()}
            style={[
              styles.amountField,
              isAmountFocused && { borderColor: '#16A34A', borderWidth: 1.5 },
            ]}
          >
            <AppText
              variant="h2"
              weight="800"
              color={isAmountFocused ? '#16A34A' : '#64748B'}
              style={styles.currency}
            >
              {currencySymbol}
            </AppText>
            <TextInput
              ref={amountRef}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={styles.amountInput}
              placeholder="e.g. 250"
              placeholderTextColor={SheetColors.placeholder}
              onFocus={() => setIsAmountFocused(true)}
              onBlur={() => setIsAmountFocused(false)}
              editable={!resolvedReadOnly}
            />
          </Pressable>
        </View>

        {/* Auto-renew card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setAutoRenew(!autoRenew)}
          disabled={resolvedReadOnly}
          style={[
            styles.autoRenewCard,
            autoRenew ? styles.autoRenewCardActive : styles.autoRenewCardInactive,
          ]}
        >
          <View
            style={[
              styles.autoRenewIconBadge,
              { backgroundColor: autoRenew ? '#E8F5E9' : '#F3F4F6' },
            ]}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={autoRenew ? '#2E7D32' : '#9CA3AF'}
            />
          </View>

          <View style={styles.autoRenewTextCol}>
            <AppText variant="bodySmall" weight="700" color={autoRenew ? '#1C3A1E' : '#374151'}>
              Auto-renew budget
            </AppText>
            <AppText
              variant="caption"
              weight="500"
              color={autoRenew ? '#4CAF50' : '#9CA3AF'}
              style={styles.autoRenewSub}
            >
              {autoRenew
                ? `Resets every ${periodType === 'weekly' ? 'week' : 'month'} automatically`
                : 'One-time budget — expires after this period'}
            </AppText>
          </View>

          <Switch
            value={autoRenew}
            onValueChange={setAutoRenew}
            trackColor={{ false: '#E5E7EB', true: '#A5D6A7' }}
            thumbColor={autoRenew ? '#2E7D32' : '#FFFFFF'}
            ios_backgroundColor="#E5E7EB"
            disabled={resolvedReadOnly}
          />
        </TouchableOpacity>
      </View>
    </FormSheetShell>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    gap: 14,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
  },
  sectionHeader: {
    letterSpacing: 0.6,
    marginBottom: -2,
  },
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FormSheetColors.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: FormSheetColors.inputBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    gap: Spacing.xs,
  },
  currency: {
    fontSize: 22,
    lineHeight: 28,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    padding: 0,
  },
  activePeriodBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F5F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  autoRenewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
  },
  autoRenewCardActive: {
    backgroundColor: '#F0FAF0',
    borderColor: '#A5D6A7',
  },
  autoRenewCardInactive: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E5E7EB',
  },
  autoRenewIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoRenewTextCol: {
    flex: 1,
    gap: 2,
  },
  autoRenewSub: {
    lineHeight: 15,
  },
});
