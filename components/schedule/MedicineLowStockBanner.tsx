import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { fetchMedicineLowStock } from '@/services/schedules/medicineApi';
import type { MedicineScheduleItem } from '@/types/medicine';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';

interface MedicineLowStockBannerProps {
  token: string | null;
  petId: string | null;
}

export function MedicineLowStockBanner({ token, petId }: MedicineLowStockBannerProps) {
  const [items, setItems] = useState<MedicineScheduleItem[]>([]);

  const reload = useCallback(async () => {
    if (!token) {
      setItems([]);
      return;
    }
    try {
      const data = await fetchMedicineLowStock(token);
      const filtered = petId ? data.filter((item) => item.petId === petId) : data;
      setItems(filtered);
    } catch {
      setItems([]);
    }
  }, [token, petId]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (items.length === 0) return null;

  return (
    <View style={styles.banner}>
      <AppText variant="caption" weight="800" color="#C62828">
        Low medicine stock
      </AppText>
      {items.map((item) => (
        <AppText key={item._id} variant="caption" color={HomeTheme.textMuted}>
          {item.metadata?.medicineName ?? item.title}: {item.metadata?.remainingPills ?? 0} pills left
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFEBEE',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    gap: 2,
  },
});
