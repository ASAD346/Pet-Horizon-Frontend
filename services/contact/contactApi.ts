import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type { ContactHistoryItem, SendContactRequest, SendContactResponse } from '@/types/contact';

const SCOPE = 'ContactAPI';

export async function sendContactMessage(
  token: string,
  payload: SendContactRequest,
): Promise<SendContactResponse> {
  log.info(SCOPE, 'POST /contact/send', { subject: payload.subject });
  try {
    const data = await apiRequest<SendContactResponse>(API_ENDPOINTS.contact.send, {
      method: 'POST',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Contact message sent', { id: data.id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Send contact failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchContactHistory(token: string): Promise<ContactHistoryItem[]> {
  log.info(SCOPE, 'GET /contact/history');
  try {
    const data = await apiRequest<ContactHistoryItem[]>(API_ENDPOINTS.contact.history, { token });
    log.ok(SCOPE, 'Contact history loaded', { count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Contact history failed', getErrorMessage(error));
    throw error;
  }
}
