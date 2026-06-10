import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { PetLabeledInput, SpeciesSelector } from '@/components/pet';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/api/errors';
import { createPetsBulk, fetchSpecies, setActivePet } from '@/services/pets/petApi';
import type { CreatePetRequest } from '@/types/pet';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';

interface BulkPetDraft {
  id: string;
  name: string;
  species: string;
}

let draftCounter = 0;
function newDraft(species: string): BulkPetDraft {
  draftCounter += 1;
  return { id: `bulk-${draftCounter}`, name: '', species };
}

export default function BulkRegisterPetsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ familyId?: string }>();
  const familyId = Array.isArray(params.familyId) ? params.familyId[0] : params.familyId;
  const { token } = useAuth();

  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<BulkPetDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchSpecies(token)
      .then((data) => {
        const list = data.species ?? [];
        setSpeciesList(list);
        const defaultSpecies = list[0] ?? 'dog';
        setDrafts([newDraft(defaultSpecies), newDraft(defaultSpecies)]);
      })
      .catch(() => setFormError('Could not load species list.'));
  }, [token]);

  const updateDraft = useCallback((id: string, patch: Partial<BulkPetDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }, []);

  const addDraft = () => {
    setDrafts((prev) => [...prev, newDraft(speciesList[0] ?? 'dog')]);
  };

  const removeDraft = (id: string) => {
    setDrafts((prev) => (prev.length <= 1 ? prev : prev.filter((d) => d.id !== id)));
  };

  const handleSubmit = async () => {
    if (!token) return;

    const pets: CreatePetRequest[] = [];
    for (let i = 0; i < drafts.length; i += 1) {
      const draft = drafts[i];
      if (!draft.name.trim()) {
        setFormError(`Pet ${i + 1}: name is required.`);
        return;
      }
      if (!draft.species) {
        setFormError(`Pet ${i + 1}: species is required.`);
        return;
      }
      pets.push({
        name: draft.name.trim(),
        species: draft.species,
        ...(familyId ? { familyId } : {}),
      });
    }

    setLoading(true);
    setFormError(null);
    try {
      const result = await createPetsBulk(token, {
        pets,
        ...(familyId ? { familyId } : {}),
      });
      if (result.pets[0]?._id) {
        await setActivePet(token, result.pets[0]._id);
      }
      Alert.alert('Pets added', `${result.created} pet(s) registered successfully.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ProfileScreenHeader title="Add multiple pets" onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AppText variant="bodySmall" color={HomeTheme.textMuted} style={styles.intro}>
            Register several pets in one step. You can add names and species for each pet below.
          </AppText>

          {formError ? <AuthErrorBanner message={formError} /> : null}

          {drafts.map((draft, index) => (
            <View key={draft.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
                  Pet {index + 1}
                </AppText>
                {drafts.length > 1 ? (
                  <TouchableOpacity onPress={() => removeDraft(draft.id)} hitSlop={8}>
                    <Ionicons name="close-circle" size={22} color={HomeTheme.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <PetLabeledInput
                label="Name"
                value={draft.name}
                onChangeText={(name) => updateDraft(draft.id, { name })}
                placeholder="Pet name"
              />

              <SpeciesSelector
                speciesList={speciesList}
                value={draft.species}
                onChange={(species) => updateDraft(draft.id, { species })}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addRow} onPress={addDraft} activeOpacity={0.85}>
            <Ionicons name="add-circle-outline" size={20} color={HomeTheme.cardGreen} />
            <AppText variant="bodySmall" weight="700" color={HomeTheme.cardGreen}>
              Add another pet
            </AppText>
          </TouchableOpacity>

          <AppButton
            title={`Save ${drafts.length} pet${drafts.length === 1 ? '' : 's'}`}
            onPress={handleSubmit}
            loading={loading}
            variant="success"
            size="md"
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: HomeTheme.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  intro: {
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  card: {
    backgroundColor: HomeTheme.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  submitBtn: {
    marginTop: Spacing.sm,
  },
});
