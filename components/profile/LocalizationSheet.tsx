import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { useLocalization, CurrencyType } from '@/hooks/useLocalization';
import { Radius, Spacing } from '@/constants/theme';
import { useTimezone } from '@/hooks/useTimezone';
import { ProfileModalShell } from './ProfileModalShell';
import { ProfileTheme } from './profileTheme';

interface LocalizationSheetProps {
  visible: boolean;
  onClose: () => void;
}

const CURRENCIES: { value: CurrencyType; label: string; symbol: string }[] = [
  { value: 'USD', label: 'United States Dollar', symbol: '$' },
  { value: 'GBP', label: 'United Kingdom Pound', symbol: '£' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: '$' },
  { value: 'AUD', label: 'Australian Dollar', symbol: '$' },
];

function getGmtOffset(tzString: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tzString,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : '';
  } catch {
    return '';
  }
}

export function LocalizationSheet({ visible, onClose }: LocalizationSheetProps) {
  const { currency, setCurrency } = useLocalization();
  const { timezone } = useTimezone();
  const offset = getGmtOffset(timezone);

  return (
    <ProfileModalShell visible={visible} onClose={onClose} title="Localization Settings">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <AppText variant="bodySmall" weight="700" color="#64748B" style={styles.sectionTitle}>
          SYNCHRONIZED TIMEZONE
        </AppText>

        <View style={styles.timezoneCard}>
          <View style={styles.timezoneText}>
            <AppText variant="body" weight="700" color="#1E293B">
              {timezone}
            </AppText>
            <AppText variant="caption" color="#64748B">
              {offset ? `${offset} · ` : ''}Auto-detected region
            </AppText>
          </View>
        </View>

        <AppText variant="bodySmall" weight="700" color="#64748B" style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
          SELECT CURRENCY
        </AppText>

        <View style={styles.currencyGroup}>
          {CURRENCIES.map((item, index) => {
            const selected = currency === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.currencyRow,
                  index < CURRENCIES.length - 1 && styles.currencyRowBorder,
                  selected && { backgroundColor: 'rgba(46,125,50,0.02)' },
                ]}
                onPress={() => void setCurrency(item.value)}
                activeOpacity={0.7}
              >
                <View style={styles.currencyTextBlock}>
                  <View style={styles.currencyCodeRow}>
                    <AppText variant="body" weight="700" color={selected ? ProfileTheme.green : '#1E293B'}>
                      {item.value}
                    </AppText>
                    <AppText variant="caption" weight="700" color={selected ? ProfileTheme.green : '#64748B'}>
                      {item.symbol}
                    </AppText>
                  </View>
                  <AppText variant="caption" color="#94A3B8">
                    {item.label}
                  </AppText>
                </View>

                {selected ? (
                  <Ionicons name="checkmark-circle" size={24} color={ProfileTheme.green} />
                ) : (
                  <Ionicons name="ellipse-outline" size={24} color="#CBD5E1" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </ProfileModalShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  timezoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: Spacing.md,
  },
  timezoneText: { flex: 1, gap: 4 },
  currencyGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  currencyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  currencyTextBlock: { flex: 1, gap: 2 },
  currencyCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
