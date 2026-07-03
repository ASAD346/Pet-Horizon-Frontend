import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

interface PermissionGuardProps {
  petId?: string | null;
  petOwnerId?: string | null;
  moduleId: string;
  children: React.ReactNode;
  showOverlay?: boolean;
  showBanner?: boolean;
  customBannerMessage?: string;
  style?: any;
}

export function PermissionGuard({
  petId,
  petOwnerId,
  moduleId,
  children,
  showOverlay = false,
  showBanner = true,
  customBannerMessage,
  style,
}: PermissionGuardProps) {
  const { canEdit, loading } = usePermissionGuard(petId, moduleId, petOwnerId);

  if (loading) {
    return <View style={style}>{children}</View>;
  }

  if (canEdit) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={[styles.container, style]}>
      {/* Render optional Locked Overlay */}
      {showOverlay && (
        <View style={styles.overlay}>
          <MaterialCommunityIcons name="lock" size={32} color="#64748B" />
          <AppText variant="bodySmall" weight="700" color="#64748B" style={styles.overlayText}>
            Locked
          </AppText>
        </View>
      )}

      {/* Render warning banner */}
      {showBanner && (
        <View style={styles.banner}>
          <MaterialCommunityIcons name="lock-outline" size={16} color="#B45309" />
          <AppText variant="caption" weight="700" color="#B45309" style={styles.bannerText}>
            {customBannerMessage || "Request access from admin to edit."}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  disabledContent: {
    opacity: 0.5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  overlayText: {
    marginTop: 4,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  bannerText: {
    marginLeft: 6,
  },
});
