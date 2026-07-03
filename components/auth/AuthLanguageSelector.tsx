import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage, type LanguageCode } from '@/components/ui/LanguageProvider';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing, HomeTheme } from '@/constants/theme';

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
];

export function AuthLanguageSelector() {
  const { locale, changeLanguage, t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = async (code: LanguageCode) => {
    await changeLanguage(code);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selectorBtn}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.75}
      >
        <Ionicons name="globe-outline" size={16} color="#E28743" style={{ marginRight: 4 }} />
        <AppText variant="caption" weight="800" color="#E28743" style={styles.codeText}>
          {locale.toUpperCase()}
        </AppText>
        <Ionicons name="chevron-down" size={10} color="#E28743" style={{ marginLeft: 2 }} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <View style={styles.dropdownPanel}>
            <AppText variant="bodySmall" weight="800" color={HomeTheme.text} style={styles.title}>
              {t('selectLanguage', 'Select Language')}
            </AppText>
            <View style={styles.list}>
              {LANGUAGES.map((lang) => {
                const isSelected = lang.code === locale;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.item, isSelected && styles.itemSelected]}
                    onPress={() => handleSelect(lang.code)}
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
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectorBtn: {
    position: 'absolute',
    top: 50, // Floating below status bar on auth screen
    right: Spacing.md,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(226, 135, 67, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(226, 135, 67, 0.25)',
  },
  codeText: {
    letterSpacing: 0.5,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownPanel: {
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
  title: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  list: {
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  itemSelected: {
    backgroundColor: 'rgba(226, 135, 67, 0.06)',
  },
});
