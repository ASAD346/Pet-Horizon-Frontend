import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Platform,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { SheetColors } from '../sheets/sheetUi';
import { Radius, Spacing, HomeTheme } from '../../constants/theme';
import { API_EXPENSE_CATEGORIES } from '@/lib/expense/expenseMappers';
import { getErrorMessage } from '@/lib/api/errors';
import { createExpense } from '@/services/expense/expenseApi';
import { useLocalization } from '@/hooks/useLocalization';
import { FormSheetShell, FormTextInput, useAppThemeColor, FormSheetColors } from '../sheets';
import { useToast } from '@/hooks/useToast';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Skeleton } from '@/components/ui/Skeleton';

import type { ApiExpense } from '@/types/expense';

interface AddExpenseViewProps {
  visible: boolean;
  petId?: string | null;
  token?: string | null;
  onClose: () => void;
  onSaved?: (expense: ApiExpense, budgetStatus?: any) => void;
  isPremium?: boolean;
}

const CATEGORY_ITEMS: {
  value: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  bg: string;
}[] = [
  { value: 'food', label: 'Food', icon: 'silverware-fork-knife', color: '#16A34A', bg: '#DCFCE7' },
  { value: 'vet', label: 'Vet & Health', icon: 'medical-bag', color: '#2563EB', bg: '#DBEAFE' },
  { value: 'grooming', label: 'Grooming', icon: 'content-cut', color: '#9333EA', bg: '#F3E8FF' },
  { value: 'medicine', label: 'Medicine', icon: 'pill', color: '#EA580C', bg: '#FFEDD5' },
  { value: 'accessories', label: 'Accessories', icon: 'tag-heart', color: '#E11D48', bg: '#FFE4E6' },
  { value: 'training', label: 'Training', icon: 'school', color: '#4F46E5', bg: '#EEF2FF' },
  { value: 'boarding', label: 'Boarding', icon: 'home-heart', color: '#0D9488', bg: '#CCFBF1' },
  { value: 'other', label: 'Other', icon: 'dots-horizontal', color: '#475569', bg: '#F1F5F9' },
];

export function AddExpenseView({
  visible,
  petId,
  token,
  onClose,
  onSaved,
  isPremium = false,
}: AddExpenseViewProps) {
  const { currency } = useLocalization();
  const { showToast } = useToast();

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

  const [category, setCategory] = useState<string>('food');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountRef = useRef<TextInput>(null);
  const { accentColor } = useAppThemeColor();
  const [activeField, setActiveField] = useState<'amount' | 'merchant' | 'note' | null>(null);

  const handleSubmit = async () => {
    if (!canEdit) {
      showToast('Read-only access: You cannot modify this entry.');
      return;
    }
    if (saving || resolvedReadOnly) return;
    if (!petId || !token) {
      setError('Select a pet before adding an expense.');
      return;
    }
    if (!category) {
      setError('Select a category.');
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
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const localDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      const data = await createExpense(token, {
        petId,
        category: category ?? 'other',
        amount: value,
        note: [merchant.trim(), note.trim()].filter(Boolean).join(' — ') || undefined,
        date: localDate,
      });
      showToast('Expense added successfully!');

      setAmount('');
      setMerchant('');
      setNote('');
      setCategory('food');
      setError(null);

      onSaved?.(data.expense, data.budgetStatus);
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setError(errMsg);
      showToast(`Failed to add expense: ${errMsg}`);
    } finally {
      setSaving(false);
    }
  };

  React.useEffect(() => {
    if (!visible) {
      setAmount('');
      setMerchant('');
      setNote('');
      setCategory('food');
      setError(null);
    }
  }, [visible]);

  if (permissionsLoading) {
    return (
      <FormSheetShell
        visible={visible}
        onClose={onClose}
        title="Add Expense"
        subtitle="Track your pet's daily spending"
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
      title="Add Expense"
      subtitle="Track your pet's daily spending"
      icon="wallet-outline"
      saveLabel={resolvedReadOnly ? undefined : 'Save Expense'}
      onSave={handleSubmit}
      saving={saving}
      saveDisabled={saving || !amount || resolvedReadOnly}
      error={error}
      isReadOnly={resolvedReadOnly}
      compact
    >
      <View style={styles.formContainer}>
        {/* Category Card */}
        <View style={styles.sectionCard}>
          <AppText variant="caption" weight="700" color="#64748B" style={styles.sectionHeader}>
            CATEGORY <AppText variant="caption" weight="700" color="#EF4444">*</AppText>
          </AppText>
          <View style={styles.categoryGrid}>
            {CATEGORY_ITEMS.map((item) => {
              const isSelected = category === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.chipCard,
                    isSelected && {
                      borderColor: item.color,
                      backgroundColor: item.bg,
                    },
                  ]}
                  onPress={() => setCategory(item.value)}
                  activeOpacity={0.7}
                  disabled={resolvedReadOnly}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={20}
                    color={isSelected ? item.color : '#64748B'}
                  />
                  <AppText
                    variant="caption"
                    weight={isSelected ? '700' : '600'}
                    color={isSelected ? item.color : '#334155'}
                    style={styles.chipText}
                  >
                    {item.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Amount Card */}
        <View style={styles.sectionCard}>
          <AppText variant="caption" weight="700" color="#64748B" style={styles.sectionHeader}>
            AMOUNT <AppText variant="caption" weight="700" color="#EF4444">*</AppText>
          </AppText>
          <Pressable
            onPress={() => amountRef.current?.focus()}
            style={[
              styles.amountField,
              activeField === 'amount' && { borderColor: '#16A34A', borderWidth: 1.5 },
            ]}
          >
            <AppText
              variant="h2"
              weight="800"
              color={activeField === 'amount' ? '#16A34A' : '#64748B'}
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
              placeholder="0.00"
              placeholderTextColor={SheetColors.placeholder}
              onFocus={() => setActiveField('amount')}
              onBlur={() => setActiveField(null)}
              editable={!resolvedReadOnly}
            />
          </Pressable>
        </View>

        {/* Merchant & Notes Card */}
        <View style={styles.sectionCard}>
          <AppText variant="caption" weight="700" color="#64748B" style={styles.sectionHeader}>
            DETAILS & NOTES
          </AppText>

          <FormTextInput
            label="Store or Vendor"
            value={merchant}
            onChangeText={setMerchant}
            placeholder="e.g. PetSmart, Vet Clinic, Chewy"
          />

          <FormTextInput
            label="Notes"
            value={note}
            onChangeText={setNote}
            placeholder="Optional details..."
            multiline
          />
        </View>
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipCard: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  chipText: {
    fontSize: 12,
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
});
