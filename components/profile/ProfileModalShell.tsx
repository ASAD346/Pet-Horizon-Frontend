import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeModal } from '@/components/ui/SafeModal';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';

interface ProfileModalShellProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  titleIcon?: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
}

const GREEN = '#2E7D32';
const GREEN_MUTED = 'rgba(46,125,50,0.08)';

export function ProfileModalShell({
  visible,
  onClose,
  title,
  titleIcon,
  children,
}: ProfileModalShellProps) {
  return (
    <SafeModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <View style={styles.headerBlock}>
            <View style={styles.header}>
              {titleIcon ? (
                <View style={styles.titleIconBadge}>
                  <Ionicons name={titleIcon} size={18} color={GREEN} />
                </View>
              ) : null}

              <AppText
                variant="h3"
                weight="800"
                color="#0E3821"
                style={[styles.title, titleIcon ? { marginLeft: 8 } : null]}
                numberOfLines={1}
              >
                {title}
              </AppText>

              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={18} color={GREEN} />
              </Pressable>
            </View>

            <View style={styles.headerDivider} />
          </View>

          <View style={styles.contentContainer}>
            {children}
          </View>
        </View>
      </View>
    </SafeModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    flexShrink: 1,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  headerBlock: {
    paddingBottom: 0,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    paddingBottom: 14,
  },
  titleIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: GREEN_MUTED,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: 18,
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: Spacing.sm,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: Spacing.lg,
    marginBottom: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 28,
    paddingTop: 12,
  },
});
