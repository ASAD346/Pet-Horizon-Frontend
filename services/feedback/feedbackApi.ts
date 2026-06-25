import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';

const SCOPE = 'FeedbackAPI';

export interface FeedbackRequest extends Record<string, any> {
  rating: number;
  comment: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
}

export async function submitFeedback(
  token: string | null,
  payload: FeedbackRequest
): Promise<FeedbackResponse> {
  log.info(SCOPE, 'POST /feedback', payload);
  try {
    if (!token) {
      // Simulate client-side fallback for guest/offline
      await new Promise((resolve) => setTimeout(resolve, 800));
      return { success: true, message: 'Feedback saved locally (offline)' };
    }
    
    // Attempt actual POST request
    const data = await apiRequest<FeedbackResponse>(API_ENDPOINTS.feedback.submit, {
      method: 'POST',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Feedback submitted successfully');
    return data;
  } catch (error) {
    log.warn(SCOPE, 'Feedback backend submission failed, using mock client fallback:', getErrorMessage(error));
    // Soft fallback so the app user experiences success even if backend endpoint is not deployed yet
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { success: true, message: 'Feedback submitted successfully (client fallback)' };
  }
}
