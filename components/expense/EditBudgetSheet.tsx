import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import {
  FormSheetShell,
  FormSection,
  FormSegmentedControl,
  FormNumberInput,
} from '@/components/sheets';
import { getErrorMessage } from '@/lib/api/errors';
import { setBudget, updateBudget } from '@/services/expense/expenseApi';
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
  const { canEdit, loading: permissionsLoading } = usePermissionGuard(petId, 'expenses');
  const resolvedReadOnly = !canEdit;

  const [amount, setAmount] = useState('');
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly'>(initialPeriodType);
  const [autoRenew, setAutoRenew] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (visible) {
      setAmount(currentLimit != null ? String(currentLimit) : '');
      setPeriodType(initialPeriodType);
      setAutoRenew(initialAutoRenew ?? true);
      setError(null);
    }
  }, [visible, currentLimit, initialPeriodType, initialAutoRenew]);

  const handleSave = async () => {
    if (!canEdit) {
      showToast("Read-only access: You cannot modify this entry.");
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
        subtitle="Configure your spending limit"
        icon="wallet-outline"
        saveLabel={undefined}
        onSave={undefined}
        saving={false}
        error={null}
        isReadOnly={true}
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
      subtitle="Configure your spending limit"
      icon="wallet-outline"
      saveLabel={resolvedReadOnly ? undefined : "Save Budget"}
      onSave={handleSave}
      saving={saving}
      saveDisabled={resolvedReadOnly}
      error={error}
      isReadOnly={resolvedReadOnly}
      compact
    >
      {periodStart && periodEnd ? (
        <View style={styles.activePeriodBox}>
          <Ionicons name="calendar-outline" size={14} color="#5C6470" />
          <AppText variant="caption" weight="700" color="#5C6470">
            Active Period: {formatDate(periodStart)} – {formatDate(periodEnd)}
          </AppText>
        </View>
      ) : null}

      <FormSection title="Budget Settings">
        <FormSegmentedControl
          label="Budget Period"
          options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
          selected={periodType}
          onSelect={(val) => setPeriodType(val as 'weekly' | 'monthly')}
        />

        <FormNumberInput
          label="Budget Limit (USD)"
          value={amount}
          onChangeText={setAmount}
          placeholder="500"
          unit="$"
        />
      </FormSection>

      {/* Auto-renew card */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setAutoRenew(!autoRenew)}
        style={[
          styles.autoRenewCard,
          autoRenew ? styles.autoRenewCardActive : styles.autoRenewCardInactive,
        ]}
      >
        {/* Icon badge */}
        <View style={[
          styles.autoRenewIconBadge,
          { backgroundColor: autoRenew ? '#E8F5E9' : '#F3F4F6' },
        ]}>
          <Ionicons
            name="refresh"
            size={20}
            color={autoRenew ? '#2E7D32' : '#9CA3AF'}
          />
        </View>

        {/* Text */}
        <View style={styles.autoRenewTextCol}>
          <AppText variant="bodySmall" weight="700" color={autoRenew ? '#1C3A1E' : '#374151'}>
            Auto-renew budget
          </AppText>
          <AppText variant="caption" weight="500" color={autoRenew ? '#4CAF50' : '#9CA3AF'} style={styles.autoRenewSub}>
            {autoRenew
              ? `Resets every ${periodType === 'weekly' ? 'week' : 'month'} automatically`
              : 'One-time budget — expires after this period'}
          </AppText>
        </View>

        {/* Switch */}
        <Switch
          value={autoRenew}
          onValueChange={setAutoRenew}
          trackColor={{ false: '#E5E7EB', true: '#A5D6A7' }}
          thumbColor={autoRenew ? '#2E7D32' : '#FFFFFF'}
          ios_backgroundColor="#E5E7EB"
        />
      </TouchableOpacity>
    </FormSheetShell>
  );
}

const styles = StyleSheet.create({
  activePeriodBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F5F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  autoRenewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    marginTop: 12,
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
