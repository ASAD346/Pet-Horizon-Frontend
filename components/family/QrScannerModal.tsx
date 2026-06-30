import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Spacing, Radius } from '@/constants/theme';

interface QrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (token: string) => void;
}

export function QrScannerModal({ visible, onClose, onScanSuccess }: QrScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    // Extract token from scanned link or raw token
    let token = data.trim();
    if (data.includes('/invite/')) {
      const parts = data.split('/invite/');
      token = parts[parts.length - 1].split('?')[0].split('#')[0];
    } else if (data.includes('/join/family/')) {
      const parts = data.split('/join/family/');
      token = parts[parts.length - 1].split('?')[0].split('#')[0];
    }

    onScanSuccess(token);
    setTimeout(() => setScanned(false), 2000); // Reset scanned lock
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header bar */}
        <View style={styles.header}>
          <AppText variant="h3" weight="800" color={HomeTheme.text}>
            Scan QR Code
          </AppText>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
            <Ionicons name="close" size={24} color={HomeTheme.text} />
          </TouchableOpacity>
        </View>

        {/* Permission Request View */}
        {!permission ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2E7D32" />
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color="#64748B" style={styles.permIcon} />
            <AppText variant="body" weight="700" color={HomeTheme.text} align="center" style={styles.permTitle}>
              Camera Permission Required
            </AppText>
            <AppText variant="bodySmall" color={HomeTheme.textMuted} align="center" style={styles.permDesc}>
              We need access to your camera to scan family invitation QR codes.
            </AppText>
            <TouchableOpacity onPress={requestPermission} style={styles.btn} activeOpacity={0.8}>
              <AppText variant="body" weight="800" color="#FFFFFF">
                Grant Permission
              </AppText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            {/* Scanner Overlay Box */}
            <View style={styles.overlayContainer} pointerEvents="none">
              <View style={styles.scannerOutline}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <AppText variant="bodySmall" weight="700" color="#FFFFFF" style={styles.hint}>
                Align QR code within the frame
              </AppText>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  permIcon: {
    marginBottom: Spacing.sm,
  },
  permTitle: {
    marginBottom: Spacing.xs,
  },
  permDesc: {
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  btn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  scannerOutline: {
    width: 250,
    height: 250,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#3A8F3B',
    borderWidth: 0,
  },
  topLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: -1,
    right: -1,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  hint: {
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
});
