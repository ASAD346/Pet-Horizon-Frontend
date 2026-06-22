import React, { useCallback, useEffect, useState } from 'react';
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
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
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
import { LoginTheme, Spacing } from '@/constants/theme';
import { log } from '@/lib/log';
import { dateToApiDateString } from '@/lib/grooming/groomingForm';
import { createAndActivatePet, deletePet, fetchBreeds, fetchPetById, fetchPets, fetchSpecies, updatePet } from '@/services/pets/petApi';
import { canAddAnotherPet } from '@/lib/premium/canAddPet';
import { isPetOwner } from '@/lib/family/formatters';
import { uploadPetImage } from '@/services/pets/uploadPetImage';
import {
  hasRegisterPetFieldErrors,
  validateRegisterPetForm,
  type RegisterPetFieldErrors,
} from '@/services/pets/validation';

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
  const [birthday, setBirthday] = useState(DEFAULT_BIRTHDAY);
  const [weight, setWeight] = useState('25');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RegisterPetFieldErrors>({});

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
        if (!isPetOwner(existing.ownerUserId, user?._id)) {
          setFormError('Only the pet owner can edit this profile.');
          return;
        }
        setPetName(existing.name ?? '');
        setSpecies(existing.species ?? '');
        setBreed(existing.breed ?? '');
        setGender((existing.gender as PetGender) || 'Male');
        if (existing.birthday) setBirthday(new Date(existing.birthday));
        if (existing.weight != null) setWeight(String(existing.weight));
        if (existing.weightUnit === 'lbs' || existing.weightUnit === 'kg') {
          setWeightUnit(existing.weightUnit);
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
    Keyboard.dismiss();
    clearErrors();

    if (!token) {
      log.fail('AddPet', 'Submit blocked — no token');
      setFormError('Please log in to register a pet.');
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
        return;
      }
    }

    const validation = validateRegisterPetForm(petName, species, breed, weight);
    if (hasRegisterPetFieldErrors(validation)) {
      log.fail('AddPet', 'Validation failed', { ...validation });
      setFieldErrors(validation);
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
        birthday: dateToApiDateString(birthday),
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
    Alert.alert('Delete pet', 'This permanently removes the pet and related data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
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
        },
      },
    ]);
  }, [token, editPetId, user, setSession, router]);

  return (
    <View style={styles.root}>
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
            <View style={styles.header}>
              <AppText variant="h3" weight="800" align="center" style={styles.title}>
                {isEditMode ? 'Edit pet profile' : isAddMode ? 'Add another pet' : 'Tell us about your furry friend!'}
              </AppText>
              <AppText variant="bodySmall" color={LoginTheme.tagline} align="center" style={styles.subtitle}>
                Let&apos;s create a profile to help you track their healthy lifestyle.
              </AppText>
            </View>

            {formError ? <AuthErrorBanner message={formError} /> : null}

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

            <BirthdayField value={birthday} onChange={setBirthday} />

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
          </ScrollView>

          <View style={styles.footer}>
            <AppButton
              title={isEditMode ? 'Save Changes' : 'Add Pet'}
              onPress={handleAddPet}
              loading={loading}
              disabled={speciesLoading || loading}
              variant="success"
              size="sm"
              style={styles.addButton}
              textStyle={styles.addButtonText}
            />
            {isEditMode ? (
              <AppButton
                title="Delete Pet"
                onPress={handleDeletePet}
                disabled={loading}
                variant="outline"
                size="sm"
                style={styles.deleteButton}
                textStyle={styles.deleteButtonText}
              />
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const buttonShadow = Platform.select({
  ios: {
    shadowColor: LoginTheme.buttonShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  android: { elevation: 6 },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LoginTheme.screenBg,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  header: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    color: LoginTheme.charcoal,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    lineHeight: 18,
    paddingHorizontal: Spacing.sm,
  },
  inlineError: {
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  addButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: LoginTheme.green,
    paddingVertical: 12,
    ...buttonShadow,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 24,
    marginTop: Spacing.sm,
    borderColor: '#C62828',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C62828',
  },
});
