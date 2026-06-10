import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { fetchMedicineHistory } from '@/services/schedules/medicineApi';
import type { MedicineHistoryEntry } from '@/types/medicine';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';

interface MedicineHistorySheetProps {
  visible: boolean;
  scheduleId: string | null;
  medicineName?: string;
  token: string | null;
  onClose: () => void;
}

export function MedicineHistorySheet({
  visible,
  scheduleId,
  medicineName,
  token,
  onClose,
}: MedicineHistorySheetProps) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<MedicineHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!token || !scheduleId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchMedicineHistory(token, scheduleId);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, scheduleId]);

  useEffect(() => {
    if (visible) reload();
  }, [visible, reload]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <AppText variant="h3" weight="800" color={HomeTheme.text}>
          Dose history
        </AppText>
        {medicineName ? (
          <AppText variant="caption" color={HomeTheme.textMuted}>
            {medicineName}
          </AppText>
        ) : null}
        {loading ? (
          <ActivityIndicator color={HomeTheme.cardGreen} style={styles.loader} />
        ) : (
          <ScrollView style={styles.list}>
            {items.length === 0 ? (
              <AppText variant="caption" color={HomeTheme.textMuted}>
                No completed doses yet.
              </AppText>
            ) : (
              items.map((item, index) => (
                <View key={`${item.date}-${index}`} style={styles.row}>
                  <AppText variant="bodySmall" weight="700" color={HomeTheme.text}>
                    {new Date(item.date).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </AppText>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    maxHeight: '60%',
    backgroundColor: HomeTheme.background,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.lg,
  },
  loader: {
    marginVertical: Spacing.md,
  },
  list: {
    marginTop: Spacing.sm,
  },
  row: {
    paddingVertical: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HomeTheme.surfaceMuted,
  },
});
