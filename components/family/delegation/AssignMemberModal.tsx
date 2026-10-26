import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { DelegationTask, FamilyCaretaker } from '@/types/delegation';

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

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={20} color={Palette.primary.base} />
            </View>
            <View style={styles.headerTitles}>
              <AppText variant="h3" weight="800" color={Palette.primary.base}>
                Assign Chore Caretaker
              </AppText>
              <AppText variant="caption" color={Palette.gray[600]}>
                Select who is responsible for “{task.title || task.category}”
              </AppText>
            </View>
          </View>

          <ScrollView style={styles.membersList} showsVerticalScrollIndicator={false}>
            {/* Unassign / Open option */}
            <TouchableOpacity
              style={[
                styles.memberRow,
                !currentAssignedId && styles.memberRowSelected,
              ]}
              onPress={() => onAssign(null)}
              activeOpacity={0.7}
              disabled={assigning}
            >
              <View style={styles.openIconWrap}>
                <Ionicons name="people-outline" size={18} color={Palette.secondary.base} />
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
                <Ionicons name="checkmark-circle" size={22} color={Palette.primary.base} />
              ) : null}
            </TouchableOpacity>

            {/* Caretakers list */}
            {caretakers.map((member) => {
              const isSelected = currentAssignedId === member.userId;
              return (
                <TouchableOpacity
                  key={member.userId}
                  style={[
                    styles.memberRow,
                    isSelected && styles.memberRowSelected,
                  ]}
                  onPress={() => onAssign(member.userId)}
                  activeOpacity={0.7}
                  disabled={assigning}
                >
                  <View style={styles.avatarWrap}>
                    {member.avatarUrl ? (
                      <Image source={{ uri: member.avatarUrl }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <AppText variant="bodySmall" weight="800" color={Palette.primary.base}>
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
                          <AppText variant="caption" weight="700" color="#184F2E">
                            Owner
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                    <AppText variant="caption" color={Palette.gray[600]}>
                      {member.email}
                    </AppText>
                  </View>

                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={22} color={Palette.primary.base} />
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
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    maxHeight: '75%',
    gap: Spacing.sm,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.gray[300],
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  membersList: {
    maxHeight: 300,
    marginTop: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md - 2,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    marginBottom: Spacing.xs + 2,
    backgroundColor: '#FAFAFA',
  },
  memberRowSelected: {
    borderColor: Palette.primary.base,
    backgroundColor: '#F0F3FA',
  },
  openIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.secondary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 36,
    height: 36,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.primary.light,
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
    borderRadius: Radius.xs,
  },
  closeBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: '#F5F5F5',
    marginTop: Spacing.xs,
  },
});
