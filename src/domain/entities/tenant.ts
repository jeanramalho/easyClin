/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'pending'
  | 'overdue'
  | 'suspended'
  | 'cancelled';

export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  maxProfessionals: number;
  features: string[];
}

export interface Tenant {
  id: string;
  name: string;
  cnpj?: string;
  ownerName: string;
  ownerEmail: string;
  status: SubscriptionStatus;
  planId: string;
  createdAt: string;
  trialEndsAt: string;
  nextBillingAt: string;
  logoUrl?: string;
  balance: number;
}
