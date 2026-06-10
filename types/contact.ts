export interface SendContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  petId?: string;
  appVersion?: string;
}

export interface SendContactResponse {
  success: boolean;
  message: string;
  id: string;
}

export interface ContactHistoryItem {
  id: string;
  subject: string;
  message: string;
  createdAt: string;
  repliedAt?: string | null;
  reply?: string | null;
  status?: string;
}
