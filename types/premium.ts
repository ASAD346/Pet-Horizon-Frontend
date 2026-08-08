export interface PremiumPlan {
  id: string;
  planId: string;
  name: string;
  price: number;
  periodDays: number;
}

export interface PremiumStatusResponse {
  isPremium: boolean;
  plan: string | null;
  expiresAt: string | null;
  autoRenew: boolean;
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

export interface PaymentInvoice {
  id: string;
  amount: number;
  date: string;
  status: string;
  receiptUrl?: string;
}
