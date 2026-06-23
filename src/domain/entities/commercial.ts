/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Procedure {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  costPrice: number;
  clinicCost: number;
  professionalPercent: number;
  desiredMargin: number;
  calculatedPrice: number;
  finalPrice: number;
}

export interface BudgetItem {
  procedureId: string;
  procedureName: string;
  costPrice: number;
  clinicCost: number;
  professionalPercent: number;
  desiredMargin: number;
  calculatedPrice: number;
  finalPrice: number;
  discount: number;
}

export type BudgetStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'converted';

export interface Budget {
  id: string;
  tenantId: string;
  patientId: string;
  items: BudgetItem[];
  totalCostPrice: number;
  totalClinCost: number;
  totalCommission: number;
  totalProfit: number;
  subtotal: number;
  discount: number;
  total: number;
  status: BudgetStatus;
  paymentPlan: string;
  createdAt: string;
}
