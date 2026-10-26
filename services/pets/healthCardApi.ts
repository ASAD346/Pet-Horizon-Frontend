import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';

const SCOPE = 'HealthCardAPI';

export interface HealthCardPet {
  id: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  age: number | null;
  birthday: string | null;
  weight: number | null;
  weightUnit: string;
  color: string;
  medicalNotes: string;
  allergies: string;
  vetClinic: string;
  bloodGroup: string;
  image: string | null;
}

export interface VaccineStatusSummary {
  status: 'up_to_date' | 'due_soon' | 'overdue' | 'not_recorded';
  label: string;
}

export interface HealthCardSummaryStats {
  vaccineStatus: VaccineStatusSummary;
  activeMedsCount: number;
  lastGroomedDate: string | null;
}

export interface HealthTimelineEvent {
  id: string;
  source: 'activity' | 'schedule' | 'grooming_record';
  category: 'vaccination' | 'medicine' | 'grooming' | 'vet_visit' | 'custom' | string;
  title: string;
  description?: string;
  dose?: string | null;
  date: string;
  status: 'completed' | 'scheduled' | 'overdue' | 'active';
  notes?: string;
  administeredBy?: string | null;
  images?: string[];
}

export interface PetHealthCardResponse {
  pet: HealthCardPet;
  summaryStats: HealthCardSummaryStats;
  categoryCounts: {
    all: number;
    vaccination: number;
    medicine: number;
    grooming: number;
    vet_visit: number;
  };
  timeline: HealthTimelineEvent[];
}

export interface UpdateVitalsPayload {
  allergies?: string;
  vetClinic?: string;
  bloodGroup?: string;
  medicalNotes?: string;
}

export async function fetchPetHealthCard(
  token: string,
  petId: string,
  category = 'all'
): Promise<PetHealthCardResponse> {
  const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
  const url = `${API_ENDPOINTS.pets.healthCard(petId)}${query}`;
  log.info(SCOPE, 'GET /pets/:petId/health-card', { petId, category });
  try {
    const data = await apiRequest<PetHealthCardResponse>(url, { token });
    log.ok(SCOPE, 'Health card loaded', {
      petName: data.pet?.name,
      timelineEventsCount: data.timeline?.length ?? 0,
    });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Health card fetch failed', getErrorMessage(error));
    throw error;
  }
}

export async function updatePetHealthVitals(
  token: string,
  petId: string,
  payload: UpdateVitalsPayload
): Promise<Partial<HealthCardPet>> {
  const url = API_ENDPOINTS.pets.healthVitals(petId);
  log.info(SCOPE, 'PATCH /pets/:petId/health-card/vitals', { petId });
  try {
    const data = await apiRequest<Partial<HealthCardPet>>(url, {
      method: 'PATCH',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Health vitals updated', { petId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Health vitals update failed', getErrorMessage(error));
    throw error;
  }
}
