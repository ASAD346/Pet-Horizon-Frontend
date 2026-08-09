import React, { useContext, useId, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';
import { SheetColors } from './sheetUi';
import { SheetOverlayContext } from './FormSheetShell';

export type SheetOption = {
  value: string;
  label: string;
  subtitle?: string;
  /** MaterialCommunityIcons name */
  mciIcon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  /** Ionicons name */
  ionIcon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Icon accent color */
  color?: string;
  /** Icon background color */
  bg?: string;
};

interface SheetOptionPickerProps {
  visible: boolean;
  title: string;
  options: SheetOption[];
  selectedValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  useNativeModal?: boolean;
}

export function SheetOptionPicker({
  visible,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
  useNativeModal = true,
}: SheetOptionPickerProps) {
  const overlayContext = useContext(SheetOverlayContext);
  const id = useId();

  const titleParts = (title || '').split(' ');
  const firstRow = titleParts[0] || '';
  const secondRow = titleParts.slice(1).join(' ') || '';
  const hasRichOptions = options.some((o) => o.mciIcon || o.ionIcon || o.color);

  const content = (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
        {/* Handle bar */}
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <AppText variant="body" weight="800" color="#0F172A" style={styles.selectText}>
              {firstRow}
            </AppText>
            {secondRow ? (
              <AppText variant="caption" weight="700" color="#64748B" style={styles.categoryText}>
                {secondRow}
              </AppText>
            ) : null}
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={18} color={SheetColors.chipText} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={hasRichOptions ? styles.richListContent : styles.simpleListContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {hasRichOptions ? (
            /* Rich vertical row layout */
            <View style={styles.richList}>
              {options.map((option) => {
                const selected = option.value === selectedValue;
                const accentColor = option.color ?? '#5CB35D';
                const bgColor = option.bg ?? '#E8F5E9';
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.richRow,
                      selected && styles.richRowSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      onSelect(option.value);
                      onClose();
                    }}
                  >
                    {/* Left: Icon badge */}
                    <View style={[styles.richIconBadge, { backgroundColor: bgColor }]}>
                      {option.mciIcon ? (
                        <MaterialCommunityIcons
                          name={option.mciIcon}
                          size={20}
                          color={accentColor}
                        />
                      ) : option.ionIcon ? (
                        <Ionicons
                          name={option.ionIcon}
                          size={20}
                          color={accentColor}
                        />
                      ) : null}
                    </View>

                    {/* Middle: Labels */}
                    <View style={styles.richTextCol}>
                      <AppText variant="bodySmall" weight="700" color="#1E293B">
                        {option.label}
                      </AppText>
                      {option.subtitle ? (
                        <AppText variant="caption" weight="500" color="#64748B" style={styles.richSubText}>
                          {option.subtitle}
                        </AppText>
                      ) : null}
                    </View>

                    {/* Right: Custom radio indicator */}
                    <View style={styles.radioWrapper}>
                      {selected ? (
                        <View style={[styles.radioOuter, { borderColor: accentColor }]}>
                          <View style={[styles.radioInner, { backgroundColor: accentColor }]} />
                        </View>
                      ) : (
                        <View style={styles.radioOuterInactive} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            /* Simple list layout */
            options.map((option) => {
              const selected = option.value === selectedValue;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.row, selected && styles.rowSelected]}
                  activeOpacity={0.85}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                >
                  <AppText
                    variant="bodySmall"
                    weight={selected ? '700' : '600'}
                    color={selected ? HomeTheme.green : SheetColors.inputText}
                  >
                    {option.label}
                  </AppText>
                  {selected ? (
                    <Ionicons name="checkmark" size={20} color={HomeTheme.green} />
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </Pressable>
    </Pressable>
  );

  useEffect(() => {
    if (visible && overlayContext) {
      overlayContext.setOverlay(id,
        <View key={id} style={[StyleSheet.absoluteFillObject, { zIndex: 9999, elevation: 24 }]}>
          {content}
        </View>
      );
    } else if (!visible && overlayContext) {
      overlayContext.removeOverlay(id);
    }
    return () => {
      if (overlayContext) overlayContext.removeOverlay(id);
    };
  }, [visible, overlayContext, id, content]);

  if (overlayContext) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

const sheetShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
  },
  android: { elevation: 12 },
});

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.40)',
    justifyContent: 'flex-end',
    zIndex: 99999,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    ...sheetShadow,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F2F5',
  },
  titleContainer: {
    flexDirection: 'column',
    gap: 1,
  },
  selectText: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  categoryText: {
    fontSize: 12,
    lineHeight: 15,
    marginTop: 0,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flexGrow: 0,
  },
  simpleListContent: {
    paddingVertical: Spacing.xs,
  },
  richListContent: {
    paddingBottom: 32,
  },
  richList: {
    width: '100%',
  },
  richRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 14,
  },
  richRowSelected: {
    backgroundColor: '#F8FAFC',
  },
  richIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  richTextCol: {
    flex: 1,
    gap: 2,
  },
  richSubText: {
    fontSize: 11,
    lineHeight: 14,
  },
  radioWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioOuterInactive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  /* Simple list */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  rowSelected: {
    backgroundColor: '#F0FAF0',
  },
});
