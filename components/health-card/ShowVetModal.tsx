import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import type { HealthCardPet, HealthTimelineEvent } from '@/services/pets/healthCardApi';

interface ShowVetModalProps {
  visible: boolean;
  onClose: () => void;
  pet: HealthCardPet;
  timeline: HealthTimelineEvent[];
}

export function ShowVetModal({ visible, onClose, pet, timeline }: ShowVetModalProps) {
  const imageUrl = pet.image ? resolveMediaUrl(pet.image) : null;

  // Filter vaccines and active medicines for vet attention
  const vaccines = timeline.filter((e) => e.category === 'vaccination');
  const activeMeds = timeline.filter((e) => e.category === 'medicine' && (e.status === 'active' || e.status === 'scheduled'));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleArea}>
            <MaterialCommunityIcons name="clipboard-pulse-outline" size={24} color="#0E3821" />
            <View style={{ marginLeft: 8 }}>
              <AppText variant="h3" weight="800" color="#0E3821">
                Veterinary Medical Summary
              </AppText>
              <AppText variant="caption" color="#64748B">
                Clinical reference card for {pet.name}
              </AppText>
            </View>
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Close vet summary"
          >
            <Ionicons name="close" size={20} color="#0E3821" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Pet ID Bar */}
          <View style={styles.petIdCard}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.petImage} contentFit="cover" />
            ) : (
              <View style={styles.petImageFallback}>
                <MaterialCommunityIcons name="paw" size={28} color="#FFFFFF" />
              </View>
            )}

            <View style={styles.petInfo}>
              <AppText variant="h3" weight="800" color="#0E3821">
                {pet.name}
              </AppText>
              <AppText variant="caption" weight="600" color="#475569">
                {pet.breed || pet.species ? `${pet.breed} • ${pet.species}` : 'Pet Companion'}
              </AppText>
              <View style={styles.vitalsRow}>
                <AppText variant="caption" color="#64748B">
                  Age: <AppText variant="caption" weight="700" color="#0E3821">{pet.age ?? '—'} yr</AppText>
                </AppText>
                <AppText variant="caption" color="#94A3B8">•</AppText>
                <AppText variant="caption" color="#64748B">
                  Weight: <AppText variant="caption" weight="700" color="#0E3821">{pet.weight ? `${pet.weight} ${pet.weightUnit}` : '—'}</AppText>
                </AppText>
                <AppText variant="caption" color="#94A3B8">•</AppText>
                <AppText variant="caption" color="#64748B">
                  Sex: <AppText variant="caption" weight="700" color="#0E3821">{pet.gender || '—'}</AppText>
                </AppText>
              </View>
            </View>
          </View>

          {/* CRITICAL MEDICAL ALERTS SECTION: Allergies & Blood Group */}
          <View style={styles.alertCard}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="alert-decagram" size={20} color="#C62828" />
              <AppText variant="bodySmall" weight="800" color="#C62828" style={styles.sectionTitle}>
                ALLERGIES & CRITICAL HEALTH NOTES
              </AppText>
            </View>

            <View style={styles.alertContent}>
              <View style={styles.alertItem}>
                <AppText variant="caption" weight="700" color="#475569">Known Allergies:</AppText>
                <AppText variant="bodySmall" weight="800" color={pet.allergies ? '#C62828' : '#2E7D32'}>
                  {pet.allergies || 'No known allergies reported'}
                </AppText>
              </View>

              {pet.bloodGroup ? (
                <View style={styles.alertItem}>
                  <AppText variant="caption" weight="700" color="#475569">Blood Group:</AppText>
                  <AppText variant="bodySmall" weight="800" color="#0E3821">
                    {pet.bloodGroup}
                  </AppText>
                </View>
              ) : null}

              {pet.medicalNotes ? (
                <View style={[styles.alertItem, { marginTop: 4 }]}>
                  <AppText variant="caption" weight="700" color="#475569">Medical Notes:</AppText>
                  <AppText variant="caption" color="#334155">
                    {pet.medicalNotes}
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>

          {/* REGISTERED CLINIC */}
          <View style={styles.clinicCard}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="hospital-building" size={18} color="#0D47A1" />
              <AppText variant="bodySmall" weight="800" color="#0D47A1" style={styles.sectionTitle}>
                PRIMARY VET CLINIC
              </AppText>
            </View>
            <AppText variant="bodySmall" weight="700" color="#1E293B">
              {pet.vetClinic || 'No specific clinic registered yet'}
            </AppText>
          </View>

          {/* ACTIVE PRESCRIPTIONS */}
          <View style={styles.sectionBox}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="pill" size={18} color="#1565C0" />
              <AppText variant="bodySmall" weight="800" color="#0E3821" style={styles.sectionTitle}>
                ACTIVE MEDICATIONS ({activeMeds.length})
              </AppText>
            </View>

            {activeMeds.length === 0 ? (
              <AppText variant="caption" color="#64748B">No ongoing active prescriptions.</AppText>
            ) : (
              activeMeds.map((med, idx) => (
                <View key={med.id || idx} style={styles.recordItem}>
                  <View style={styles.recordHeader}>
                    <AppText variant="bodySmall" weight="700" color="#0E3821">{med.title}</AppText>
                    <View style={styles.activeTag}>
                      <AppText variant="caption" weight="800" color="#1565C0">ACTIVE</AppText>
                    </View>
                  </View>
                  {med.dose && (
                    <AppText variant="caption" color="#475569">Dose: {med.dose}</AppText>
                  )}
                  {med.notes && (
                    <AppText variant="caption" color="#64748B">{med.notes}</AppText>
                  )}
                </View>
              ))
            )}
          </View>

          {/* VACCINATION HISTORY */}
          <View style={styles.sectionBox}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="needle" size={18} color="#673AB7" />
              <AppText variant="bodySmall" weight="800" color="#0E3821" style={styles.sectionTitle}>
                VACCINATION RECORDS ({vaccines.length})
              </AppText>
            </View>

            {vaccines.length === 0 ? (
              <AppText variant="caption" color="#64748B">No vaccination entries logged yet.</AppText>
            ) : (
              vaccines.map((v, idx) => (
                <View key={v.id || idx} style={styles.recordItem}>
                  <View style={styles.recordHeader}>
                    <AppText variant="bodySmall" weight="700" color="#0E3821">{v.title}</AppText>
                    <View style={[styles.statusTag, v.status === 'completed' ? styles.statusCompleted : styles.statusPending]}>
                      <AppText
                        variant="caption"
                        weight="700"
                        color={v.status === 'completed' ? '#2E7D32' : '#F57F17'}
                      >
                        {v.status.toUpperCase()}
                      </AppText>
                    </View>
                  </View>
                  <AppText variant="caption" color="#64748B">
                    Date: {new Date(v.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </AppText>
                  {v.notes && <AppText variant="caption" color="#475569">{v.notes}</AppText>}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
    gap: Spacing.md,
  },
  petIdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Spacing.md,
  },
  petImageFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  petInfo: {
    flex: 1,
  },
  vitalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  alertCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: 6,
  },
  sectionTitle: {
    letterSpacing: 0.5,
  },
  alertContent: {
    gap: 4,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clinicCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  sectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.xs,
  },
  recordItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingTop: Spacing.xs,
    marginTop: 4,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  statusCompleted: {
    backgroundColor: '#E8F5E9',
  },
  statusPending: {
    backgroundColor: '#FFF8E1',
  },
});
