import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../ui/AppText';
import { HeaderActionButtons } from '../ui/HeaderActionButtons';
import { Spacing } from '../../constants/theme';

interface FamilyHubHeaderProps {
  notificationCount?: number;
  onNotificationsPress?: () => void;
  isPremium?: boolean;
  topInset?: number;
  onJournalPress?: () => void;
  showJournal?: boolean;
}

export function FamilyHubHeader({
  notificationCount = 0,
  onNotificationsPress,
  isPremium = false,
  topInset = 0,
  onJournalPress,
  showJournal = true,
}: FamilyHubHeaderProps) {
  const insets = useSafeAreaInsets();

  const safeLeft = Math.max(insets.left, Spacing.lg);
  const safeRight = Math.max(insets.right, Spacing.lg);

  return (
    <View style={styles.wrapper}>
      <View style={styles.curveClipper}>
        <View
          style={[
            styles.headerBody,
            {
              paddingTop: topInset + 14,
              paddingLeft: safeLeft,
              paddingRight: safeRight,
            },
          ]}
        >
          <View style={styles.row}>
            {/* Left: family/people icon badge + text */}
            <View style={styles.leftContainer}>
              <View style={[
                styles.iconOuterRing,
                isPremium ? { borderColor: '#D4A017' } : { borderColor: 'rgba(0,0,0,0.08)' }
              ]}>
                <View style={[
                  styles.iconInnerContainer,
                  isPremium ? { backgroundColor: 'rgba(212, 160, 23, 0.08)' } : { backgroundColor: '#F1F5F9' }
                ]}>
                  <MaterialCommunityIcons 
                    name="account-group-outline" 
                    size={18} 
                    color={isPremium ? '#D4A017' : '#1C1F24'} 
                  />
                </View>
              </View>

              <View style={styles.textBlock}>
                <AppText
                  variant="bodySmall"
                  weight="800"
                  color="#1C1F24"
                  style={styles.title}
                  numberOfLines={1}
                >
                  Family Hub
                </AppText>
                <View style={[
                  styles.eyebrowChip,
                  isPremium ? {
                    borderColor: 'rgba(212, 160, 23, 0.35)',
                    backgroundColor: 'rgba(212, 160, 23, 0.04)',
                  } : {
                    borderColor: 'rgba(0,0,0,0.06)',
                    backgroundColor: '#F8FAF8',
                  },
                ]}>
                  <AppText 
                    variant="caption" 
                    weight="800" 
                    color={isPremium ? '#D4A017' : '#2E7D32'} 
                    style={styles.eyebrowText}
                  >
                    COLLABORATE
                  </AppText>
                </View>
              </View>
            </View>

            {/* Right: notification action buttons */}
            <HeaderActionButtons
              notificationCount={notificationCount}
              onNotificationsPress={onNotificationsPress}
              onJournalPress={onJournalPress}
              showJournal={showJournal}
              dark={false}
            />
          </View>

          {/* Bottom accent line */}
          <View style={[
            styles.divider,
            isPremium ? { backgroundColor: '#D4A017' } : { backgroundColor: 'rgba(0,0,0,0.06)' },
          ]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  curveClipper: {
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  headerBody: {
    paddingBottom: 0,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  leftContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconOuterRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInnerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    paddingRight: Spacing.sm,
    gap: 1,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  eyebrowChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  eyebrowText: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
  },
  divider: {
    height: 1,
  },
});
