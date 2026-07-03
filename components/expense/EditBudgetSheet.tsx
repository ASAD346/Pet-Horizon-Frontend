import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
  const { canEdit } = usePermissionGuard(petId, 'expenses');
  const resolvedReadOnly = !canEdit;

  const [amount, setAmount] = useState('');
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly'>(initialPeriodType);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (visible) {
      setAmount(currentLimit != null ? String(currentLimit) : '');
      setPeriodType(initialPeriodType);
      setError(null);
    }
  }, [visible, currentLimit, initialPeriodType]);

  const handleSave = async () => {
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
        await updateBudget(token, budgetId, { amountLimit: limit, periodType });
      } else {
        await setBudget(token, { petId, amountLimit: limit, periodType });
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

  return (
    <FormSheetShell
      visible={visible}
      onClose={onClose}
      title={budgetId ? 'Edit Budget' : 'Set Budget'}
      subtitle="Configure your spending limit"
      icon="wallet-outline"
      saveLabel={resolvedReadOnly ? undefined : "Save Budget"}
      onSave={resolvedReadOnly ? undefined : handleSave}
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
            Active Period: {new Date(periodStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(periodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
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
});
