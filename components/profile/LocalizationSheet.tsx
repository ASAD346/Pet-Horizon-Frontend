import React from 'react';
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeModal } from '@/components/ui/SafeModal';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { useLocalization, CurrencyType } from '@/hooks/useLocalization';
import { Radius, Spacing, Palette } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';
import { useTimezone } from '@/hooks/useTimezone';

interface LocalizationSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function LocalizationSheet({ visible, onClose }: LocalizationSheetProps) {
  const insets = useSafeAreaInsets();
  const { currency, setCurrency } = useLocalization();
  const { timezone } = useTimezone();

  const currencies: { value: CurrencyType; label: string; symbol: string; flag: string }[] = [
    { value: 'USD', label: 'United States Dollar', symbol: '$', flag: '🇺🇸' },
    { value: 'GBP', label: 'United Kingdom Pound', symbol: '£', flag: '🇬🇧' },
    { value: 'CAD', label: 'Canadian Dollar', symbol: '$', flag: '🇨🇦' },
    { value: 'AUD', label: 'Australian Dollar', symbol: '$', flag: '🇦🇺' },
  ];

  // Helper to format GMT offset (e.g. GMT+5)
  const getGmtOffset = (tzString: string) => {
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
  };

  const offset = getGmtOffset(timezone);

  return (
    <SafeModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <AppText variant="h3" weight="800" color={ProfileTheme.text}>
              Localization Settings
            </AppText>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={ProfileTheme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            
            {/* Timezone Info */}
            <AppText variant="bodySmall" weight="700" color={Palette.gray[500]} style={styles.sectionTitle}>
              SYNCHRONIZED TIMEZONE
            </AppText>
            <View style={styles.infoCard}>
              <View style={styles.rowLeft}>
                <View style={styles.globeBadge}>
                  <Ionicons name="globe-outline" size={20} color="#184F2E" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="body" weight="800" color={ProfileTheme.text}>
                    {timezone}
                  </AppText>
                  <AppText variant="caption" color={Palette.gray[500]}>
                    {offset ? `Active Offset: ${offset}` : 'Auto-detected region'} • Read-Only
                  </AppText>
                </View>
              </View>
            </View>

            {/* Currency Section */}
            <AppText variant="bodySmall" weight="700" color={Palette.gray[500]} style={styles.sectionTitle}>
              SELECT CURRENCY
            </AppText>
            <View style={styles.group}>
              {currencies.map((item) => {
                const selected = currency === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.row, selected && styles.rowSelected]}
                    onPress={() => void setCurrency(item.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.rowLeft}>
                      <View style={styles.flagContainer}>
                        <AppText style={styles.flagText}>{item.flag}</AppText>
                      </View>
                      <View>
                        <View style={styles.codeRow}>
                          <AppText variant="body" weight="800" color={ProfileTheme.text}>
                            {item.value}
                          </AppText>
                          <AppText variant="bodySmall" weight="700" color={Palette.gray[400]}>
                            ({item.symbol})
                          </AppText>
                        </View>
                        <AppText variant="caption" color={Palette.gray[500]}>
                          {item.label}
                        </AppText>
                      </View>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
                    ) : (
                      <View style={styles.radioUnselected} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

          </ScrollView>
        </View>
      </View>
    </SafeModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '75%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: Palette.gray[200],
    marginTop: Spacing.sm + 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: Palette.gray[100],
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    letterSpacing: 1.0,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  infoCard: {
    backgroundColor: 'rgba(46, 125, 50, 0.06)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.12)',
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  globeBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: {
    backgroundColor: Palette.gray[50],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.gray[200],
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.gray[200],
  },
  rowSelected: {
    backgroundColor: 'rgba(46, 125, 50, 0.04)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  flagContainer: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.gray[200],
  },
  flagText: {
    fontSize: 22,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  radioUnselected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Palette.gray[300],
    backgroundColor: '#FFFFFF',
  },
});
