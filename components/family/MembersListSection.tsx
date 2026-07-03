import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { SkeletonList } from '@/components/ui/skeletons';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import type { FamilyMemberDisplay } from '@/types/family';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { mapModuleNameToLabel } from '@/lib/family/formatters';

interface MembersListSectionProps {
  members: FamilyMemberDisplay[];
  loading?: boolean;
  manageableIds?: string[];
  onMemberSettingsPress?: (memberId: string) => void;
  isPremium?: boolean;
  isOwner?: boolean;
  hostName?: string | null;
  currentUserId?: string | null;
  onInfoPress?: () => void;
  allowedModules?: string[];
}

function MemberAvatar({ color, pictureUrl }: { color: string; pictureUrl?: string }) {
  if (pictureUrl) {
    const resolvedUrl = resolveMediaUrl(pictureUrl);
    if (resolvedUrl) {
      return (
        <View style={[styles.avatarOuter, { borderColor: color }]}>
          <Image source={{ uri: resolvedUrl }} style={styles.avatarImage} />
        </View>
      );
    }
  }

  return (
    <View style={[styles.avatarOuter, { borderColor: color }]}>
      <View style={[styles.avatarInner, { backgroundColor: color }]}>
        <Ionicons name="person" size={18} color={HomeTheme.white} />
      </View>
    </View>
  );
}

