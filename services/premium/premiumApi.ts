import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type {
  PaymentIntentResponse,
  PaymentInvoice,
  PremiumPlan,
  PremiumStatusResponse,
  SubscribeRequest,
  SubscribeResponse,
} from '@/types/premium';

const SCOPE = 'PremiumAPI';

export async function fetchPremiumPlans(token: string): Promise<PremiumPlan[]> {
  log.info(SCOPE, 'GET /premium/plans');
  try {
    const data = await apiRequest<PremiumPlan[]>(API_ENDPOINTS.premium.plans, { token });
    log.ok(SCOPE, 'Plans loaded', { count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Plans failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchPremiumStatus(token: string): Promise<PremiumStatusResponse> {
  log.info(SCOPE, 'GET /premium/status');
  try {
    const data = await apiRequest<PremiumStatusResponse>(API_ENDPOINTS.premium.status, { token });
    log.ok(SCOPE, 'Premium status', { isPremium: data.isPremium, plan: data.plan });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Premium status failed', getErrorMessage(error));
    throw error;
  }
}

export async function subscribePremium(
  token: string,
  payload: SubscribeRequest,
): Promise<SubscribeResponse> {
  log.info(SCOPE, 'POST /premium/subscribe', { planId: payload.planId });
  try {
    const data = await apiRequest<SubscribeResponse>(API_ENDPOINTS.premium.subscribe, {
      method: 'POST',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Subscribed', { planId: data.planId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Subscribe failed', getErrorMessage(error));
    throw error;
  }
}

export async function cancelPremium(token: string): Promise<{ message: string }> {
  log.info(SCOPE, 'POST /premium/cancel');
  try {
    const data = await apiRequest<{ message: string }>(API_ENDPOINTS.premium.cancel, {
      method: 'POST',
      token,
    });
    log.ok(SCOPE, 'Subscription cancelled');
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Cancel failed', getErrorMessage(error));
    throw error;
  }
}

export async function createPaymentIntent(
  token: string,
  planId: string,
  paymentMethodId?: string,
): Promise<PaymentIntentResponse> {
  log.info(SCOPE, 'POST /payment/create-payment-intent', { planId });
  try {
    const data = await apiRequest<PaymentIntentResponse>(API_ENDPOINTS.payment.createPaymentIntent, {
      method: 'POST',
      token,
      body: { planId, paymentMethodId },
    });
    log.ok(SCOPE, 'Payment intent created');
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Payment intent failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchPaymentInvoices(token: string): Promise<PaymentInvoice[]> {
  log.info(SCOPE, 'GET /payment/invoices');
  try {
    const data = await apiRequest<PaymentInvoice[]>(API_ENDPOINTS.payment.invoices, { token });
    log.ok(SCOPE, 'Invoices loaded', { count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Invoices failed', getErrorMessage(error));
    throw error;
  }
}

export async function updatePaymentMethod(
  token: string,
  paymentMethodId: string,
): Promise<{ success: boolean; message: string }> {
  log.info(SCOPE, 'POST /payment/update-payment-method');
  try {
    const data = await apiRequest<{ success: boolean; message: string }>(
      API_ENDPOINTS.payment.updatePaymentMethod,
      {
        method: 'POST',
        token,
        body: { paymentMethodId },
      },
    );
    log.ok(SCOPE, 'Payment method updated');
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Update payment method failed', getErrorMessage(error));
    throw error;
  }
}
