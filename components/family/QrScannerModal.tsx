import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Spacing, Radius } from '@/constants/theme';

import { useToast } from '@/hooks/useToast';
import { parseInviteTokenFromUrl } from '@/lib/family/inviteLinks';

interface QrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (token: string) => void;
}

const { width } = Dimensions.get('window');
const SCANNER_SIZE = width * 0.65;

export function QrScannerModal({ visible, onClose, onScanSuccess }: QrScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const { showErrorToast } = useToast();

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    const raw = (data || '').trim();
    const extractedToken = parseInviteTokenFromUrl(raw);

    if (!extractedToken) {
      showErrorToast('Invalid QR code. Please scan a valid Pet Horizon invite QR.');
      setTimeout(() => setScanned(false), 2500);
      return;
    }

    onScanSuccess(extractedToken);
    setTimeout(() => setScanned(false), 2000); // Reset scanned lock
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Permission Request View */}
        {!permission ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2E7D32" />
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionContainer}>
            <View style={styles.permIconContainer}>
              <Ionicons name="camera" size={44} color="#2E7D32" />
            </View>
            <AppText variant="h2" weight="800" color="#0F172A" align="center" style={styles.permTitle}>
              Camera Permission
            </AppText>
            <AppText variant="bodySmall" color="#64748B" align="center" style={styles.permDesc}>
              Allow camera access to quickly scan QR codes and connect with your family hub.
            </AppText>
            <TouchableOpacity onPress={requestPermission} style={styles.btn} activeOpacity={0.8}>
              <AppText variant="body" weight="800" color="#FFFFFF">
                Grant Access
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.cancelLink} activeOpacity={0.7}>
              <AppText variant="bodySmall" weight="700" color="#64748B">
                Cancel
              </AppText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />

            {/* Custom Overlay Mask */}
            <View style={styles.maskContainer}>
              <View style={styles.maskTop} />
              
              <View style={styles.maskMiddleRow}>
                <View style={styles.maskSide} />
                
                {/* Clean Scanner Window */}
                <View style={styles.scannerWindow}>
                  {/* Neon border corners */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                  
                  {/* Subtle target helper */}
                  <View style={styles.centerTarget} />
                </View>
                
                <View style={styles.maskSide} />
              </View>
              
              <View style={styles.maskBottom}>
                <AppText variant="bodySmall" weight="700" color="#FFFFFF" style={styles.hint}>
                  Align family QR code in the frame
                </AppText>

                {/* Step-by-step Scan Instructions */}
                <View style={styles.instructionsCard}>
                  <AppText variant="caption" weight="800" color="#81C784" style={styles.instructionsTitle}>
                    HOW TO JOIN A FAMILY:
                  </AppText>
                  
                  <View style={styles.instructionStep}>
                    <View style={styles.stepNumberBadge}><AppText variant="caption" weight="800" color="#2E7D32">1</AppText></View>
                    <AppText variant="caption" weight="600" color="#E2E8F0" style={styles.stepText}>
                      Ask the family owner to open their Family Hub view.
                    </AppText>
                  </View>

                  <View style={styles.instructionStep}>
                    <View style={styles.stepNumberBadge}><AppText variant="caption" weight="800" color="#2E7D32">2</AppText></View>
                    <AppText variant="caption" weight="600" color="#E2E8F0" style={styles.stepText}>
                      {"Have them tap \"Invite Member\" to display their QR code."}
                    </AppText>
                  </View>

                  <View style={styles.instructionStep}>
                    <View style={styles.stepNumberBadge}><AppText variant="caption" weight="800" color="#2E7D32">3</AppText></View>
                    <AppText variant="caption" weight="600" color="#E2E8F0" style={styles.stepText}>
                      Point your camera at their screen to scan and join instantly.
                    </AppText>
                  </View>
                </View>
              </View>
            </View>

            {/* Premium Header Controls (Absolute Overlay) */}
            <View style={styles.floatingHeader}>
              <TouchableOpacity onPress={onClose} style={styles.circleActionBtn} activeOpacity={0.8}>
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              
              <AppText variant="bodySmall" weight="800" color="#FFFFFF" style={styles.headerTitle}>
                SCAN QR CODE
              </AppText>
              
              <TouchableOpacity onPress={() => setTorch(!torch)} style={styles.circleActionBtn} activeOpacity={0.8}>
                <Ionicons name={torch ? "flash" : "flash-off"} size={20} color={torch ? "#FFEB3B" : "#FFFFFF"} />
              </TouchableOpacity>
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
    backgroundColor: '#000000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  permIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  permTitle: {
    marginBottom: 8,
  },
  permDesc: {
    marginBottom: 32,
    lineHeight: 20,
    maxWidth: 260,
  },
  btn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  cancelLink: {
    marginTop: 18,
    padding: 8,
  },
  cameraContainer: {
    flex: 1,
  },
  floatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerTitle: {
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  circleActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  /* Mask styles */
  maskContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  maskTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  maskMiddleRow: {
    flexDirection: 'row',
    height: SCANNER_SIZE,
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  scannerWindow: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  maskBottom: {
    flex: 1.2,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    paddingTop: 32,
  },
  /* Corners */
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#4CAF50',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  centerTarget: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 10,
    height: 10,
    marginTop: -5,
    marginLeft: -5,
    borderRadius: 5,
    backgroundColor: 'rgba(76, 175, 80, 0.4)',
  },
  hint: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
  },
  instructionsCard: {
    width: '85%',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'center',
  },
  instructionsTitle: {
    letterSpacing: 1,
    marginBottom: 12,
    alignSelf: 'center',
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#C8E6C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
    lineHeight: 16,
  },
});
