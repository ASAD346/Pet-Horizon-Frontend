import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { SectionLabel, SheetColors } from '@/components/sheets';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/api/errors';
import { inviteFamilyMemberByEmail } from '@/services/family/familyHubApi';
import type { ApiPet } from '@/types/pet';

const MODULE_OPTIONS = [
  { id: 'feeding', label: 'Feeding' },
  { id: 'walks', label: 'Walks' },
  { id: 'medicine', label: 'Medicine' },
  { id: 'grooming', label: 'Grooming' },
  { id: 'vaccination', label: 'Vaccination' },
  { id: 'journal', label: 'Journal' },
  { id: 'expenses', label: 'Expenses' },
] as const;

const ACCESS_LEVELS = [
  { id: 'readonly', label: 'View only' },
  { id: 'edit', label: 'Can edit' },
] as const;

interface EmailInviteSheetProps {
  visible: boolean;
  familyId: string | null;
  token: string | null;
  familyPets: ApiPet[];
  onClose: () => void;
  onInvited: () => void;
}

export function EmailInviteSheet({
  visible,
  familyId,
  token,
  familyPets,
  onClose,
  onInvited,
}: EmailInviteSheetProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [accessLevel, setAccessLevel] = useState<'readonly' | 'edit'>('readonly');
  const [modules, setModules] = useState<string[]>(['feeding', 'walks', 'medicine']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setEmail('');
      setError(null);
      setSuccess(null);
      setSelectedPetId(familyPets[0]?._id ?? null);
    }
  }, [visible, familyPets]);

  const toggleModule = (moduleId: string) => {
    setModules((current) =>
      current.includes(moduleId)
        ? current.filter((item) => item !== moduleId)
        : [...current, moduleId],
    );
  };

  const handleSend = async () => {
    if (!token || !familyId || !selectedPetId) {
      setError('Family hub or pet not ready.');
      return;
    }
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await inviteFamilyMemberByEmail(token, familyId, {
        inviteeEmail: trimmed,
        permissions: [
          {
            petId: selectedPetId,
            accessLevel,
            allowedModules: modules,
          },
        ],
      });
      setSuccess(`Invitation sent. Expires ${new Date(result.expiresAt).toLocaleDateString()}.`);
      onInvited();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="h3" weight="800" color={SheetColors.title}>
              Invite by Email
            </AppText>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={HomeTheme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {error ? <AuthErrorBanner message={error} /> : null}
            {success ? (
              <AppText variant="bodySmall" color={HomeTheme.cardGreen} style={styles.success}>
                {success}
              </AppText>
            ) : null}

            <SectionLabel text="EMAIL ADDRESS" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="caregiver@email.com"
              placeholderTextColor={SheetColors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <SectionLabel text="FAMILY PET" />
            {familyPets.length === 0 ? (
              <AppText variant="bodySmall" color={HomeTheme.textMuted} style={styles.hint}>
                Add a pet to this family hub before sending email invites. Pets must belong to the
                hub (created with familyId).
              </AppText>
            ) : (
              <View style={styles.chipRow}>
                {familyPets.map((pet) => {
                  const active = selectedPetId === pet._id;
                  return (
                    <TouchableOpacity
                      key={pet._id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSelectedPetId(pet._id)}
                    >
                      <AppText
                        variant="bodySmall"
                        weight="600"
                        color={active ? HomeTheme.white : HomeTheme.textMuted}
                      >
                        {pet.name}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <SectionLabel text="ACCESS LEVEL" />
            <View style={styles.chipRow}>
              {ACCESS_LEVELS.map((level) => {
                const active = accessLevel === level.id;
                return (
                  <TouchableOpacity
                    key={level.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setAccessLevel(level.id)}
                  >
                    <AppText
                      variant="bodySmall"
                      weight="600"
                      color={active ? HomeTheme.white : HomeTheme.textMuted}
                    >
                      {level.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <SectionLabel text="ALLOWED MODULES" />
            <View style={styles.chipRow}>
              {MODULE_OPTIONS.map((module) => {
                const active = modules.includes(module.id);
                return (
                  <TouchableOpacity
                    key={module.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggleModule(module.id)}
                  >
                    <AppText
                      variant="bodySmall"
                      weight="600"
                      color={active ? HomeTheme.white : HomeTheme.textMuted}
                    >
                      {module.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <AppButton
            title="Send Email Invite"
            onPress={handleSend}
            loading={saving}
            disabled={saving || familyPets.length === 0}
            variant="success"
            size="md"
            style={styles.saveBtn}
            icon={<Ionicons name="mail-outline" size={18} color={HomeTheme.white} />}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: SheetColors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SheetColors.sheetBg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    maxHeight: '90%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  success: {
    marginBottom: Spacing.sm,
  },
  hint: {
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  input: {
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: SheetColors.inputText,
    marginBottom: Spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: SheetColors.chipBg,
  },
  chipActive: {
    backgroundColor: HomeTheme.cardGreen,
  },
  saveBtn: {
    width: '100%',
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
});
