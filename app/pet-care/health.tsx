import React, { useState } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useActivePet } from '@/hooks/useActivePet';
import { useHealthMetrics } from '@/hooks/useHealthMetrics';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import type { HealthMetric } from '@/types/health';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HealthScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { pet } = useActivePet(token);
  const petId = pet?._id ?? null;

  const { metrics, loading, error, actionId, reload, create, update, remove } = useHealthMetrics(
    token,
    petId,
    Boolean(petId),
  );

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<HealthMetric | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [weightKg, setWeightKg] = useState('');
  const [activityMinutes, setActivityMinutes] = useState('');
  const [sleepHours, setSleepHours] = useState('');

  const openCreate = () => {
    setEditing(null);
    setDate(new Date().toISOString().split('T')[0]);
    setWeightKg('');
    setActivityMinutes('');
    setSleepHours('');
    setModalVisible(true);
  };

  const openEdit = (metric: HealthMetric) => {
    setEditing(metric);
    setDate(metric.date.split('T')[0]);
    setWeightKg(metric.weightKg != null ? String(metric.weightKg) : '');
    setActivityMinutes(metric.activityMinutes != null ? String(metric.activityMinutes) : '');
    setSleepHours(metric.sleepHours != null ? String(metric.sleepHours) : '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!petId) return;
    const payload = {
      date: `${date}T12:00:00.000Z`,
      weightKg: weightKg ? Number(weightKg) : null,
      activityMinutes: activityMinutes ? Number(activityMinutes) : null,
      sleepHours: sleepHours ? Number(sleepHours) : null,
    };
    try {
      if (editing) {
        await update(editing._id, payload);
      } else {
        await create({ petId, ...payload });
      }
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Could not save health metric.');
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
        title="Health Metrics"
        onBack={() => router.back()}
        rightLabel="Add"
        onRightPress={openCreate}
      />

      {error ? (
        <View style={styles.banner}>
          <AuthErrorBanner message={error} />
        </View>
      ) : null}

      {loading && metrics.length === 0 ? (
        <ActivityIndicator color={HomeTheme.cardGreen} style={styles.loader} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={HomeTheme.cardGreen} />
          }
        >
          {metrics.length === 0 ? (
            <AppText variant="bodySmall" color={HomeTheme.textMuted} style={styles.empty}>
              No health entries yet. Tap Add to log weight, activity, or sleep.
            </AppText>
          ) : (
            metrics.map((metric) => (
              <View key={metric._id} style={styles.card}>
                <View style={styles.cardMain}>
                  <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
                    {formatDate(metric.date)}
                  </AppText>
                  <AppText variant="caption" color={HomeTheme.textMuted}>
                    {metric.weightKg != null ? `${metric.weightKg} kg` : '—'} ·{' '}
                    {metric.activityMinutes != null ? `${metric.activityMinutes} min activity` : '—'} ·{' '}
                    {metric.sleepHours != null ? `${metric.sleepHours} h sleep` : '—'}
                  </AppText>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => openEdit(metric)} hitSlop={8}>
                    <MaterialCommunityIcons name="pencil-outline" size={20} color={HomeTheme.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Delete entry?', formatDate(metric.date), [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => remove(metric._id) },
                      ])
                    }
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#C62828" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText variant="h3" weight="800" color={HomeTheme.text} style={styles.modalTitle}>
              {editing ? 'Edit health entry' : 'New health entry'}
            </AppText>
            <FormField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-05-23" />
            <FormField label="Weight (kg)" value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" />
            <FormField
              label="Activity (minutes)"
              value={activityMinutes}
              onChangeText={setActivityMinutes}
              keyboardType="numeric"
            />
            <FormField label="Sleep (hours)" value={sleepHours} onChangeText={setSleepHours} keyboardType="decimal-pad" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <AppText variant="bodySmall" weight="700" color={HomeTheme.textMuted}>
                  Cancel
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={Boolean(actionId)}>
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
  banner: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  loader: { marginTop: Spacing.xl },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.sm },
  empty: { textAlign: 'center', marginTop: Spacing.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HomeTheme.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  cardMain: { flex: 1, gap: 2 },
  cardActions: { flexDirection: 'row', gap: Spacing.sm },
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
  },
  modalTitle: { marginBottom: Spacing.md },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.md },
  cancelBtn: { padding: Spacing.sm },
  saveBtn: {
    backgroundColor: HomeTheme.cardGreen,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
});
