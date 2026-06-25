import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { useLocalization, CurrencyType, UnitSystemType } from '@/hooks/useLocalization';
import { Radius, Spacing, Palette } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';

interface LocalizationSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function LocalizationSheet({ visible, onClose }: LocalizationSheetProps) {
  const insets = useSafeAreaInsets();
  const { currency, unitSystem, setCurrency, setUnitSystem } = useLocalization();

  const currencies: { value: CurrencyType; label: string; symbol: string }[] = [
    { value: 'USD', label: 'United States Dollar', symbol: '$' },
    { value: 'GBP', label: 'United Kingdom Pound', symbol: '£' },
    { value: 'CAD', label: 'Canadian Dollar', symbol: '$' },
    { value: 'AUD', label: 'Australian Dollar', symbol: '$' },
  ];

  const units: { value: UnitSystemType; label: string; description: string }[] = [
    { value: 'metric', label: 'Metric System', description: 'Kilograms (kg), Kilometers (km)' },
    { value: 'imperial', label: 'Imperial System', description: 'Pounds (lbs), Miles (mi)' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <AppText variant="h3" weight="800" color={ProfileTheme.text}>
              Localization Settings
            </AppText>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={ProfileTheme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            
            {/* Currency Selection */}
            <AppText variant="bodySmall" weight="700" color={Palette.gray[600]} style={styles.sectionTitle}>
              CURRENCY
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
                      <View style={[styles.symbolBadge, selected && styles.symbolBadgeSelected]}>
                        <AppText variant="body" weight="700" color={selected ? '#FFFFFF' : Palette.gray[600]}>
                          {item.symbol}
                        </AppText>
                      </View>
                      <View>
                        <AppText variant="body" weight="700" color={ProfileTheme.text}>
                          {item.value}
                        </AppText>
                        <AppText variant="caption" color={Palette.gray[500]}>
                          {item.label}
                        </AppText>
                      </View>
                    </View>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={22} color={Palette.primary.base} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Units Selection */}
            <AppText variant="bodySmall" weight="700" color={Palette.gray[600]} style={styles.sectionTitle}>
              MEASUREMENT UNITS
            </AppText>
            <View style={styles.group}>
              {units.map((item) => {
                const selected = unitSystem === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.row, selected && styles.rowSelected]}
                    onPress={() => void setUnitSystem(item.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.rowLeft}>
                      <View style={styles.rowText}>
                        <AppText variant="body" weight="700" color={ProfileTheme.text}>
                          {item.label}
                        </AppText>
                        <AppText variant="caption" color={Palette.gray[500]}>
                          {item.description}
                        </AppText>
                      </View>
                    </View>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={22} color={Palette.primary.base} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 15, 30, 0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Palette.gray[200],
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.gray[100],
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  group: {
    backgroundColor: Palette.gray[50],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.gray[200],
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md - 2,
    borderBottomWidth: 1,
    borderBottomColor: Palette.gray[200],
  },
  rowSelected: {
    backgroundColor: Palette.primary.light,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  rowText: {
    flex: 1,
  },
  symbolBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolBadgeSelected: {
    backgroundColor: Palette.primary.base,
  },
});
