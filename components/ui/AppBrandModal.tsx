import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';

interface AppBrandModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose?: () => void;
}

export function AppBrandModal({
  visible,
  title,
  message,
  confirmLabel = 'Got it',
  onConfirm,
  onClose,
}: AppBrandModalProps) {
  const handleClose = onClose ?? onConfirm;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../../assets/images/applogo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <AppText variant="h3" weight="800" color={HomeTheme.text} style={styles.title}>
            {title}
          </AppText>
          <AppText variant="body" color={HomeTheme.textMuted} style={styles.message}>
            {message}
          </AppText>

          <AppButton
            title={confirmLabel}
            onPress={onConfirm}
            variant="success"
            size="md"
            style={styles.button}
            textStyle={styles.buttonText}
          />
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
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#F4F6F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logo: {
    width: 52,
    height: 52,
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
  button: {
    width: '100%',
    borderRadius: Radius.full,
    minHeight: 48,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
