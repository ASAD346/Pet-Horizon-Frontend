import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HomeTheme, JournalTheme, Radius, Spacing } from '@/constants/theme';
import { Skeleton, SkeletonCircle, SkeletonList } from '@/components/ui/Skeleton';

export function SkeletonScreenLayout() {
  return (
    <View style={styles.screen}>
      <View style={styles.screenHeader}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <Skeleton width="40%" height={18} />
        <Skeleton width={36} height={36} borderRadius={18} />
      </View>
      <Skeleton height={160} borderRadius={Radius.lg} style={styles.blockGap} />
      <SkeletonList count={4} />
    </View>
  );
}

export function SkeletonNotificationList({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.notificationList}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.notificationCard}>
          <Skeleton width="55%" height={14} />
          <Skeleton width="90%" height={11} style={styles.gapSm} />
          <Skeleton width="35%" height={10} style={styles.gapSm} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonPetProfileCard() {
  return (
    <View style={styles.profileCard}>
      <View style={styles.profileTop}>
        <SkeletonCircle size={64} tone="dark" />
        <View style={styles.profileInfo}>
          <Skeleton width="65%" height={20} tone="dark" />
          <Skeleton width="80%" height={12} tone="dark" style={styles.gapSm} />
          <View style={styles.tagRow}>
            <Skeleton width={52} height={22} borderRadius={Radius.full} tone="dark" />
            <Skeleton width={52} height={22} borderRadius={Radius.full} tone="dark" />
          </View>
        </View>
      </View>
      <Skeleton width="100%" height={1} tone="dark" style={styles.divider} />
      <View style={styles.statsRow}>
        {[0, 1, 2].map((key) => (
          <View key={key} style={styles.statCol}>
            <Skeleton width={48} height={10} tone="dark" />
            <Skeleton width={36} height={14} tone="dark" style={styles.gapSm} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function SkeletonWeeklySpendingCard() {
  return (
    <View style={styles.spendingCard}>
      <Skeleton width="40%" height={12} tone="dark" />
      <Skeleton width="55%" height={28} tone="dark" style={styles.gapMd} />
      <Skeleton width="100%" height={8} borderRadius={Radius.full} tone="dark" style={styles.gapMd} />
      <View style={styles.spendingFooter}>
        <Skeleton width="45%" height={12} tone="dark" />
        <Skeleton width="30%" height={12} tone="dark" />
      </View>
    </View>
  );
}

export function SkeletonScheduleSections({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <SkeletonCircle size={40} />
            <View style={styles.scheduleHeaderText}>
              <Skeleton width="45%" height={16} />
              <Skeleton width="70%" height={11} style={styles.gapSm} />
            </View>
          </View>
          <Skeleton width="100%" height={36} borderRadius={Radius.md} style={styles.gapMd} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonJournalScreen() {
  return (
    <View style={styles.journalWrap}>
      <View style={styles.journalHeader}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <Skeleton width="40%" height={18} />
        <Skeleton width={36} height={36} borderRadius={18} />
      </View>
      <View style={styles.dateStrip}>
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton key={index} width={44} height={56} borderRadius={Radius.md} />
        ))}
      </View>
      <View style={styles.chipRow}>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} width={72} height={32} borderRadius={Radius.full} />
        ))}
      </View>
      <SkeletonList count={4} cardStyle={styles.journalCard} />
    </View>
  );
}

export function SkeletonInviteCard() {
  return (
    <View style={styles.inviteWrap}>
      <Skeleton width="60%" height={24} style={styles.inviteTitle} />
      <View style={styles.inviteCard}>
        <SkeletonCircle size={96} />
        <Skeleton width="50%" height={20} style={styles.gapMd} />
        <Skeleton width="70%" height={12} />
        <Skeleton width="40%" height={10} style={styles.gapSm} />
      </View>
      <Skeleton width="100%" height={48} borderRadius={Radius.full} />
    </View>
  );
}

export function SkeletonFamilyOverviewCard() {
  return (
    <View style={styles.familyCard}>
      <Skeleton width="55%" height={22} tone="dark" />
      <Skeleton width="35%" height={12} tone="dark" style={styles.gapSm} />
      <Skeleton width="100%" height={72} borderRadius={Radius.lg} tone="dark" style={styles.gapMd} />
      <Skeleton width="100%" height={48} borderRadius={Radius.full} tone="dark" />
    </View>
  );
}

export function SkeletonChipGrid({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.chipGrid}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} width="30%" height={72} borderRadius={Radius.md} />
      ))}
    </View>
  );
}

export function SkeletonPetSwitcherList({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.petRow}>
          <SkeletonCircle size={52} />
          <View style={styles.petRowText}>
            <Skeleton width="50%" height={16} />
            <Skeleton width="35%" height={11} style={styles.gapSm} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function SkeletonPremiumPlans() {
  return (
    <View style={styles.planRow}>
      <Skeleton width="48%" height={140} borderRadius={Radius.lg} />
      <Skeleton width="48%" height={140} borderRadius={Radius.lg} />
    </View>
  );
}

export function SkeletonProfileUserCard() {
  return (
    <View style={styles.profileUserCard}>
      <SkeletonCircle size={72} />
      <Skeleton width="50%" height={18} style={styles.gapMd} />
      <Skeleton width="68%" height={12} />
    </View>
  );
}

export function SkeletonBillingHistory({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.invoiceRow}>
          <View style={styles.invoiceText}>
            <Skeleton width={100} height={14} />
            <Skeleton width={64} height={10} style={styles.gapSm} />
          </View>
          <Skeleton width={48} height={16} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonFormSection({ lines = 3 }: { lines?: number }) {
  return (
    <View>
      <Skeleton width="30%" height={10} style={styles.gapSm} />
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} width="100%" height={44} borderRadius={Radius.md} style={styles.gapSm} />
      ))}
    </View>
  );
}

export function SkeletonCodeBlock() {
  return <Skeleton width={120} height={28} tone="dark" />;
}

export function SkeletonQRBox() {
  return <Skeleton width={160} height={160} borderRadius={Radius.md} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  blockGap: {
    marginBottom: Spacing.lg,
  },
  gapSm: {
    marginTop: Spacing.sm,
  },
  gapMd: {
    marginTop: Spacing.md,
  },
  notificationList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  notificationCard: {
    backgroundColor: HomeTheme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: HomeTheme.surfaceMuted,
  },
  profileCard: {
    backgroundColor: HomeTheme.cardGreen,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  profileTop: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  divider: {
    marginVertical: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  spendingCard: {
    backgroundColor: HomeTheme.cardGreen,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  spendingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scheduleCard: {
    backgroundColor: HomeTheme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: HomeTheme.surfaceMuted,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scheduleHeaderText: {
    flex: 1,
  },
  journalWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  dateStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  journalCard: {
    backgroundColor: JournalTheme.surface,
    borderColor: JournalTheme.border,
  },
  inviteWrap: {
    padding: Spacing.lg,
  },
  inviteTitle: {
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  inviteCard: {
    backgroundColor: HomeTheme.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  profileUserCard: {
    backgroundColor: HomeTheme.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  familyCard: {
    backgroundColor: HomeTheme.cardGreen,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  petRowText: {
    flex: 1,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  invoiceText: {
    flex: 1,
  },
});
