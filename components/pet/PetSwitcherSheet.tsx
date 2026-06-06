import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { SheetColors } from '@/components/sheets';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import type { ApiPet } from '@/types/pet';
import { Image } from 'expo-image';

interface PetSwitcherSheetProps {
  visible: boolean;
  pets: ApiPet[];
  activePetId?: string | null;
  loading?: boolean;
  switchingId?: string | null;
  onClose: () => void;
  onSelectPet: (petId: string) => void;
  onAddPet?: () => void;
}

export function PetSwitcherSheet({
  visible,
  pets,
  activePetId,
  loading,
  switchingId,
  onClose,
  onSelectPet,
  onAddPet,
}: PetSwitcherSheetProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
              Switch Pet
            </AppText>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={HomeTheme.text} />
            </TouchableOpacity>
          </View>

          {loading ? <ActivityIndicator color={HomeTheme.cardGreen} style={styles.loader} /> : null}

          <ScrollView showsVerticalScrollIndicator={false}>
            {pets.map((pet) => {
              const active = pet._id === activePetId;
              const busy = switchingId === pet._id;
              return (
                <TouchableOpacity
                  key={pet._id}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => onSelectPet(pet._id)}
                  disabled={busy || active}
                >
                  <Image
                    source={
                      pet.image
                        ? { uri: resolveMediaUrl(pet.image) }
                        : require('../../assets/images/onboarding.png')
                    }
                    style={styles.avatar}
                  />
                  <View style={styles.info}>
                    <AppText variant="body" weight="700" color={HomeTheme.text}>
                      {pet.name}
                    </AppText>
                    <AppText variant="caption" color={HomeTheme.textMuted}>
                      {pet.breed || pet.species || 'Pet'}
                    </AppText>
                  </View>
                  {busy ? (
                    <ActivityIndicator size="small" color={HomeTheme.cardGreen} />
                  ) : active ? (
                    <Ionicons name="checkmark-circle" size={22} color={HomeTheme.cardGreen} />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={HomeTheme.textMuted} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => {
              onClose();
              if (activePetId) {
                router.push({ pathname: '/pet/register', params: { mode: 'edit', petId: activePetId } } as Href);
              }
            }}
          >
            <Ionicons name="create-outline" size={18} color={HomeTheme.cardGreen} />
            <AppText variant="bodySmall" weight="700" color={HomeTheme.cardGreen}>
              Edit active pet
            </AppText>
          </TouchableOpacity>

          {onAddPet ? (
            <TouchableOpacity style={styles.addBtn} onPress={onAddPet}>
              <Ionicons name="add-circle-outline" size={18} color={HomeTheme.text} />
              <AppText variant="bodySmall" weight="700" color={HomeTheme.text}>
                Add another pet
              </AppText>
            </TouchableOpacity>
          ) : null}
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
    maxHeight: '80%',
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
  loader: {
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.xs,
  },
  rowActive: {
    backgroundColor: '#E8F5E9',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.sm,
  },
  info: {
    flex: 1,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
});
