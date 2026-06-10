import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { fetchGroomingAlerts, fetchUpcomingGrooming } from '@/services/grooming/groomingApi';
import type { GroomingRecord } from '@/types/grooming';

interface GroomingAlertsRowProps {
  token: string | null;
  petId: string | null | undefined;
  onAlertPress?: (record: GroomingRecord) => void;
}

export function GroomingAlertsRow({ token, petId, onAlertPress }: GroomingAlertsRowProps) {
  const [alerts, setAlerts] = useState<GroomingRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!token || !petId) {
      setAlerts([]);
      return;
    }
    setLoading(true);
    try {
      const [alertsData, upcomingData] = await Promise.all([
        fetchGroomingAlerts(token, { petId, withinDays: 7 }),
        fetchUpcomingGrooming(token),
      ]);
      const upcomingForPet = upcomingData.filter((item) => item.petId === petId);
      const merged = [...alertsData, ...upcomingForPet];
      const unique = merged.filter(
        (item, index, arr) => arr.findIndex((other) => other._id === item._id) === index,
      );
      setAlerts(unique.slice(0, 2));
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [token, petId]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading) {
    return <ActivityIndicator color={HomeTheme.cardGreen} style={styles.loader} />;
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      {alerts.map((alert) => (
        <View key={alert._id} style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="cut-outline" size={18} color={HomeTheme.cardGreen} />
          </View>
          <AppText variant="bodySmall" weight="800" color={HomeTheme.text} numberOfLines={1}>
            Grooming {alert.alertType === 'overdue' ? 'Overdue' : 'Due'}
          </AppText>
          <AppText variant="caption" color={HomeTheme.textMuted} numberOfLines={2} style={styles.subtitle}>
            {alert.groomingType}
            {alert.remainingDays != null ? ` · ${alert.remainingDays}d` : ''}
          </AppText>
          {onAlertPress ? (
            <TouchableOpacity onPress={() => onAlertPress(alert)}>
              <AppText variant="caption" weight="700" color={HomeTheme.cardGreen}>
                Manage
              </AppText>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  loader: {
    marginBottom: Spacing.lg,
  },
  card: {
    flex: 1,
    backgroundColor: HomeTheme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: HomeTheme.surfaceMuted,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
});
