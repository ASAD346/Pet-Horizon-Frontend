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
