import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { homePillCard } from '@/components/home/homeStyles';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import type { FamilyMemberDisplay } from '@/types/family';

interface MembersListSectionProps {
  members: FamilyMemberDisplay[];
  loading?: boolean;
  manageableIds?: string[];
  onMemberSettingsPress?: (memberId: string) => void;
}

function MemberAvatar({ color }: { color: string }) {
  return (
    <View style={[styles.avatar, { backgroundColor: color }]}>
      <Ionicons name="person" size={22} color={HomeTheme.white} />
    </View>
  );
}

export function MembersListSection({
  members,
  loading,
  manageableIds = [],
  onMemberSettingsPress,
}: MembersListSectionProps) {
  const activeCount = members.length;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText variant="body" weight="700" color={HomeTheme.text} style={styles.sectionTitle}>
          Members
        </AppText>
        <View style={styles.activeBadge}>
          <AppText variant="caption" weight="700" color={HomeTheme.cardGreen}>
            {activeCount} ACTIVE
          </AppText>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={HomeTheme.cardGreen} style={styles.loader} />
      ) : (
        members.map((member) => {
          const canManage = manageableIds.includes(member.id);
          return (
          <View key={member.id} style={[homePillCard.card, styles.memberCard]}>
            <MemberAvatar color={member.avatarColor} />
            <View style={styles.memberInfo}>
              <AppText variant="body" weight="700" color={HomeTheme.text}>
                {member.name}
              </AppText>
              <AppText
                variant="caption"
                weight={member.isAdmin ? '700' : '500'}
                color={member.isAdmin ? HomeTheme.cardGreen : HomeTheme.textMuted}
              >
                {member.subtitle}
              </AppText>
            </View>
            {canManage ? (
              <TouchableOpacity
                style={styles.settingsBtn}
                activeOpacity={0.7}
                accessibilityLabel="Member settings"
                onPress={() => onMemberSettingsPress?.(member.id)}
              >
                <Ionicons name="settings-outline" size={18} color={HomeTheme.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  loader: {
    marginVertical: Spacing.lg,
  },
  memberCard: {
    paddingVertical: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  settingsBtn: {
    padding: Spacing.xs,
  },
});
