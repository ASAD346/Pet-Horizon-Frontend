import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { SectionLabel, SheetColors } from '@/components/sheets';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';

interface CreateFamilyHubSheetProps {
  visible: boolean;
  defaultName?: string;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function CreateFamilyHubSheet({
  visible,
  defaultName = 'My Family Hub',
  saving,
  error,
  onClose,
  onCreate,
}: CreateFamilyHubSheetProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (visible) setName(defaultName);
  }, [visible, defaultName]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="h3" weight="800" color={SheetColors.title}>
              Create Family Hub
            </AppText>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={HomeTheme.text} />
            </TouchableOpacity>
          </View>

          <AppText variant="bodySmall" color={HomeTheme.textMuted} style={styles.subtitle}>
            Premium email-based sharing for caregivers. Separate from link/QR pet invites.
          </AppText>

          {error ? <AuthErrorBanner message={error} /> : null}

          <SectionLabel text="FAMILY NAME" />
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="e.g. Smith Family"
            placeholderTextColor={SheetColors.placeholder}
          />

          <AppButton
            title="Create Hub"
            onPress={() => onCreate(name.trim())}
            loading={saving}
            disabled={!name.trim()}
            variant="success"
            size="md"
            style={styles.saveBtn}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: SheetColors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SheetColors.sheetBg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  input: {
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: SheetColors.inputText,
    marginBottom: Spacing.md,
  },
  saveBtn: {
    width: '100%',
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
});
