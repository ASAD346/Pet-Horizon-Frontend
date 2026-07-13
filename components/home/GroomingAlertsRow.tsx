import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Spacing } from '@/constants/theme';
import { fetchGroomingAlerts } from '@/services/grooming/groomingApi';
import type { GroomingRecord } from '@/types/grooming';

interface GroomingAlertsRowProps {
  token: string | null;
  petId: string | null | undefined;
  isPremium?: boolean;
  onAlertPress?: (record: GroomingRecord) => void;
}

import { getTaskDisplayName } from '@/lib/schedule/taskMappings';

function groomingTypeLabel(type: string): string {
  if (!type) return 'Grooming';
  return getTaskDisplayName(type);
}

function getGroomingIcon(type: string): React.ComponentProps<typeof Ionicons>['name'] {
  const t = type?.toLowerCase() || '';
  if (t.includes('bath') || t.includes('wash') || t.includes('shower')) return 'water';
  if (t.includes('cut') || t.includes('hair') || t.includes('trim')) return 'cut';
  if (t.includes('nail') || t.includes('claw')) return 'cut-outline';
  if (t.includes('brush') || t.includes('comb')) return 'sparkles';
  return 'water'; // fallback
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
        const cardBorderColor = isPremium ? '#D4A017' : 'rgba(46, 125, 50, 0.1)';

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
                shadowOpacity: isPremium ? 0.2 : 0,
                shadowRadius: isPremium ? 4 : 0,
                shadowOffset: { width: 0, height: 2 },
                elevation: isPremium ? 2 : 0,
              }
            ]}>
              {/* Left Container */}
              <View style={styles.iconWrap}>
                <Ionicons name={getGroomingIcon(alert.groomingType)} size={20} color="#114227" />
              </View>

              {/* Center Text Frame */}
              <View style={styles.centerFrame}>
                <AppText variant="bodySmall" weight="600" color="#1A2B4E" numberOfLines={1}>
                  {groomingTypeLabel(alert.groomingType)}
                </AppText>
                {overdue ? (
                  <AppText variant="caption" weight="600" color="#B71C1C" style={styles.overdueSubtitle}>
                    {alert.remainingDays != null
                      ? `${Math.abs(alert.remainingDays)} day${Math.abs(alert.remainingDays) === 1 ? '' : 's'} overdue`
                      : 'Overdue'}
                  </AppText>
                ) : null}
              </View>

              {/* Right Action Frame */}
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
                ) : overdue ? (
                  <View style={styles.alertDot} />
                ) : null}
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
    borderRadius: 16, // Soft rounded borders matching modern design spec
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20, // Circular proportions
    backgroundColor: 'rgba(17, 66, 39, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerFrame: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  overdueSubtitle: {
    marginTop: 1,
  },
  rightFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumBadge: {
    backgroundColor: 'rgba(212, 160, 23, 0.08)',
    borderColor: 'rgba(212, 160, 23, 0.2)',
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B71C1C',
  },
});
