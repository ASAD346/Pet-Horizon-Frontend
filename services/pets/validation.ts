export interface RegisterPetFieldErrors {
  petName?: string;
  species?: string;
  breed?: string;
  weight?: string;
}

export function validateRegisterPetForm(
  petName: string,
  species: string,
  breed: string,
  weight: string,
): RegisterPetFieldErrors {
  const errors: RegisterPetFieldErrors = {};

  if (!petName.trim()) {
    errors.petName = 'Pet name is required';
  }

  if (!species.trim()) {
    errors.species = 'Select a species';
  }

  if (!breed.trim()) {
    errors.breed = 'Select a breed';
  }

  if (weight.trim()) {
    const n = Number(weight);
    if (Number.isNaN(n) || n <= 0) {
      errors.weight = 'Enter a valid weight';
    }
  }

  return errors;
}

export function hasRegisterPetFieldErrors(errors: RegisterPetFieldErrors): boolean {
  return Boolean(errors.petName || errors.species || errors.breed || errors.weight);
}