export function MembersListSection({
  members,
  loading,
  manageableIds = [],
  onMemberSettingsPress,
  isPremium = false,
  isOwner = true,
  hostName = null,
  currentUserId = null,
  onInfoPress,
  allowedModules = [],
}: MembersListSectionProps) {
  const activeCount = members.length;

  const cardBorderColor = isPremium
    ? 'rgba(212, 160, 23, 0.35)'  // Gold trim for premium
    : 'rgba(46, 125, 50, 0.12)';  // Soft green border

  const themeGreen = isPremium ? '#184F2E' : '#3A8F3B';

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AppText variant="body" weight="800" color={HomeTheme.text} style={styles.sectionTitle}>
            Care Team {!isOwner ? '(Guest Access)' : ''}
          </AppText>
          {!isOwner && onInfoPress && (
            <TouchableOpacity
              onPress={onInfoPress}
              activeOpacity={0.7}
              style={styles.infoIconBtn}
              accessibilityLabel="View Access Information"
            >
              <Ionicons name="information-circle-outline" size={18} color={themeGreen} />
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.activeBadge, { backgroundColor: isPremium ? '#E8F5E9' : '#EEF8EE' }]}>
          <AppText variant="caption" weight="800" color={themeGreen}>
            {activeCount} {activeCount === 1 ? 'MEMBER' : 'MEMBERS'}
          </AppText>
        </View>
      </View>

      {!isOwner && (
        <View style={styles.guestBannerContainer}>
          <View style={styles.guestInfoBanner}>
            <Ionicons name="information-circle-outline" size={16} color={themeGreen} style={{ marginRight: 6 }} />
            <AppText variant="caption" weight="700" color={themeGreen} style={styles.guestInfoText}>
              You have guest editing access. Contact {hostName || 'the owner'} to manage permissions.
            </AppText>
          </View>

          {/* My Access Section */}
          <View style={styles.myAccessContainer}>
            <AppText variant="caption" weight="800" color={HomeTheme.textMuted} style={styles.myAccessTitle}>
              MY ACCESS CONFIGURATION:
            </AppText>
            <View style={styles.chipsWrapper}>
              {['feeding', 'walks', 'medicine', 'grooming', 'vaccination', 'journal', 'expenses'].map((mod) => {
                const isAllowed = allowedModules.includes(mod);
                return (
                  <View
                    key={mod}
                    style={[
                      styles.accessChip,
                      isAllowed ? styles.chipAllowed : styles.chipDenied
                    ]}
                  >
                    <Ionicons
                      name={isAllowed ? "checkmark-circle" : "eye-sharp"}
                      size={12}
                      color={isAllowed ? "#1B5E20" : "#64748B"}
                      style={{ marginRight: 4 }}
                    />
                    <AppText
                      variant="caption"
                      weight="700"
                      color={isAllowed ? "#1B5E20" : "#64748B"}
                      style={{ fontSize: 11 }}
                    >
                      {mapModuleNameToLabel(mod)}{isAllowed ? '' : ' (View Only)'}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {loading ? (
        <SkeletonList count={3} cardStyle={styles.memberCard} />
      ) : members.length === 0 ? (
        <View style={styles.emptyMembersCard}>
          <Ionicons name="people-outline" size={28} color={themeGreen} style={{ opacity: 0.6 }} />
          <AppText variant="bodySmall" weight="700" color={HomeTheme.text} style={styles.emptyMembersTitle}>
            No members yet
          </AppText>
          <AppText variant="caption" color={HomeTheme.textMuted} style={styles.emptyMembersDesc}>
            Invite family members or caregivers to help manage your pet's daily routine.
          </AppText>
        </View>
      ) : (
        members.map((member) => {
          const canManage = manageableIds.includes(member.id);
          const isSelf = currentUserId && member.id === currentUserId;
          const isPressable = canManage || isSelf;
          const CardContainer = isPressable ? TouchableOpacity : View;

          return (
            <CardContainer
              key={member.id}
              style={[
                styles.memberCard,
                { borderWidth: 1, borderColor: cardBorderColor, flexDirection: 'column', alignItems: 'stretch' }
              ]}
              activeOpacity={isPressable ? 0.85 : 1}
              onPress={isPressable ? () => onMemberSettingsPress?.(member.id) : undefined}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MemberAvatar color={member.avatarColor} pictureUrl={member.profilePicture} />
                
                <View style={styles.memberInfo}>
                  <AppText variant="body" weight="800" color={HomeTheme.text}>
                    {member.name}
                  </AppText>
                  
                  <AppText variant="caption" weight="500" color={HomeTheme.textMuted} numberOfLines={1}>
                    {member.subtitle}
                  </AppText>

                  {member.hostBadge ? (
                    <View style={styles.hostBadgeRow}>
                      <Ionicons name="link-outline" size={10} color={themeGreen} style={{ marginRight: 3 }} />
                      <AppText variant="caption" weight="800" color={themeGreen} style={styles.hostBadgeText}>
                        {member.hostBadge}
                      </AppText>
                    </View>
                  ) : null}
                </View>

                <View style={styles.rightActionRow}>
                  {member.isAdmin ? (
                    <View style={[styles.roleBadge, { backgroundColor: isPremium ? 'rgba(212, 160, 23, 0.12)' : '#E8F5E9', borderColor: isPremium ? 'rgba(212, 160, 23, 0.25)' : 'rgba(92, 179, 93, 0.18)' }]}>
                      <Ionicons name="shield-checkmark" size={11} color={isPremium ? '#D4A017' : HomeTheme.cardGreen} />
                      <AppText variant="caption" weight="800" color={isPremium ? '#D4A017' : HomeTheme.cardGreen} style={styles.roleText}>
                        ADMIN
                      </AppText>
                    </View>
                  ) : (
                    <View style={styles.roleBadgeNormal}>
                      <AppText variant="caption" weight="700" color={HomeTheme.textMuted} style={styles.roleText}>
                        MEMBER
                      </AppText>
                    </View>
                  )}

                  {canManage ? (
                    <TouchableOpacity
                      style={styles.settingsBtn}
                      activeOpacity={0.7}
                      accessibilityLabel="Member settings"
                      onPress={() => onMemberSettingsPress?.(member.id)}
                    >
                      <Ionicons name="settings-sharp" size={16} color="#64748B" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Access Details section for guest member */}
              {!member.isAdmin && member.allowedModules && member.allowedModules.length > 0 && (
                <View style={styles.accessDetailsSection}>
                  <AppText variant="caption" weight="800" color={HomeTheme.textMuted} style={{ fontSize: 10, marginBottom: 4 }}>
                    EDIT PERMISSIONS:
                  </AppText>
                  <View style={styles.miniChipsRow}>
                    {member.allowedModules.map((m) => (
                      <View key={m} style={styles.miniChip}>
                        <AppText variant="caption" weight="700" color="#2E7D32" style={{ fontSize: 10 }}>
                          {mapModuleNameToLabel(m)}
                        </AppText>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </CardContainer>
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
    lineHeight: 22,
  },
  activeBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#2D7A2D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  avatarOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
    paddingRight: Spacing.xs,
  },
  rightActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  roleBadgeNormal: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  roleText: {
    fontSize: 9,
    letterSpacing: 0.6,
  },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMembersCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.1)',
  },
  emptyMembersTitle: {
    marginTop: 4,
  },
  emptyMembersDesc: {
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 250,
    marginTop: 2,
  },
  guestBannerContainer: {
    marginBottom: Spacing.md,
  },
  guestInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF8EE',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(92, 179, 93, 0.2)',
  },
  guestInfoText: {
    flex: 1,
    lineHeight: 15,
  },
  myAccessContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
  },
  myAccessTitle: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  accessChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipAllowed: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  chipDenied: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  infoIconBtn: {
    padding: 2,
  },
  accessDetailsSection: {
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: Spacing.sm,
  },
  miniChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  miniChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  hostBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hostBadgeText: {
    fontSize: 9,
  },
});
