import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { fetchWalkStats } from '@/services/schedules/walkApi';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';

interface WalkStatsPanelProps {
  token: string | null;
  petId: string | null;
}

export function WalkStatsPanel({ token, petId }: WalkStatsPanelProps) {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!token || !petId) {
      setStats({});
      return;
    }
    setLoading(true);
    try {
      const data = await fetchWalkStats(token, petId);
      setStats(data);
    } catch {
      setStats({});
    } finally {
      setLoading(false);
    }
  }, [token, petId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const entries = Object.entries(stats).sort(([a], [b]) => a.localeCompare(b));
  const totalMinutes = entries.reduce((sum, [, mins]) => sum + mins, 0);

  if (!petId) return null;

  return (
    <View style={styles.card}>
      <AppText variant="caption" weight="800" color={HomeTheme.textMuted}>
        Walk activity (last 7 days)
      </AppText>
      {loading ? (
        <ActivityIndicator color={HomeTheme.cardGreen} style={styles.loader} />
      ) : entries.length === 0 ? (
        <AppText variant="caption" color={HomeTheme.textMuted}>
          No completed walks in this period.
        </AppText>
      ) : (
        <>
          <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
            {totalMinutes} min total
          </AppText>
          {entries.map(([date, mins]) => (
            <AppText key={date} variant="caption" color={HomeTheme.textMuted}>
              {new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
              : {mins} min
            </AppText>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: HomeTheme.white,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  loader: {
    marginVertical: Spacing.xs,
  },
});
