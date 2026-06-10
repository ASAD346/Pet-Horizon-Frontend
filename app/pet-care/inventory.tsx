import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { FormField } from '@/components/pet-care/FormField';
import { useAuth } from '@/contexts/AuthContext';
import { useActivePet } from '@/hooks/useActivePet';
import { useInventory } from '@/hooks/useInventory';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';

type ModalMode = 'restock' | 'adjust' | 'item' | null;

export default function InventoryScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { pet } = useActivePet(token);
  const petId = pet?._id ?? null;

  const { summary, items, transactions, lowStock, loading, error, actionId, reload, createItem, restock, adjust } =
    useInventory(token, petId, Boolean(petId));

  const [refreshing, setRefreshing] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [amount, setAmount] = useState('');
  const [itemName, setItemName] = useState('');
  const [unit, setUnit] = useState('');
  const [lowThreshold, setLowThreshold] = useState('');

  const closeModal = () => {
    setModalMode(null);
    setAmount('');
    setItemName('');
    setUnit('');
    setLowThreshold('');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!petId) return;
    try {
      if (modalMode === 'restock') {
        const parsed = Number(amount);
        if (!parsed || parsed <= 0) {
          Alert.alert('Invalid amount', 'Enter a positive restock amount.');
          return;
        }
        await restock({
          petId,
          amount: parsed,
          unit: unit || undefined,
          inventoryItemId: summary?.itemId,
        });
      } else if (modalMode === 'adjust') {
        const parsed = Number(amount);
        if (Number.isNaN(parsed) || parsed < 0) {
          Alert.alert('Invalid stock', 'Enter a valid current stock value.');
          return;
        }
        await adjust({ petId, currentStock: parsed, inventoryItemId: summary?.itemId });
      } else if (modalMode === 'item') {
        if (!itemName.trim()) {
          Alert.alert('Name required', 'Enter an item name.');
          return;
        }
        await createItem({
          petId,
          itemName: itemName.trim(),
          unit: unit || undefined,
          quantity: Number(amount) || 0,
          lowThreshold: Number(lowThreshold) || 0,
        });
      }
      closeModal();
    } catch (err) {
      Alert.alert('Action failed', err instanceof Error ? err.message : 'Could not update inventory.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ProfileScreenHeader title="Inventory" onBack={() => router.back()} />

      {error ? (
        <View style={styles.banner}>
          <AuthErrorBanner message={error} />
        </View>
      ) : null}

      {loading && !summary ? (
        <ActivityIndicator color={HomeTheme.cardGreen} style={styles.loader} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={HomeTheme.cardGreen} />
          }
        >
          {summary ? (
            <View style={styles.summaryCard}>
              <AppText variant="caption" weight="700" color={HomeTheme.textMuted}>
                Primary stock
              </AppText>
              <AppText variant="h2" weight="800" color={HomeTheme.text}>
                {summary.currentStock} {summary.unit}
              </AppText>
              <AppText variant="bodySmall" color={HomeTheme.textMuted}>
                {summary.itemName} · Low at {summary.lowThreshold} {summary.unit}
              </AppText>
              {lowStock?.isLow ? (
                <View style={styles.lowBadge}>
                  <AppText variant="caption" weight="700" color="#C62828">
                    Low stock alert
                  </AppText>
                </View>
              ) : null}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setModalMode('restock')}>
                  <AppText variant="caption" weight="700" color={HomeTheme.white}>
                    Restock
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setModalMode('adjust')}>
                  <AppText variant="caption" weight="700" color={HomeTheme.cardGreen}>
                    Adjust
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <View style={styles.sectionHeader}>
            <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
              Items
            </AppText>
            <TouchableOpacity onPress={() => setModalMode('item')}>
              <AppText variant="caption" weight="700" color={HomeTheme.cardGreen}>
                Add item
              </AppText>
            </TouchableOpacity>
          </View>
          {items.length === 0 ? (
            <AppText variant="caption" color={HomeTheme.textMuted}>
              No inventory items yet.
            </AppText>
          ) : (
            items.map((item) => (
              <View key={item._id} style={styles.listCard}>
                <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
                  {item.itemName}
                </AppText>
                <AppText variant="caption" color={HomeTheme.textMuted}>
                  {item.quantity} {item.unit || 'units'} · threshold {item.lowThreshold ?? 0}
                </AppText>
              </View>
            ))
          )}

          <AppText variant="bodySmall" weight="800" color={HomeTheme.text} style={styles.sectionTitle}>
            Recent transactions
          </AppText>
          {transactions.length === 0 ? (
            <AppText variant="caption" color={HomeTheme.textMuted}>
              No transactions yet.
            </AppText>
          ) : (
            transactions.slice(0, 20).map((tx) => (
              <View key={tx._id} style={styles.listCard}>
                <AppText variant="bodySmall" weight="700" color={HomeTheme.text}>
                  {tx.delta > 0 ? '+' : ''}
                  {tx.delta} · {tx.reason ?? 'update'}
                </AppText>
                <AppText variant="caption" color={HomeTheme.textMuted}>
                  {tx.note ?? ''}{' '}
                  {tx.createdAt
                    ? new Date(tx.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric' })
                    : ''}
                </AppText>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={modalMode !== null} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText variant="h3" weight="800" color={HomeTheme.text} style={styles.modalTitle}>
              {modalMode === 'restock' ? 'Restock' : modalMode === 'adjust' ? 'Adjust stock' : 'Add item'}
            </AppText>
            {modalMode === 'item' ? (
              <FormField label="Item name" value={itemName} onChangeText={setItemName} placeholder="Dog food" />
            ) : null}
            <FormField
              label={modalMode === 'adjust' ? 'Current stock' : modalMode === 'restock' ? 'Amount to add' : 'Quantity'}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
            />
            {modalMode !== 'adjust' ? (
              <FormField label="Unit (optional)" value={unit} onChangeText={setUnit} placeholder="kg, bags…" />
            ) : null}
            {modalMode === 'item' ? (
              <FormField
                label="Low threshold"
                value={lowThreshold}
                onChangeText={setLowThreshold}
                keyboardType="numeric"
                placeholder="0"
              />
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <AppText variant="bodySmall" weight="700" color={HomeTheme.textMuted}>
                  Cancel
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={Boolean(actionId)}>
                <AppText variant="bodySmall" weight="700" color={HomeTheme.white}>
                  Save
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: HomeTheme.background },
  banner: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  loader: { marginTop: Spacing.xl },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.sm },
  summaryCard: {
    backgroundColor: HomeTheme.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  lowBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
  },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  primaryBtn: {
    backgroundColor: HomeTheme.cardGreen,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: HomeTheme.cardGreen,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  sectionTitle: { marginTop: Spacing.md },
  listCard: {
    backgroundColor: HomeTheme.white,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: HomeTheme.background,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.lg,
  },
  modalTitle: { marginBottom: Spacing.md },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.md },
  cancelBtn: { padding: Spacing.sm },
  saveBtn: {
    backgroundColor: HomeTheme.cardGreen,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
});
