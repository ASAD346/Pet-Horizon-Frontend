import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AppConfirmModal } from '@/components/ui/AppConfirmModal';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import {
  BirthdayField,
  BreedSelector,
  GenderSelect,
  PetGender,
  PetLabeledInput,
  PetPhotoPicker,
  SpeciesSelector,
  WeightInput,
  WeightUnit,
} from '@/components/pet';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/api/errors';
import { LoginTheme, Palette, Spacing } from '@/constants/theme';
import { log } from '@/lib/log';
import { dateToApiDateString } from '@/lib/grooming/groomingForm';
import { createAndActivatePet, deletePet, fetchBreeds, fetchPetById, fetchPets, fetchSpecies, updatePet } from '@/services/pets/petApi';
import { canAddAnotherPet } from '@/lib/premium/canAddPet';
import { isPetOwner } from '@/lib/family/formatters';
import { uploadPetImage } from '@/services/pets/uploadPetImage';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import {
  hasRegisterPetFieldErrors,
  validateRegisterPetForm,
  type RegisterPetFieldErrors,
} from '@/services/pets/validation';

import { LoginHeaderDecor } from '@/components/auth/login';

const DEFAULT_BIRTHDAY = new Date(2021, 4, 15);

export default function RegisterPetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; petId?: string }>();
  const isAddMode = params.mode === 'add';
  const isEditMode = params.mode === 'edit' && Boolean(params.petId);
  const editPetId = Array.isArray(params.petId) ? params.petId[0] : params.petId;
  const { token, user, setSession } = useAuth();

  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [breeds, setBreeds] = useState<string[]>([]);
  const [speciesLoading, setSpeciesLoading] = useState(true);
  const [breedsLoading, setBreedsLoading] = useState(false);

  const [petName, setPetName] = useState('');
  const [gender, setGender] = useState<PetGender>('Male');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [weight, setWeight] = useState('25');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RegisterPetFieldErrors>({});
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [hasEditPermission, setHasEditPermission] = useState(true);
  const isSubmitting = useRef(false);

  const clearErrors = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
  }, []);

  useEffect(() => {
    if (!token) {
      setSpeciesLoading(false);
      log.fail('AddPet', 'Not authenticated');
      setFormError('Please log in to register a pet.');
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const data = await fetchSpecies(token);
        if (!mounted) return;

        const list = data.species ?? [];
        setSpeciesList(list);
        if (list.length > 0) {
          setSpecies((current) => current || list[0]);
        }
      } catch (error) {
        if (mounted) {
          setFormError(getErrorMessage(error, 'Unable to load species.'));
        }
      } finally {
        if (mounted) {
          setSpeciesLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token || !species) {
      setBreeds([]);
      return;
    }

    let mounted = true;
    setBreedsLoading(true);

    (async () => {
      try {
        const data = await fetchBreeds(token, species);
        if (!mounted) return;

        const list = data.breeds ?? [];
        setBreeds(list);
        setBreed((current) => (current && list.includes(current) ? current : list[0] ?? ''));
      } catch (error) {
        if (mounted) {
          setBreeds([]);
          setBreed('');
          setFormError(getErrorMessage(error, 'Unable to load breeds.'));
        }
      } finally {
        if (mounted) {
          setBreedsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, species]);

  useEffect(() => {
    if (!token || !isEditMode || !editPetId) return;

    let mounted = true;
    (async () => {
      try {
        const existing = await fetchPetById(token, editPetId);
        if (!mounted) return;
        
        setPetName(existing.name ?? '');
        setSpecies(existing.species ?? '');
        setBreed(existing.breed ?? '');
        setGender((existing.gender as PetGender) || 'Male');
        if (existing.birthday) setBirthday(new Date(existing.birthday));
        if (existing.weight != null) setWeight(String(existing.weight));
        if (existing.weightUnit === 'lbs' || existing.weightUnit === 'kg') {
          setWeightUnit(existing.weightUnit);
        }
        if (existing.image) {
          setPhotoUri(resolveMediaUrl(existing.image) ?? null);
        }

        if (!isPetOwner(existing.ownerUserId, user?._id)) {
          setHasEditPermission(false);
        }
      } catch (error) {
        if (mounted) setFormError(getErrorMessage(error));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, isEditMode, editPetId, user?._id]);

  const handleSpeciesChange = useCallback(
    (next: string) => {
      setSpecies(next);
      setBreed('');
      if (fieldErrors.species || fieldErrors.breed) {
        setFieldErrors((prev) => ({ ...prev, species: undefined, breed: undefined }));
      }
    },
    [fieldErrors.breed, fieldErrors.species],
  );

  const handleAddPet = useCallback(async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    Keyboard.dismiss();
    clearErrors();

    if (!token) {
      log.fail('AddPet', 'Submit blocked — no token');
      setFormError('Please log in to register a pet.');
      isSubmitting.current = false;
      return;
    }

    if (isAddMode) {
      const existingPets = await fetchPets(token);
      const isPremium = user?.premiumStatus === 'premium';
      if (!canAddAnotherPet(existingPets.length, isPremium)) {
        Alert.alert(
          'Premium required',
          'Free accounts include one pet. Upgrade to Premium to add more pets.',
          [
            { text: 'Not now', style: 'cancel', onPress: () => router.back() },
            { text: 'View Premium', onPress: () => router.push('/profile/premium') },
          ],
        );
        isSubmitting.current = false;
        return;
      }
    }

    const validation = validateRegisterPetForm(petName, species, breed, weight, birthday);
    if (hasRegisterPetFieldErrors(validation)) {
      log.fail('AddPet', 'Validation failed', { ...validation });
      setFieldErrors(validation);
      isSubmitting.current = false;
      return;
    }

    setLoading(true);
    log.info('AddPet', 'Submitting', { name: petName.trim(), species, breed, mode: isEditMode ? 'edit' : isAddMode ? 'add' : 'onboarding' });

    try {
      const weightNum = weight.trim() ? Number(weight) : undefined;
      const apiWeightUnit = weightUnit === 'lbs' ? 'lbs' : 'kg';
      const payload = {
        name: petName.trim(),
        species,
        breed: breed.trim(),
        gender,
        birthday: birthday ? dateToApiDateString(birthday) : undefined,
        weight: weightNum,
        weightUnit: apiWeightUnit,
      };

      let pet = isEditMode && editPetId
        ? await updatePet(token, editPetId, payload)
        : await createAndActivatePet(token, payload);

      if (photoUri) {
        try {
          pet = await uploadPetImage(token, pet._id, photoUri);
        } catch (uploadError) {
          log.fail('AddPet', 'Photo upload failed', getErrorMessage(uploadError));
        }
      }

      if (user && !isEditMode) {
        await setSession({
          token,
          user: { ...user, activePetId: pet._id },
        });
      }

      log.ok('AddPet', 'Done — navigating', { petId: pet._id, isAddMode, isEditMode });

      if (isEditMode || isAddMode) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (error) {
      log.fail('AddPet', 'Submit failed', getErrorMessage(error));
      setFormError(getErrorMessage(error, 'Unable to add your pet. Please try again.'));
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  }, [
    birthday,
    breed,
    clearErrors,
    gender,
    isAddMode,
    isEditMode,
    editPetId,
    petName,
    router,
    setSession,
    species,
    token,
    user,
    photoUri,
    weight,
    weightUnit,
  ]);

  const handleDeletePet = useCallback(() => {
    if (!token || !editPetId) return;
    setDeleteConfirmVisible(true);
  }, [token, editPetId]);

  const confirmDeletePet = useCallback(async () => {
    if (!token || !editPetId) return;
    
    setDeleteConfirmVisible(false);
    setLoading(true);
    try {
      await deletePet(token, editPetId);
      if (user && user.activePetId === editPetId) {
        await setSession({ token, user: { ...user, activePetId: null } });
      }
      router.replace('/(tabs)');
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [token, editPetId, user, setSession, router]);

  return (
    <View style={styles.root}>
      <LoginHeaderDecor />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <View style={styles.header}>
                <AppText variant="h3" weight="800" align="center" style={styles.title}>
                  {isEditMode ? 'Edit Pet Profile' : isAddMode ? 'Add Another Pet' : 'Tell us about your furry friend!'}
                </AppText>
                <View style={styles.accentLine} />
                <AppText variant="bodySmall" color={Palette.gray[500]} align="center" style={styles.subtitle}>
                  Let&apos;s create a profile to help you track their healthy lifestyle.
                </AppText>
              </View>

              {!hasEditPermission && (
                <View style={styles.viewOnlyBanner}>
                  <Ionicons name="information-circle" size={20} color="#4A5568" />
                  <AppText variant="bodySmall" color="#4A5568" style={styles.viewOnlyText}>
                    This profile is view-only. Only the pet owner can make changes.
                  </AppText>
                </View>
              )}
              {formError ? <AuthErrorBanner message={formError} /> : null}

              <View pointerEvents={hasEditPermission ? 'auto' : 'none'} style={!hasEditPermission && { opacity: 0.6 }}>
                <PetPhotoPicker imageUri={photoUri} onImageChange={setPhotoUri} />

              <PetLabeledInput
                label="Pet Name"
                placeholder="Pet Name"
                value={petName}
                onChangeText={(text) => {
                  setPetName(text);
                  if (fieldErrors.petName) {
                    setFieldErrors((prev) => ({ ...prev, petName: undefined }));
                  }
                }}
              />
              {fieldErrors.petName ? (
                <AppText variant="caption" color="#C62828" style={styles.inlineError}>
                  {fieldErrors.petName}
                </AppText>
              ) : null}

              <GenderSelect value={gender} onChange={setGender} />

              <SpeciesSelector
                speciesList={speciesList}
                value={species}
                onChange={handleSpeciesChange}
                loading={speciesLoading}
                error={fieldErrors.species}
              />

              <BreedSelector
                value={breed}
                breeds={breeds}
                loading={breedsLoading}
                disabled={!species}
                error={fieldErrors.breed}
                onChange={(next) => {
                  setBreed(next);
                  if (fieldErrors.breed) {
                    setFieldErrors((prev) => ({ ...prev, breed: undefined }));
                  }
                }}
              />

              <BirthdayField
                value={birthday}
                onChange={(date) => {
                  setBirthday(date);
                  if (fieldErrors.birthday) {
                    setFieldErrors((prev) => ({ ...prev, birthday: undefined }));
                  }
                }}
                error={fieldErrors.birthday}
              />

              <WeightInput
                value={weight}
                unit={weightUnit}
                onValueChange={setWeight}
                onUnitChange={setWeightUnit}
              />
              {fieldErrors.weight ? (
                <AppText variant="caption" color="#C62828" style={styles.inlineError}>
                  {fieldErrors.weight}
                </AppText>
              ) : null}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.formContainer}>
              <AppButton
                title={isEditMode ? 'Save Changes' : 'Add Pet'}
                onPress={handleAddPet}
                loading={loading}
                disabled={speciesLoading || loading || !hasEditPermission}
                variant="success"
                size="sm"
                style={styles.addButton}
                textStyle={styles.addButtonText}
              />
              {isEditMode ? (
                <AppButton
                  title="Delete Pet"
                  onPress={handleDeletePet}
                  disabled={loading || !hasEditPermission}
                  variant="outline"
                  size="sm"
                  style={styles.deleteButton}
                  textStyle={styles.deleteButtonText}
                />
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <AppConfirmModal
        visible={deleteConfirmVisible}
        title="Delete Pet"
        message="Are you sure you want to permanently delete this pet profile? All related schedules and data will be lost forever."
        confirmLabel="Delete"
        cancelLabel="Keep pet"
        variant="danger"
        onConfirm={confirmDeletePet}
        onCancel={() => setDeleteConfirmVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F1F7F1',
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  formContainer: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
  },
  header: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    color: '#1A2B4E',
    marginBottom: Spacing.xs,
  },
  accentLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#5CB35D',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    lineHeight: 16,
    color: Palette.gray[500],
    fontSize: 12,
  },
  inlineError: {
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
    marginLeft: 4,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.xs,
    backgroundColor: 'transparent',
  },
  addButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#5CB35D',
    shadowColor: '#5CB35D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 0,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: 0.5,
  },
  deleteButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    marginTop: Spacing.sm,
    borderColor: '#C62828',
    borderWidth: 1.5,
  },
  deleteButtonText: {
    color: '#C62828',
    fontWeight: '700',
  },
  viewOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDFDF2',
    padding: 12,
    borderRadius: 8,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  viewOnlyText: {
    marginLeft: 8,
    flex: 1,
  },
});
