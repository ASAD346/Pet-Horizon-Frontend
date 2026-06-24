import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { fetchGroomingAlerts } from '@/services/grooming/groomingApi';
import type { GroomingRecord } from '@/types/grooming';

interface GroomingAlertsRowProps {
  token: string | null;
  petId: string | null | undefined;
  onAlertPress?: (record: GroomingRecord) => void;
}

function groomingTypeLabel(type: string): string {
  if (!type) return 'Grooming';
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
}

export function GroomingAlertsRow({ token, petId, onAlertPress }: GroomingAlertsRowProps) {
  const [alerts, setAlerts] = useState<GroomingRecord[]>([]);

  const reload = useCallback(async () => {
    if (!token || !petId) {
      setAlerts([]);
      return;
    }
    try {
      const data = await fetchGroomingAlerts(token, { petId, withinDays: 7 });
      setAlerts(data.slice(0, 2));
    } catch {
      setAlerts([]);
    }
  }, [token, petId]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      {alerts.map((alert) => {
        const overdue = alert.alertType === 'overdue';
        const accent = overdue ? '#E53935' : '#7B1FA2';
        const cardBg = overdue ? '#FFF5F5' : '#F8F0FC';

        return (
          <TouchableOpacity
            key={alert._id}
            style={styles.cardWrap}
            activeOpacity={0.9}
            onPress={() => onAlertPress?.(alert)}
            disabled={!onAlertPress}
          >
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.topRow}>
                <View style={[styles.iconWrap, { backgroundColor: `${accent}18` }]}>
                  <MaterialCommunityIcons name="content-cut" size={20} color={accent} />
                </View>
                <View style={[styles.badge, { backgroundColor: `${accent}20` }]}>
                  <AppText variant="caption" weight="800" color={accent}>
                    {overdue ? 'Overdue' : 'Due soon'}
                  </AppText>
                </View>
              </View>

              <AppText variant="bodySmall" weight="800" color={HomeTheme.text} numberOfLines={1}>
                {groomingTypeLabel(alert.groomingType)}
              </AppText>
              <AppText variant="caption" color={HomeTheme.textMuted} numberOfLines={1} style={styles.subtitle}>
                {alert.remainingDays != null
                  ? overdue
                    ? `${Math.abs(alert.remainingDays)} day${Math.abs(alert.remainingDays) === 1 ? '' : 's'} overdue`
                    : `Due in ${alert.remainingDays} day${alert.remainingDays === 1 ? '' : 's'}`
                  : 'Schedule grooming'}
              </AppText>

              {onAlertPress ? (
                <View style={styles.actionRow}>
                  <AppText variant="caption" weight="700" color={accent}>
                    Manage schedule
                  </AppText>
                  <Ionicons name="chevron-forward" size={14} color={accent} />
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardWrap: {
    flex: 1,
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    minHeight: 132,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 'auto',
  },
});
