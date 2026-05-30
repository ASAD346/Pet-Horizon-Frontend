export interface SpeciesListResponse {
  species: string[];
}

export interface BreedsListResponse {
  species: string;
  breeds: string[];
}

export interface ApiPet {
  _id: string;
  name: string;
  species?: string;
  breed?: string;
  gender?: string;
  birthday?: string;
  weight?: number;
  weightUnit?: string;
  image?: string | null;
  ownerUserId?: string | null;
  familyId?: string | null;
}

export interface CreatePetRequest {
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  birthday?: string;
  weight?: number;
  weightUnit?: string;
  image?: string | null;
}

export interface SetActivePetResponse {
  activePetId: string;
}

export interface ActivePetIdResponse {
  activePetId: string | null;
}

export interface SpeciesFeatures {
  species: string;
  hiddenModules: string[];
  mealTypes: string[];
  inventoryUnits: string[];
  groomingTypes: string[];
  groomingVisible: boolean;
  walkingVisible: boolean;
}

export interface PetPermissionsResponse {
  accessLevel: string;
  allowedModules: string[];
  lockedModules: string[];
  speciesFeatures: SpeciesFeatures;
}
