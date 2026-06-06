import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { SectionLabel, SheetColors } from '@/components/sheets';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/api/errors';
import { setBudget, updateBudget } from '@/services/expense/expenseApi';

interface EditBudgetSheetProps {
  visible: boolean;
  petId: string | null;
  token: string | null;
  budgetId?: string;
  currentLimit?: number;
  onClose: () => void;
  onSaved: () => void;
}

export function EditBudgetSheet({
  visible,
  petId,
  token,
  budgetId,
  currentLimit,
  onClose,
  onSaved,
}: EditBudgetSheetProps) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setAmount(currentLimit != null ? String(currentLimit) : '500');
      setError(null);
    }
  }, [visible, currentLimit]);

  const handleSave = async () => {
    if (!token || !petId) return;
    const limit = Number(amount);
    if (!limit || Number.isNaN(limit) || limit <= 0) {
      setError('Enter a valid weekly budget amount.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (budgetId) {
        await updateBudget(token, budgetId, { amountLimit: limit, periodType: 'weekly' });
      } else {
        await setBudget(token, { petId, amountLimit: limit, periodType: 'weekly' });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="h3" weight="800" color={SheetColors.title}>
              Weekly Budget
            </AppText>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={HomeTheme.text} />
            </TouchableOpacity>
          </View>

          {error ? <AuthErrorBanner message={error} /> : null}

          <SectionLabel text="WEEKLY LIMIT ($)" />
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="500"
            placeholderTextColor={SheetColors.placeholder}
          />

          <AppButton
            title="Save Budget"
            onPress={handleSave}
            loading={saving}
            variant="success"
            size="md"
            style={styles.saveBtn}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: SheetColors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SheetColors.sheetBg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: SheetColors.inputText,
    marginBottom: Spacing.md,
  },
  saveBtn: {
    width: '100%',
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
});
