import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { DelegationTask, FamilyCaretaker } from '@/types/delegation';

interface SwapRequestSheetProps {
  visible: boolean;
  task: DelegationTask | null;
  caretakers: FamilyCaretaker[];
  currentUserId?: string;
  onClose: () => void;
  onSubmit: (targetUserId: string | null, note: string) => void;
  submitting?: boolean;
}

export function SwapRequestSheet({
  visible,
  task,
  caretakers,
  currentUserId,
  onClose,
  onSubmit,
  submitting = false,
}: SwapRequestSheetProps) {
  // null = broadcast to everyone in household
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  if (!task) return null;

  // Filter out current user from potential targets
  const eligibleCaretakers = caretakers.filter((c) => c.userId !== currentUserId);

  const handleSubmit = () => {
    onSubmit(selectedTargetId, note.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <View style={styles.grabber} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="swap-horizontal" size={20} color={Palette.secondary.base} />
            </View>
            <View style={styles.headerTitles}>
              <AppText variant="h3" weight="800" color={Palette.primary.base}>
                Request Chore Coverage
              </AppText>
              <AppText variant="caption" color={Palette.gray[600]}>
                For “{task.title || task.category}” ({task.timingMode === 'window' ? `${task.window?.startTime} – ${task.window?.endTime}` : task.exactTime})
              </AppText>
            </View>
          </View>

          {/* Recipient Selection Section */}
          <AppText variant="bodySmall" weight="800" color={Palette.gray[800]} style={styles.sectionLabel}>
            Who should cover this?
          </AppText>

          {/* Broadcast pill button */}
          <TouchableOpacity
            style={[
              styles.broadcastOption,
              selectedTargetId === null && styles.broadcastOptionSelected,
            ]}
            onPress={() => setSelectedTargetId(null)}
            activeOpacity={0.8}
          >
            <View style={[styles.broadcastIcon, selectedTargetId === null && styles.broadcastIconSelected]}>
              <Ionicons
                name="megaphone-outline"
                size={18}
                color={selectedTargetId === null ? '#FFFFFF' : Palette.secondary.base}
              />
            </View>
            <View style={styles.broadcastTextWrap}>
              <AppText
                variant="bodySmall"
                weight="700"
                color={selectedTargetId === null ? Palette.primary.base : Palette.gray[800]}
              >
                Ask Everyone in Family (Open Call)
              </AppText>
              <AppText variant="caption" color={Palette.gray[600]}>
                First family member to accept gets the task
              </AppText>
            </View>
            {selectedTargetId === null ? (
              <Ionicons name="checkmark-circle" size={20} color={Palette.secondary.base} />
            ) : null}
          </TouchableOpacity>

          {/* Direct Member Carousel */}
          {eligibleCaretakers.length > 0 ? (
            <>
              <AppText variant="caption" weight="700" color={Palette.gray[500]} style={styles.subLabel}>
                Or ask a specific caretaker:
              </AppText>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.memberCarousel}
              >
                {eligibleCaretakers.map((member) => {
                  const isSelected = selectedTargetId === member.userId;
                  return (
                    <TouchableOpacity
                      key={member.userId}
                      style={[
                        styles.memberItem,
                        isSelected && styles.memberItemSelected,
                      ]}
                      onPress={() => setSelectedTargetId(member.userId)}
                      activeOpacity={0.8}
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
                        {isSelected ? (
                          <View style={styles.checkBadge}>
                            <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                          </View>
                        ) : null}
                      </View>
                      <AppText
                        variant="caption"
                        weight={isSelected ? '800' : '600'}
                        color={isSelected ? Palette.secondary.base : Palette.gray[800]}
                        numberOfLines={1}
                        style={styles.memberName}
                      >
                        {member.name}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          ) : null}

          {/* Optional Note */}
          <AppText variant="bodySmall" weight="800" color={Palette.gray[800]} style={styles.sectionLabel}>
            Optional Note:
          </AppText>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Stuck in a meeting, can someone feed Milo?"
            placeholderTextColor={Palette.gray[400]}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={140}
          />

          {/* Accountability Notice */}
          <View style={styles.accountabilityCard}>
            <Ionicons name="shield-checkmark-outline" size={16} color={Palette.primary.base} />
            <AppText variant="caption" color={Palette.gray[700]} style={styles.accountabilityText}>
              Accountability Note: You remain the assigned caretaker until a family member accepts this swap.
            </AppText>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <AppText variant="bodySmall" weight="700" color={Palette.gray[700]}>
                Cancel
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.btnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={submitting}
            >
              <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
              <AppText variant="bodySmall" weight="800" color="#FFFFFF">
                {submitting ? 'Sending...' : 'Send Swap Request'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: Palette.secondary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  sectionLabel: {
    marginTop: 4,
  },
  subLabel: {
    marginTop: 4,
  },
  broadcastOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
    gap: Spacing.md,
  },
  broadcastOptionSelected: {
    borderColor: Palette.secondary.base,
    backgroundColor: '#FFF8F0',
  },
  broadcastIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.secondary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastIconSelected: {
    backgroundColor: Palette.secondary.base,
  },
  broadcastTextWrap: {
    flex: 1,
  },
  memberCarousel: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: 4,
  },
  memberItem: {
    alignItems: 'center',
    width: 64,
    padding: 6,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  memberItemSelected: {
    borderColor: Palette.secondary.base,
    backgroundColor: '#FFF8F0',
  },
  avatarWrap: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'visible',
    marginBottom: 4,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Palette.secondary.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  memberName: {
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: Palette.gray[900],
    minHeight: 64,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  accountabilityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: '#F0F3FA',
    padding: Spacing.sm + 2,
    borderRadius: Radius.sm,
    marginTop: 4,
  },
  accountabilityText: {
    flex: 1,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: '#F5F5F5',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.full,
    backgroundColor: Palette.secondary.base,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
