import React, { useMemo } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Pressable,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { formatPetAge, formatPetWeight } from '@/services/pets/petDisplay';
import type { HealthCardPet, HealthTimelineEvent } from '@/services/pets/healthCardApi';

interface ShowVetModalProps {
  visible: boolean;
  onClose: () => void;
  pet: HealthCardPet;
  timeline: HealthTimelineEvent[];
}

export function ShowVetModal({ visible, onClose, pet, timeline }: ShowVetModalProps) {
  const insets = useSafeAreaInsets();
  const imageUrl = pet.image ? resolveMediaUrl(pet.image) : null;

  // Accurately compute age
  const displayAge = useMemo(() => {
    if (pet.birthday) {
      const formatted = formatPetAge(pet.birthday);
      if (formatted && formatted !== '—' && formatted !== 'Not set') {
        return formatted;
      }
    }
    if (pet.age !== null && pet.age !== undefined && !Number.isNaN(Number(pet.age))) {
      const num = Number(pet.age);
      return `${num} ${num === 1 ? 'yr' : 'yrs'}`;
    }
    return 'Not set';
  }, [pet.birthday, pet.age]);

  const displayWeight = formatPetWeight(pet.weight, pet.weightUnit);

  // Filter vaccines and active medicines
  const vaccines = timeline.filter((e) => e.category === 'vaccination');
  const activeMeds = timeline.filter(
    (e) => e.category === 'medicine' && (e.status === 'active' || e.status === 'scheduled')
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop to tap outside and dismiss */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Sliding Bottom Sheet */}
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Drag Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Sheet Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.medicalSymbolCircle}>
                <MaterialCommunityIcons name="stethoscope" size={20} color="#0E3821" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <AppText variant="h3" weight="800" color="#0E3821" style={styles.headerTitle}>
                  Veterinary Summary
                </AppText>
                <AppText variant="caption" color="#64748B">
                  Clinical reference record for {pet.name}
                </AppText>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel="Close summary"
            >
              <Ionicons name="close" size={18} color="#0E3821" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Patient Overview Card */}
            <View style={styles.patientCard}>
              <View style={styles.patientAvatarWrapper}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.patientAvatar} contentFit="cover" />
                ) : (
                  <View style={styles.patientAvatarFallback}>
                    <MaterialCommunityIcons name="paw" size={28} color="#2E7D32" />
                  </View>
                )}
              </View>

              <View style={styles.patientDetails}>
                <View style={styles.patientNameRow}>
                  <AppText variant="h3" weight="800" color="#0E3821">
                    {pet.name}
                  </AppText>
                  <View style={styles.canineTag}>
                    <AppText variant="caption" weight="800" color="#1B5E20">
                      {pet.species ? pet.species.toUpperCase() : 'PATIENT'}
                    </AppText>
                  </View>
                </View>

                <AppText variant="caption" weight="600" color="#64748B">
                  Breed: <AppText variant="caption" weight="700" color="#1E293B">{pet.breed || 'Unspecified'}</AppText>
                </AppText>

                {/* Patient Vitals Capsule Bar */}
                <View style={styles.patientVitalsBar}>
                  <View style={styles.patientVitalItem}>
                    <AppText variant="caption" color="#64748B">Age:</AppText>
                    <AppText variant="caption" weight="800" color="#0E3821" style={{ marginLeft: 3 }}>
                      {displayAge}
                    </AppText>
                  </View>

                  <View style={styles.vitalsDot} />

                  <View style={styles.patientVitalItem}>
                    <AppText variant="caption" color="#64748B">Weight:</AppText>
                    <AppText variant="caption" weight="800" color="#0E3821" style={{ marginLeft: 3 }}>
                      {displayWeight}
                    </AppText>
                  </View>

                  <View style={styles.vitalsDot} />

                  <View style={styles.patientVitalItem}>
                    <AppText variant="caption" color="#64748B">Sex:</AppText>
                    <AppText variant="caption" weight="800" color="#0E3821" style={{ marginLeft: 3 }}>
                      {pet.gender ? pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1) : '—'}
                    </AppText>
                  </View>
                </View>
              </View>
            </View>

            {/* CRITICAL MEDICAL ADVISORY (Allergies & Blood Group) */}
            <View style={styles.advisoryCard}>
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons name="shield-alert-outline" size={18} color="#D32F2F" />
                <AppText variant="caption" weight="800" color="#D32F2F" style={styles.sectionTitle}>
                  CRITICAL MEDICAL ADVISORY & ALLERGIES
                </AppText>
              </View>

              <View style={styles.advisoryBody}>
                <View style={styles.advisoryRow}>
                  <AppText variant="caption" weight="700" color="#475569" style={{ width: 110 }}>
                    Known Allergies:
                  </AppText>
                  <AppText
                    variant="bodySmall"
                    weight="800"
                    color={pet.allergies ? '#D32F2F' : '#2E7D32'}
                    style={{ flex: 1 }}
                  >
                    {pet.allergies || 'No known allergies reported'}
                  </AppText>
                </View>

                {pet.bloodGroup ? (
                  <View style={styles.advisoryRow}>
                    <AppText variant="caption" weight="700" color="#475569" style={{ width: 110 }}>
                      Blood Group:
                    </AppText>
                    <AppText variant="bodySmall" weight="800" color="#0E3821" style={{ flex: 1 }}>
                      {pet.bloodGroup}
                    </AppText>
                  </View>
                ) : null}

                {pet.medicalNotes ? (
                  <View style={[styles.advisoryRow, { alignItems: 'flex-start' }]}>
                    <AppText variant="caption" weight="700" color="#475569" style={{ width: 110, marginTop: 2 }}>
                      Clinical Notes:
                    </AppText>
                    <AppText variant="caption" color="#334155" style={{ flex: 1, lineHeight: 18 }}>
                      {pet.medicalNotes}
                    </AppText>
                  </View>
                ) : null}
              </View>
            </View>

            {/* PRIMARY CARE PROVIDER */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons name="hospital-building" size={18} color="#1565C0" />
                <AppText variant="caption" weight="800" color="#1565C0" style={styles.sectionTitle}>
                  PRIMARY CARE PROVIDER
                </AppText>
              </View>
              <AppText variant="bodySmall" weight="700" color="#0E3821">
                {pet.vetClinic || 'No specific veterinary clinic registered on record'}
              </AppText>
            </View>

            {/* EMERGENCY 24/7 HOSPITAL & VET CONTACT */}
            <View style={styles.emergencyCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="call" size={18} color="#D32F2F" />
                <AppText variant="caption" weight="800" color="#D32F2F" style={styles.sectionTitle}>
                  EMERGENCY 24/7 HOSPITAL CONTACT
                </AppText>
              </View>

              <View style={styles.emergencyRow}>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySmall" weight="800" color="#0E3821">
                    {pet.emergencyContact || 'No emergency contact saved'}
                  </AppText>
                  <AppText variant="caption" color="#64748B">
                    Available for urgent medical triage & clinic admission
                  </AppText>
                </View>

                {pet.emergencyContact ? (
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => Linking.openURL(`tel:${pet.emergencyContact.replace(/[^0-9+]/g, '')}`)}
                    activeOpacity={0.8}
                    accessibilityLabel="Call emergency contact"
                  >
                    <Ionicons name="call" size={14} color="#FFFFFF" />
                    <AppText variant="caption" weight="800" color="#FFFFFF">
                      Call Now
                    </AppText>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* ONGOING MEDICATIONS & PRESCRIPTIONS */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons name="pill" size={18} color="#0D47A1" />
                <AppText variant="caption" weight="800" color="#0D47A1" style={styles.sectionTitle}>
                  ACTIVE MEDICATIONS ({activeMeds.length})
                </AppText>
              </View>

              {activeMeds.length === 0 ? (
                <AppText variant="caption" color="#64748B">
                  No active medication regimens currently recorded.
                </AppText>
              ) : (
                activeMeds.map((med, idx) => (
                  <View key={med.id || idx} style={styles.recordRow}>
                    <View style={styles.recordHeader}>
                      <AppText variant="bodySmall" weight="800" color="#0E3821">
                        {med.title}
                      </AppText>
                      <View style={styles.activePill}>
                        <AppText variant="caption" weight="800" color="#1565C0">
                          ACTIVE
                        </AppText>
                      </View>
                    </View>
                    {med.dose && (
                      <AppText variant="caption" weight="700" color="#475569">
                        Dose: {med.dose}
                      </AppText>
                    )}
                    {med.notes && (
                      <AppText variant="caption" color="#64748B" style={{ marginTop: 2 }}>
                        {med.notes}
                      </AppText>
                    )}
                  </View>
                ))
              )}
            </View>

            {/* VACCINATION RECORDS */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons name="needle" size={18} color="#6A1B9A" />
                <AppText variant="caption" weight="800" color="#6A1B9A" style={styles.sectionTitle}>
                  VACCINATION RECORDS ({vaccines.length})
                </AppText>
              </View>

              {vaccines.length === 0 ? (
                <AppText variant="caption" color="#64748B">
                  No vaccination entries logged yet.
                </AppText>
              ) : (
                vaccines.map((v, idx) => {
                  const isDone = v.status === 'completed';
                  return (
                    <View key={v.id || idx} style={styles.recordRow}>
                      <View style={styles.recordHeader}>
                        <AppText variant="bodySmall" weight="800" color="#0E3821">
                          {v.title}
                        </AppText>
                        <View style={[styles.statusTag, isDone ? styles.statusDone : styles.statusDue]}>
                          <AppText
                            variant="caption"
                            weight="800"
                            color={isDone ? '#1B5E20' : '#B78103'}
                          >
                            {v.status.toUpperCase()}
                          </AppText>
                        </View>
                      </View>
                      <AppText variant="caption" color="#64748B">
                        Date: {new Date(v.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </AppText>
                      {v.notes && (
                        <AppText variant="caption" color="#475569" style={{ marginTop: 2 }}>
                          {v.notes}
                        </AppText>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
  },
  sheet: {
    backgroundColor: '#F8FAF9',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 12 },
    }),
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicalSymbolCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
    gap: Spacing.md,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  patientAvatarWrapper: {
    marginRight: Spacing.md,
  },
  patientAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  patientAvatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
  },
  patientDetails: {
    flex: 1,
  },
  patientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  canineTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  patientVitalsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  patientVitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vitalsDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  advisoryCard: {
    backgroundColor: '#FFF8F8',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    letterSpacing: 0.6,
  },
  advisoryBody: {
    gap: 6,
    marginTop: 4,
  },
  advisoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emergencyCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: 4,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D32F2F',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  recordRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  activePill: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  statusDone: {
    backgroundColor: '#E8F5E9',
  },
  statusDue: {
    backgroundColor: '#FFF8E1',
  },
});
