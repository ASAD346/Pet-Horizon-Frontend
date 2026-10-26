import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { updatePetHealthVitals } from '@/services/pets/healthCardApi';
import { useToast } from '@/hooks/useToast';
import type { HealthCardPet } from '@/services/pets/healthCardApi';

interface EditVitalsModalProps {
  visible: boolean;
  onClose: () => void;
  pet: HealthCardPet;
  token: string | null;
  onSuccess: () => void;
}

export function EditVitalsModal({
  visible,
  onClose,
  pet,
  token,
  onSuccess,
}: EditVitalsModalProps) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [allergies, setAllergies] = useState(pet.allergies || '');
  const [vetClinic, setVetClinic] = useState(pet.vetClinic || '');
  const [emergencyContact, setEmergencyContact] = useState(pet.emergencyContact || '');
  const [bloodGroup, setBloodGroup] = useState(pet.bloodGroup || '');
  const [medicalNotes, setMedicalNotes] = useState(pet.medicalNotes || '');
  const [saving, setSaving] = useState(false);

  // Sync state if pet changes
  React.useEffect(() => {
    if (visible) {
      setAllergies(pet.allergies || '');
      setVetClinic(pet.vetClinic || '');
      setEmergencyContact(pet.emergencyContact || '');
      setBloodGroup(pet.bloodGroup || '');
      setMedicalNotes(pet.medicalNotes || '');
    }
  }, [visible, pet]);

  const handleSave = async () => {
    if (!token || !pet.id) return;
    setSaving(true);
    try {
      await updatePetHealthVitals(token, pet.id, {
        allergies: allergies.trim(),
        vetClinic: vetClinic.trim(),
        emergencyContact: emergencyContact.trim(),
        bloodGroup: bloodGroup.trim(),
        medicalNotes: medicalNotes.trim(),
      });
      showToast('Medical details saved successfully', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast(error?.message || 'Failed to update details', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop overlay to tap outside and dismiss */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Sliding Bottom Sheet Container */}
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            {/* Drag Handle Bar */}
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            {/* Bottom Sheet Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={12}
                accessibilityLabel="Close sheet"
              >
                <Ionicons name="close" size={18} color="#0E3821" />
              </TouchableOpacity>

              <AppText variant="h3" weight="800" color="#0E3821" style={styles.headerTitle}>
                Edit Medical Details
              </AppText>

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                accessibilityLabel="Save medical details"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <AppText variant="bodySmall" weight="800" color="#FFFFFF">
                    Save
                  </AppText>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Sheet Scrollable Inputs */}
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <AppText variant="caption" color="#64748B" style={styles.subtitle}>
                Update allergies, clinic contact, and notes for {pet.name}. These will update on their health passport and vet records.
              </AppText>

              {/* Allergies Field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#D32F2F" />
                  <AppText variant="caption" weight="800" color="#1E293B" style={styles.fieldLabel}>
                    KNOWN ALLERGIES
                  </AppText>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Chicken, Penicillin, Flea collars (or 'None')"
                  placeholderTextColor="#94A3B8"
                  value={allergies}
                  onChangeText={setAllergies}
                />
              </View>

              {/* Vet Clinic Field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="hospital-building" size={16} color="#1565C0" />
                  <AppText variant="caption" weight="800" color="#1E293B" style={styles.fieldLabel}>
                    PRIMARY VET CLINIC / DOCTOR
                  </AppText>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. City Central Animal Hospital (+1 555-0192)"
                  placeholderTextColor="#94A3B8"
                  value={vetClinic}
                  onChangeText={setVetClinic}
                />
              </View>

              {/* Emergency Contact / Hospital Number Field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="call" size={16} color="#E65100" />
                  <AppText variant="caption" weight="800" color="#1E293B" style={styles.fieldLabel}>
                    EMERGENCY 24/7 HOSPITAL / VET PHONE
                  </AppText>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. +1 (555) 911-PETS (24/7 Emergency Care)"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={emergencyContact}
                  onChangeText={setEmergencyContact}
                />
              </View>

              {/* Blood Group Field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="water" size={16} color="#C2185B" />
                  <AppText variant="caption" weight="800" color="#1E293B" style={styles.fieldLabel}>
                    BLOOD GROUP (OPTIONAL)
                  </AppText>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. DEA 1.1+, Type A, B"
                  placeholderTextColor="#94A3B8"
                  value={bloodGroup}
                  onChangeText={setBloodGroup}
                />
              </View>

              {/* Medical Notes Field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={16} color="#0E3821" />
                  <AppText variant="caption" weight="800" color="#1E293B" style={styles.fieldLabel}>
                    ADDITIONAL MEDICAL / DIETARY NOTES
                  </AppText>
                </View>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter chronic conditions, past surgeries, or special dietary requirements..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  value={medicalNotes}
                  onChangeText={setMedicalNotes}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
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
  keyboardContainer: {
    maxHeight: '100%',
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
  saveBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.full,
    minWidth: 64,
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  subtitle: {
    lineHeight: 18,
    marginBottom: 4,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#D8E2D8',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0E3821',
  },
  textArea: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
});
