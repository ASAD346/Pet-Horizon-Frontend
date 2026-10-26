import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { DelegationTask, FamilyCaretaker } from '@/types/delegation';
import { resolveMediaUrl } from '@/lib/mediaUrl';

interface AssignMemberModalProps {
  visible: boolean;
  task: DelegationTask | null;
  caretakers: FamilyCaretaker[];
  onClose: () => void;
  onAssign: (targetUserId: string | null) => void;
  assigning?: boolean;
}

export function AssignMemberModal({
  visible,
  task,
  caretakers,
  onClose,
  onAssign,
  assigning = false,
}: AssignMemberModalProps) {
  if (!task) return null;

  const currentAssignedId = task.assignment?.userId;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <View style={styles.grabber} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={22} color="#184F2E" />
            </View>
            <View style={styles.headerTitles}>
              <AppText variant="h3" weight="800" color="#184F2E">
                Assign Caretaker
              </AppText>
              <AppText variant="caption" color={Palette.gray[600]}>
                Select who is accountable for “{task.title || task.category}”
              </AppText>
            </View>
          </View>

          <ScrollView style={styles.membersList} showsVerticalScrollIndicator={false}>
            {/* Unassign / Open to All option */}
            <TouchableOpacity
              style={[
                styles.memberRow,
                !currentAssignedId && styles.memberRowSelected,
              ]}
              onPress={() => onAssign(null)}
              activeOpacity={0.75}
              disabled={assigning}
            >
              <View style={styles.openIconWrap}>
                <Ionicons name="people-outline" size={20} color="#E67E22" />
              </View>
              <View style={styles.memberInfo}>
                <AppText variant="bodySmall" weight="800" color={Palette.gray[900]}>
                  Open to Family (Unassigned)
                </AppText>
                <AppText variant="caption" color={Palette.gray[600]}>
                  Any family member can pick up and complete this chore
                </AppText>
              </View>
              {!currentAssignedId ? (
                <Ionicons name="checkmark-circle" size={22} color="#184F2E" />
              ) : null}
            </TouchableOpacity>

            {/* Caretakers list */}
            {caretakers.map((member) => {
              const isSelected = currentAssignedId === member.userId;
              const media = resolveMediaUrl(member.avatarUrl);

              return (
                <TouchableOpacity
                  key={member.userId}
                  style={[
                    styles.memberRow,
                    isSelected && styles.memberRowSelected,
                  ]}
                  onPress={() => onAssign(member.userId)}
                  activeOpacity={0.75}
                  disabled={assigning}
                >
                  <View style={styles.avatarWrap}>
                    {media ? (
                      <Image source={{ uri: media }} style={styles.avatarImg} contentFit="cover" />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <AppText variant="bodySmall" weight="800" color="#184F2E">
                          {member.name.charAt(0).toUpperCase()}
                        </AppText>
                      </View>
                    )}
                  </View>

                  <View style={styles.memberInfo}>
                    <View style={styles.nameRow}>
                      <AppText variant="bodySmall" weight="800" color={Palette.gray[900]}>
                        {member.name}
                      </AppText>
                      {member.isOwner ? (
                        <View style={styles.ownerChip}>
                          <AppText variant="caption" weight="800" color="#184F2E" style={{ fontSize: 10 }}>
                            Owner
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                    <AppText variant="caption" color={Palette.gray[500]}>
                      {member.email}
                    </AppText>
                  </View>

                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={22} color="#184F2E" />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <AppText variant="bodySmall" weight="700" color={Palette.gray[700]}>
              Close
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 43, 78, 0.45)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    maxHeight: '78%',
    gap: Spacing.sm,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: 4,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  headerTitles: {
    flex: 1,
  },
  membersList: {
    maxHeight: 310,
    marginTop: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md - 2,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.xs + 2,
    backgroundColor: '#FAFAFA',
  },
  memberRowSelected: {
    borderColor: '#184F2E',
    backgroundColor: '#EEF6EE',
  },
  openIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF5EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 38,
    height: 38,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ownerChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  closeBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    marginTop: Spacing.xs,
  },
});
