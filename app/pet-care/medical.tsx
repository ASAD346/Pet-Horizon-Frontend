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
import { useMedicalRecords } from '@/hooks/useMedicalRecords';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import type { MedicalRecord } from '@/types/medical';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MedicalScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { pet } = useActivePet(token);
  const petId = pet?._id ?? null;

  const { records, loading, error, actionId, reload, create, update, remove } = useMedicalRecords(
    token,
    petId,
    Boolean(petId),
  );

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<MedicalRecord | null>(null);
  const [title, setTitle] = useState('');
  const [recordType, setRecordType] = useState('');
  const [description, setDescription] = useState('');
  const [veterinarianName, setVeterinarianName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [nextDueDate, setNextDueDate] = useState('');

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setRecordType('');
    setDescription('');
    setVeterinarianName('');
    setHospitalName('');
    setDate(new Date().toISOString().split('T')[0]);
    setNextDueDate('');
    setModalVisible(true);
  };

  const openEdit = (record: MedicalRecord) => {
    setEditing(record);
    setTitle(record.title ?? '');
    setRecordType(record.recordType ?? '');
    setDescription(record.description ?? '');
    setVeterinarianName(record.veterinarianName ?? '');
    setHospitalName(record.hospitalName ?? '');
    setDate(record.date.split('T')[0]);
    setNextDueDate(record.nextDueDate ? record.nextDueDate.split('T')[0] : '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!petId) return;
    const payload = {
      title: title.trim() || undefined,
      recordType: recordType.trim() || undefined,
      description: description.trim() || undefined,
      veterinarianName: veterinarianName.trim() || undefined,
      hospitalName: hospitalName.trim() || undefined,
      date: `${date}T12:00:00.000Z`,
      nextDueDate: nextDueDate ? `${nextDueDate}T12:00:00.000Z` : undefined,
    };
    try {
      if (editing) {
        await update(editing._id, payload);
      } else {
        await create({ petId, ...payload });
      }
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Could not save medical record.');
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
        title="Medical Records"
        onBack={() => router.back()}
        rightLabel="Add"
        onRightPress={openCreate}
      />

      {error ? (
        <View style={styles.banner}>
          <AuthErrorBanner message={error} />
        </View>
      ) : null}

      {loading && records.length === 0 ? (
        <ActivityIndicator color={HomeTheme.cardGreen} style={styles.loader} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={HomeTheme.cardGreen} />
          }
        >
          {records.length === 0 ? (
            <AppText variant="bodySmall" color={HomeTheme.textMuted} style={styles.empty}>
              No medical records yet. Tap Add to log a vet visit or treatment.
            </AppText>
          ) : (
            records.map((record) => (
              <View key={record._id} style={styles.card}>
                <View style={styles.cardMain}>
                  <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
                    {record.title || record.recordType || 'Medical record'}
                  </AppText>
                  <AppText variant="caption" color={HomeTheme.textMuted}>
                    {formatDate(record.date)}
                    {record.veterinarianName ? ` · Dr. ${record.veterinarianName}` : ''}
                    {record.hospitalName ? ` · ${record.hospitalName}` : ''}
                  </AppText>
                  {record.nextDueDate ? (
                    <AppText variant="caption" weight="700" color={HomeTheme.infoAccent}>
                      Next due {formatDate(record.nextDueDate)}
                    </AppText>
                  ) : null}
                  {record.description ? (
                    <AppText variant="caption" color={HomeTheme.textMuted} numberOfLines={2}>
                      {record.description}
                    </AppText>
                  ) : null}
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => openEdit(record)} hitSlop={8}>
                    <MaterialCommunityIcons name="pencil-outline" size={20} color={HomeTheme.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Delete record?', record.title || 'Medical record', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => remove(record._id) },
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
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <AppText variant="h3" weight="800" color={HomeTheme.text} style={styles.modalTitle}>
                {editing ? 'Edit record' : 'New record'}
              </AppText>
              <FormField label="Title" value={title} onChangeText={setTitle} placeholder="Annual checkup" />
              <FormField label="Type" value={recordType} onChangeText={setRecordType} placeholder="checkup, surgery…" />
              <FormField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
              <FormField label="Veterinarian" value={veterinarianName} onChangeText={setVeterinarianName} />
              <FormField label="Hospital / clinic" value={hospitalName} onChangeText={setHospitalName} />
              <FormField label="Next due date" value={nextDueDate} onChangeText={setNextDueDate} placeholder="YYYY-MM-DD" />
              <FormField
                label="Description"
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Notes"
              />
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
          </ScrollView>
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
    alignItems: 'flex-start',
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
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
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
