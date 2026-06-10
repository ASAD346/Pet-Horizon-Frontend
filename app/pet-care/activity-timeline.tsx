import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { FormField } from '@/components/pet-care/FormField';
import { ColorIconBadge } from '@/components/home/ColorIconBadge';
import { homePillCard } from '@/components/home/homeStyles';
import { useAuth } from '@/contexts/AuthContext';
import { useActivePet } from '@/hooks/useActivePet';
import { useActivityTimeline } from '@/hooks/useActivityTimeline';
import {
  ACTIVITY_CATEGORIES,
  activityCategoryStyle,
  formatActivityTime,
} from '@/lib/activity/activityDisplay';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import type { ActivityCategory, ActivityEntry } from '@/types/activity';

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function ActivityTimelineScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { pet } = useActivePet(token);
  const petId = pet?._id ?? null;

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<ActivityEntry | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('food');

  const { entries, loading, error, actionId, reload, create, update, complete, remove } =
    useActivityTimeline(token, petId, Boolean(petId), date);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [entries],
  );

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setCategory('food');
    setModalVisible(true);
  };

  const openEdit = (entry: ActivityEntry) => {
    setEditing(entry);
    setTitle(entry.title);
    setDescription(entry.description ?? '');
    setCategory((entry.category as ActivityCategory) || 'custom');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title for this activity.');
      return;
    }
    try {
      if (editing) {
        await update(editing._id, { title: title.trim(), description, category });
      } else {
        await create({ title: title.trim(), description, category, date: `${date}T12:00:00.000Z` });
      }
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Could not save activity.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ProfileScreenHeader
        title="Activity Timeline"
        onBack={() => router.back()}
        rightLabel="Add"
        onRightPress={openCreate}
      />

      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => setDate((d) => shiftDate(d, -1))} style={styles.dateBtn}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={HomeTheme.text} />
        </TouchableOpacity>
        <AppText variant="bodySmall" weight="700" color={HomeTheme.text}>
          {new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </AppText>
        <TouchableOpacity onPress={() => setDate((d) => shiftDate(d, 1))} style={styles.dateBtn}>
          <MaterialCommunityIcons name="chevron-right" size={22} color={HomeTheme.text} />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.banner}>
          <AuthErrorBanner message={error} />
        </View>
      ) : null}

      {loading && entries.length === 0 ? (
        <ActivityIndicator color={HomeTheme.cardGreen} style={styles.loader} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={HomeTheme.cardGreen} />
          }
        >
          {sortedEntries.length === 0 ? (
            <AppText variant="bodySmall" color={HomeTheme.textMuted} style={styles.empty}>
              No activities for this day. Tap Add to log one.
            </AppText>
          ) : (
            sortedEntries.map((entry) => {
              const style = activityCategoryStyle(entry.category);
              return (
                <View key={entry._id} style={[homePillCard.card, styles.entryCard]}>
                  <ColorIconBadge
                    color={style.color}
                    backgroundColor={style.bg}
                    materialIcon={style.icon}
                    size={44}
                    iconSize={22}
                  />
                  <View style={styles.entryText}>
                    <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
                      {entry.title}
                      {entry.isCompleted ? ' ✓' : ''}
                    </AppText>
                    <AppText variant="caption" color={HomeTheme.textMuted}>
                      {formatActivityTime(entry.date)} · {style.label}
                    </AppText>
                    {entry.description ? (
                      <AppText variant="caption" color={HomeTheme.textMuted} numberOfLines={2}>
                        {entry.description}
                      </AppText>
                    ) : null}
                  </View>
                  <View style={styles.entryActions}>
                    {!entry.isCompleted ? (
                      <TouchableOpacity
                        onPress={() => complete(entry._id)}
                        disabled={actionId === entry._id}
                        hitSlop={8}
                      >
                        <MaterialCommunityIcons name="check-circle-outline" size={22} color={HomeTheme.cardGreen} />
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity onPress={() => openEdit(entry)} hitSlop={8}>
                      <MaterialCommunityIcons name="pencil-outline" size={20} color={HomeTheme.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert('Delete activity?', entry.title, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => remove(entry._id),
                          },
                        ])
                      }
                      hitSlop={8}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color="#C62828" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText variant="h3" weight="800" color={HomeTheme.text} style={styles.modalTitle}>
              {editing ? 'Edit activity' : 'New activity'}
            </AppText>
            <ScrollView keyboardShouldPersistTaps="handled">
              <FormField label="Title" value={title} onChangeText={setTitle} placeholder="Morning walk" />
              <FormField
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Optional notes"
                multiline
              />
              <AppText variant="caption" weight="700" color={HomeTheme.textMuted} style={styles.catLabel}>
                Category
              </AppText>
              <View style={styles.catRow}>
                {ACTIVITY_CATEGORIES.map((cat) => {
                  const catStyle = activityCategoryStyle(cat);
                  const selected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catChip, selected && { backgroundColor: catStyle.bg, borderColor: catStyle.color }]}
                      onPress={() => setCategory(cat)}
                    >
                      <AppText
                        variant="caption"
                        weight="700"
                        color={selected ? catStyle.color : HomeTheme.textMuted}
                      >
                        {catStyle.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <AppText variant="bodySmall" weight="700" color={HomeTheme.textMuted}>
                  Cancel
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={actionId === 'create' || Boolean(editing && actionId === editing._id)}
              >
                <AppText variant="bodySmall" weight="700" color={HomeTheme.white}>
                  Save
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: HomeTheme.background },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dateBtn: {
    padding: Spacing.xs,
  },
  banner: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  loader: { marginTop: Spacing.xl },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.sm },
  empty: { textAlign: 'center', marginTop: Spacing.xl },
  entryCard: { alignItems: 'flex-start' },
  entryText: { flex: 1, marginLeft: Spacing.sm, gap: 2 },
  entryActions: { flexDirection: 'row', gap: Spacing.sm, marginLeft: Spacing.sm },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: HomeTheme.background,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalTitle: { marginBottom: Spacing.md },
  catLabel: { marginBottom: Spacing.xs },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
  catChip: {
    borderWidth: 1,
    borderColor: HomeTheme.surfaceMuted,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.sm },
  cancelBtn: { padding: Spacing.sm },
  saveBtn: {
    backgroundColor: HomeTheme.cardGreen,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
});
