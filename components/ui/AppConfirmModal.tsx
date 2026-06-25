import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { HomeTheme, Radius, Spacing, Palette } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface AppConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function AppConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}: AppConfirmModalProps) {

  const getIconAndColors = () => {
    switch (variant) {
      case 'danger':
        return {
          iconName: 'trash-outline' as const,
          iconColor: '#EA4335',
          iconBg: '#FCE8E6',
          btnBg: '#EA4335',
          btnText: '#FFFFFF',
        };
      case 'warning':
        return {
          iconName: 'alert-circle-outline' as const,
          iconColor: '#FBBC05',
          iconBg: '#FEF7E0',
          btnBg: '#FBBC05',
          btnText: '#000000',
        };
      case 'success':
        return {
          iconName: 'checkmark-circle-outline' as const,
          iconColor: '#34A853',
          iconBg: '#E6F4EA',
          btnBg: '#34A853',
          btnText: '#FFFFFF',
        };
      case 'primary':
      default:
        return {
          iconName: 'information-circle-outline' as const,
          iconColor: Palette.primary.base,
          iconBg: '#E8F0FE',
          btnBg: Palette.primary.base,
          btnText: Palette.primary.contrast,
        };
    }
  };

  const { iconName, iconColor, iconBg, btnBg, btnText } = getIconAndColors();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
            <Ionicons name={iconName} size={36} color={iconColor} />
          </View>

          <AppText variant="h3" weight="800" color={HomeTheme.text} style={styles.title}>
            {title}
          </AppText>
          <AppText variant="body" color={HomeTheme.textMuted} style={styles.message}>
            {message}
          </AppText>

          <View style={styles.buttonRow}>
            <AppButton
              title={cancelLabel}
              onPress={onCancel}
              variant="outline"
              disabled={loading}
              style={styles.flexButton}
            />
            <AppButton
              title={confirmLabel}
              onPress={onConfirm}
              loading={loading}
              style={[styles.flexButton, { backgroundColor: btnBg }]}
              textStyle={{ color: btnText }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: HomeTheme.white,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  flexButton: {
    flex: 1,
  },
});
