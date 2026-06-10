export interface MedicalRecord {
  _id: string;
  petId: string;
  recordType?: string;
  title?: string;
  description?: string;
  veterinarianName?: string;
  hospitalName?: string;
  date: string;
  nextDueDate?: string | null;
  attachmentPath?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMedicalRequest {
  petId: string;
  date: string;
  recordType?: string;
  title?: string;
  description?: string;
  veterinarianName?: string;
  hospitalName?: string;
  nextDueDate?: string;
}

export interface UpdateMedicalRequest {
  recordType?: string;
  title?: string;
  description?: string;
  veterinarianName?: string;
  hospitalName?: string;
  date?: string;
  nextDueDate?: string | null;
}
