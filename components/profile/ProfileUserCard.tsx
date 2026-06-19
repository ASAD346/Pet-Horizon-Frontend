import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
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
}

export function ProfileUserCard({ name, email, imageUrl }: ProfileUserCardProps) {
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
});
