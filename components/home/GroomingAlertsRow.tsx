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
  isPremium?: boolean;
  onAlertPress?: (record: GroomingRecord) => void;
}

function groomingTypeLabel(type: string): string {
  if (!type) return 'Grooming';
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
}

export function GroomingAlertsRow({ token, petId, isPremium = false, onAlertPress }: GroomingAlertsRowProps) {
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
        const accent = overdue ? '#B71C1C' : '#114227';
        const cardBorderColor = isPremium ? '#D4A017' : 'rgba(46, 125, 50, 0.15)';

        return (
          <TouchableOpacity
            key={alert._id}
            style={styles.cardWrap}
            activeOpacity={0.9}
            onPress={() => onAlertPress?.(alert)}
            disabled={!onAlertPress}
          >
            <View style={[
              styles.card,
              {
                borderColor: cardBorderColor,
                borderWidth: isPremium ? 1.5 : 1,
                // Subtle gold shadow/glow for Premium
                shadowColor: isPremium ? '#D4A017' : 'transparent',
                shadowOpacity: isPremium ? 0.25 : 0,
                shadowRadius: isPremium ? 5 : 0,
                shadowOffset: { width: 0, height: 2 },
                elevation: isPremium ? 2 : 0,
              }
            ]}>
              {/* Left Frame */}
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name="content-cut" size={20} color="#114227" />
              </View>

              {/* Center Frame */}
              <View style={styles.centerFrame}>
                <AppText variant="bodySmall" weight="800" color="#1A2B4E" numberOfLines={1}>
                  {groomingTypeLabel(alert.groomingType)}
                </AppText>
                <AppText
                  variant="caption"
                  weight="600"
                  color={accent}
                  numberOfLines={1}
                >
                  {alert.remainingDays != null
                    ? overdue
                      ? `${Math.abs(alert.remainingDays)} day${Math.abs(alert.remainingDays) === 1 ? '' : 's'} overdue`
                      : `Due in ${alert.remainingDays} day${alert.remainingDays === 1 ? '' : 's'}`
                    : 'Schedule grooming'}
                </AppText>
              </View>

              {/* Right Frame */}
              <View style={styles.rightFrame}>
                {isPremium ? (
                  <View style={styles.premiumBadge}>
                    <AppText variant="caption" weight="800" color="#D4A017" style={styles.premiumText}>
                      PREMIUM
                    </AppText>
                  </View>
                ) : null}
                {onAlertPress ? (
                  <Ionicons name="chevron-forward" size={16} color={isPremium ? '#D4A017' : '#114227'} />
                ) : (
                  <View style={styles.alertDot} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'column',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  cardWrap: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F9F2', // Soft, low-opacity Light Tech Green blend
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(17, 66, 39, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerFrame: {
    flex: 1,
    justifyContent: 'center',
  },
  rightFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumBadge: {
    backgroundColor: 'rgba(212, 160, 23, 0.1)',
    borderColor: 'rgba(212, 160, 23, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    fontSize: 8,
    letterSpacing: 0.4,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53935',
  },
});
