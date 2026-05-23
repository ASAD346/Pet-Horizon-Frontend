import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import {
  BirthdayField,
  GenderSelect,
  PetGender,
  PetLabeledInput,
  PetPhotoPicker,
  PetSpecies,
  SpeciesSelector,
  WeightInput,
  WeightUnit,
} from '../../components/pet';
import { LoginTheme, Spacing } from '../../constants/theme';

const DEFAULT_BIRTHDAY = new Date(2021, 4, 15);

export default function RegisterPetScreen() {
  const router = useRouter();
  const [petName, setPetName] = useState('');
  const [gender, setGender] = useState<PetGender>('Male');
  const [species, setSpecies] = useState<PetSpecies>('dog');
  const [breed, setBreed] = useState('');
  const [birthday, setBirthday] = useState(DEFAULT_BIRTHDAY);
  const [weight, setWeight] = useState('25');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [loading, setLoading] = useState(false);

  const handleAddPet = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 800);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <AppText variant="h3" weight="800" align="center" style={styles.title}>
                Tell us about your furry friend!
              </AppText>
              <AppText variant="bodySmall" color={LoginTheme.tagline} align="center" style={styles.subtitle}>
                Let&apos;s create a profile to help you track their healthy lifestyle.
              </AppText>
            </View>

            <PetPhotoPicker />

            <PetLabeledInput
              label="Pet Name"
              placeholder="Pet Name"
              value={petName}
              onChangeText={setPetName}
            />

            <GenderSelect value={gender} onChange={setGender} />
            <SpeciesSelector value={species} onChange={setSpecies} />

            <PetLabeledInput
              label="Breed"
              placeholder="Breed"
              value={breed}
              onChangeText={setBreed}
            />

            <BirthdayField value={birthday} onChange={setBirthday} />
            <WeightInput
              value={weight}
              unit={weightUnit}
              onValueChange={setWeight}
              onUnitChange={setWeightUnit}
            />
          </View>

          <View style={styles.footer}>
            <AppButton
              title="Add Pet"
              onPress={handleAddPet}
              loading={loading}
              variant="success"
              size="sm"
              style={styles.addButton}
              textStyle={styles.addButtonText}
            />
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
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
});
