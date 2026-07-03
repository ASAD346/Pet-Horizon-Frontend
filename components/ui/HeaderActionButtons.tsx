import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { useLanguage, type LanguageCode } from './LanguageProvider';

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' },
];

interface HeaderActionButtonsProps {
  notificationCount?: number;
  onJournalPress?: () => void;
  onNotificationsPress?: () => void;
  onQrScanPress?: () => void;
  showJournal?: boolean;
  showLanguageSelector?: boolean;
  /** When true, renders icon buttons as dark-themed (white icons on navy) */
  dark?: boolean;
}

export function HeaderActionButtons({
  notificationCount = 0,
  onJournalPress,
  onNotificationsPress,
  onQrScanPress,
  showJournal = true,
  showLanguageSelector = false,
  dark = false,
}: HeaderActionButtonsProps) {
  const badgeLabel = notificationCount > 99 ? '99+' : String(notificationCount);

  const btnStyle = dark ? styles.iconBtnDark : styles.iconBtnLight;
  const iconColor = dark ? '#FFFFFF' : HomeTheme.text;

  const { locale, changeLanguage, t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.actions}>
      {onQrScanPress ? (
        <TouchableOpacity
          style={[styles.iconBtn, btnStyle]}
          activeOpacity={0.75}
          onPress={onQrScanPress}
          accessibilityLabel="Scan invite QR code"
        >
          <Ionicons name="qr-code-outline" size={18} color={iconColor} />
        </TouchableOpacity>
      ) : null}

      {showJournal && onJournalPress ? (
        <TouchableOpacity
          style={[styles.iconBtn, btnStyle]}
          activeOpacity={0.75}
          onPress={onJournalPress}
          accessibilityLabel="Open pet journal"
        >
          <MaterialCommunityIcons name="notebook-outline" size={20} color={iconColor} />
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={[styles.iconBtn, btnStyle]}
        activeOpacity={0.75}
        onPress={onNotificationsPress}
        accessibilityLabel="Open notifications"
        disabled={!onNotificationsPress}
      >
        <Ionicons name="notifications-outline" size={20} color={iconColor} />
        {notificationCount > 0 ? (
          <View style={styles.badge}>
            <AppText variant="caption" weight="700" color={HomeTheme.white} style={styles.badgeText}>
              {badgeLabel}
            </AppText>
          </View>
        ) : null}
      </TouchableOpacity>

      {showLanguageSelector ? (
        <>
          <TouchableOpacity
            style={[styles.iconBtn, btnStyle]}
            activeOpacity={0.75}
            onPress={() => setModalVisible(true)}
            accessibilityLabel="Select language"
          >
            <AppText variant="caption" weight="800" color={iconColor} style={{ fontSize: 11 }}>
              {locale.toUpperCase()}
            </AppText>
          </TouchableOpacity>

          <Modal
            visible={modalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
              <View style={styles.modalDropdownPanel}>
                <AppText variant="bodySmall" weight="800" color={HomeTheme.text} style={styles.modalTitle}>
                  {t('selectLanguage', 'Select Language')}
                </AppText>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }}>
                  <View style={styles.modalList}>
                    {LANGUAGES.map((lang) => {
                      const isSelected = lang.code === locale;
                      return (
                        <TouchableOpacity
                          key={lang.code}
                          style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                          onPress={async () => {
                            await changeLanguage(lang.code);
                            setModalVisible(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <AppText
                            variant="bodySmall"
                            weight={isSelected ? '800' : '500'}
                            color={isSelected ? '#E28743' : HomeTheme.text}
                          >
                            {lang.label}
                          </AppText>
                          {isSelected && (
                            <Ionicons name="checkmark" size={16} color="#E28743" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </Pressable>
          </Modal>
        </>
      ) : null}
    </View>
  );
}

const baseIconBtn = {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  iconBtn: {
    ...baseIconBtn,
  },
  // Light mode: white card with border
  iconBtnLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    ...Platform.select({
      ios: {
        shadowColor: '#2D7A2D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  // Dark mode: translucent white on navy
  iconBtnDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 8,
    lineHeight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDropdownPanel: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalList: {
    gap: 4,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  modalItemSelected: {
    backgroundColor: 'rgba(226, 135, 67, 0.06)',
  },
});
