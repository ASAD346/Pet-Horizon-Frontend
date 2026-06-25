import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { HeaderActionButtons } from './HeaderActionButtons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';

interface ScreenHeaderProps {
  title: string;
  variant?: 'branded' | 'white';
  onBack?: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
  rightDisabled?: boolean;
  notificationCount?: number;
  onNotificationsPress?: () => void;
  onJournalPress?: () => void;
  showJournal?: boolean;
}

export function ScreenHeader({
  title,
  variant = 'white',
  onBack,
  rightLabel,
  onRightPress,
  rightDisabled,
  notificationCount = 0,
  onNotificationsPress,
  onJournalPress,
  showJournal = true,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const isBranded = variant === 'branded';

  const renderContent = () => (
    <View style={styles.row}>
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={isBranded ? '#FFFFFF' : Colors.text}
          />
        </TouchableOpacity>
      ) : null}

      <AppText
        variant="h3"
        weight="800"
        color={isBranded ? '#FFFFFF' : Colors.text}
        style={styles.title}
        numberOfLines={1}
      >
        {title}
      </AppText>

      {rightLabel && onRightPress ? (
        <TouchableOpacity
          onPress={onRightPress}
          disabled={rightDisabled}
          style={styles.rightButton}
        >
          <AppText
            variant="body"
            weight="800"
            color={rightDisabled ? Colors.textLight : Colors.primary}
          >
            {rightLabel}
          </AppText>
        </TouchableOpacity>
      ) : (
        <HeaderActionButtons
          notificationCount={notificationCount}
          onJournalPress={onJournalPress}
          onNotificationsPress={onNotificationsPress}
          showJournal={showJournal}
          dark={isBranded}
        />
      )}
    </View>
  );

  if (isBranded) {
    return (
      <LinearGradient
        colors={['#2E7D32', '#1B5E20'] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.container,
          { paddingTop: Math.max(insets.top, Spacing.sm) },
          styles.branded,
        ]}
      >
        {renderContent()}
      </LinearGradient>
    );
  }

  return (
    <View style={styles.whiteBorder}>
      <View
        style={[
          styles.container,
          { paddingTop: Math.max(insets.top, Spacing.sm) },
          styles.white,
        ]}
      >
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  branded: {},
  white: {
    backgroundColor: Colors.surface,
  },
  whiteBorder: {
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    gap: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
  },
  rightButton: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
