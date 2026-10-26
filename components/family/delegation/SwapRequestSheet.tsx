import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { DelegationTask, FamilyCaretaker } from '@/types/delegation';
import { resolveMediaUrl } from '@/lib/mediaUrl';

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
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  if (!task) return null;

  const eligibleCaretakers = caretakers.filter((c) => c.userId !== currentUserId);

  const handleSubmit = () => {
    onSubmit(selectedTargetId, note.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
              <Ionicons name="swap-horizontal" size={20} color="#E67E22" />
            </View>
            <View style={styles.headerTitles}>
              <AppText variant="h3" weight="800" color="#184F2E">
                Request Chore Swap
              </AppText>
              <AppText variant="caption" color={Palette.gray[600]}>
                For “{task.title || task.category}” ({task.timingMode === 'window' ? `${task.window?.startTime} – ${task.window?.endTime}` : task.exactTime})
              </AppText>
            </View>
          </View>

          {/* Target Selection */}
          <AppText variant="caption" weight="800" color="#184F2E" style={styles.sectionLabel}>
            WHO SHOULD COVER THIS?
          </AppText>

          {/* Open Call Option */}
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
                color={selectedTargetId === null ? '#FFFFFF' : '#E67E22'}
              />
            </View>
            <View style={styles.broadcastTextWrap}>
              <AppText
                variant="bodySmall"
                weight="800"
                color={selectedTargetId === null ? '#184F2E' : Palette.gray[800]}
              >
                Ask Everyone in Family (Open Call)
              </AppText>
              <AppText variant="caption" color={Palette.gray[600]}>
                First caretaker to accept takes over the chore
              </AppText>
            </View>
            {selectedTargetId === null ? (
              <Ionicons name="checkmark-circle" size={22} color="#E67E22" />
            ) : null}
          </TouchableOpacity>

          {/* Specific Caretaker Carousel */}
          {eligibleCaretakers.length > 0 ? (
            <>
              <AppText variant="caption" weight="700" color={Palette.gray[500]} style={styles.subLabel}>
                Or ask a specific family member:
              </AppText>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.memberCarousel}
              >
                {eligibleCaretakers.map((member) => {
                  const isSelected = selectedTargetId === member.userId;
                  const media = resolveMediaUrl(member.avatarUrl);

                  return (
                    <TouchableOpacity
                      key={member.userId}
                      style={[styles.memberItem, isSelected && styles.memberItemSelected]}
                      onPress={() => setSelectedTargetId(member.userId)}
                      activeOpacity={0.8}
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
                        {isSelected ? (
                          <View style={styles.checkBadge}>
                            <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                          </View>
                        ) : null}
                      </View>
                      <AppText
                        variant="caption"
                        weight={isSelected ? '800' : '600'}
                        color={isSelected ? '#E67E22' : Palette.gray[800]}
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
          <AppText variant="caption" weight="800" color="#184F2E" style={styles.sectionLabel}>
            OPTIONAL NOTE FOR THE FAMILY
          </AppText>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Stuck at work until 3pm, can someone handle lunch?"
            placeholderTextColor={Palette.gray[400]}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={140}
          />

          {/* Accountability Notice */}
          <View style={styles.accountabilityCard}>
            <Ionicons name="shield-checkmark" size={16} color="#184F2E" />
            <AppText variant="caption" color={Palette.gray[700]} style={styles.accountabilityText}>
              Accountability Note: You remain the assigned caretaker until another member accepts.
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
              <Ionicons name="paper-plane" size={15} color="#FFFFFF" />
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
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
    backgroundColor: '#FFF5EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  headerTitles: {
    flex: 1,
  },
  sectionLabel: {
    letterSpacing: 0.5,
    marginTop: 4,
    fontSize: 11,
  },
  subLabel: {
    marginTop: 2,
  },
  broadcastOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md - 2,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
    gap: Spacing.md,
  },
  broadcastOptionSelected: {
    borderColor: '#E67E22',
    backgroundColor: '#FFF8F0',
  },
  broadcastIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF5EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastIconSelected: {
    backgroundColor: '#E67E22',
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
    width: 68,
    padding: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  memberItemSelected: {
    borderColor: '#E67E22',
    backgroundColor: '#FFF8F0',
  },
  avatarWrap: {
    position: 'relative',
    width: 46,
    height: 46,
    borderRadius: 23,
    marginBottom: 4,
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#E67E22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  memberName: {
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#F8FAF8',
    borderRadius: 14,
    padding: Spacing.md,
    fontSize: 14,
    color: Palette.gray[900],
    minHeight: 64,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  accountabilityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: '#EEF6EE',
    padding: Spacing.sm + 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    marginTop: 2,
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
    backgroundColor: '#F1F5F9',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.full,
    backgroundColor: '#E67E22',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
