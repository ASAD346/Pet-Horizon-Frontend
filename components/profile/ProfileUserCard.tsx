import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppText } from '@/components/ui/AppText';
import { homeCardShadow } from '@/components/home/homeStyles';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';

interface ProfileUserCardProps {
  name: string;
  email: string;
  imageUrl?: string;
  onEditPress: () => void;
}

export function ProfileUserCard({ name, email, imageUrl, onEditPress }: ProfileUserCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={36} color={HomeTheme.white} />
          </View>
        )}
        <View style={styles.info}>
          <AppText variant="h3" weight="800" color={ProfileTheme.text}>
            {name}
          </AppText>
          <AppText variant="bodySmall" color={ProfileTheme.textMuted}>
            {email}
          </AppText>
        </View>
      </View>
      <TouchableOpacity style={styles.editBtn} onPress={onEditPress} activeOpacity={0.8}>
        <AppText variant="caption" weight="700" color={ProfileTheme.purple} style={styles.editText}>
          EDIT PROFILE
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ProfileTheme.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...homeCardShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    marginRight: Spacing.md,
  },
  avatarFallback: {
    backgroundColor: ProfileTheme.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  editBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  editText: {
    letterSpacing: 0.8,
  },
});
