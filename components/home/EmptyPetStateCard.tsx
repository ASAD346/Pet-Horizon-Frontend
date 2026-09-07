import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Palette, Spacing, Radius } from '@/constants/theme';

interface EmptyPetStateCardProps {
  onAddPetPress: () => void;
  onScanQrPress?: () => void;
  isPremium?: boolean;
}

export function EmptyPetStateCard({
  onAddPetPress,
  onScanQrPress,
  isPremium = false,
}: EmptyPetStateCardProps) {
  const brandColor = isPremium ? '#184F2E' : '#2E7D32';

  return (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: isPremium ? '#E8F5E9' : '#F0F9F0' }]}>
        <MaterialCommunityIcons name="paw-outline" size={48} color={brandColor} />
      </View>

      <AppText variant="h2" style={styles.title}>
        No Active Pet Found
      </AppText>

      <AppText variant="body" style={styles.description}>
        You don't currently have any linked pets. You can register your own pet or join a family by scanning an invite QR code.
      </AppText>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: brandColor }]}
          onPress={onAddPetPress}
          activeOpacity={0.88}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={styles.btnIcon} />
          <AppText variant="body" weight="700" style={styles.primaryButtonText}>
            Register a Pet
          </AppText>
        </TouchableOpacity>

        {onScanQrPress ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onScanQrPress}
            activeOpacity={0.88}
          >
            <Ionicons name="qr-code-outline" size={19} color={brandColor} style={styles.btnIcon} />
            <AppText variant="body" weight="600" style={[styles.secondaryButtonText, { color: brandColor }]}>
              Scan Invite QR
            </AppText>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2EBE2',
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    color: '#1A2B4E',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    color: '#607274',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: Radius.lg,
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    backgroundColor: '#F9FCF9',
    width: '100%',
  },
  secondaryButtonText: {
    fontWeight: '600',
  },
  btnIcon: {
    marginRight: 7,
  },
});
