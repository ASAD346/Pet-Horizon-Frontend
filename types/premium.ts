export interface PremiumPlan {
  id: string;
  planId: string;
  name: string;
  price: number;
  periodDays: number;
  stripePriceId?: string;
}

export interface PremiumStatusResponse {
  isPremium: boolean;
  plan: string | null;
  expiresAt: string | null;
  autoRenew: boolean;
  stripeSubscriptionId?: string | null;
}

export interface SubscribeRequest {
  planId: string;
  familyId?: string;
}

export interface SubscribeResponse {
  status: string;
  planId: string;
  expiresAt: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PaymentInvoice {
  id: string;
  amount: number;
  date: string;
  status: string;
  receiptUrl?: string;
}
