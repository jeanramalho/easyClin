/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'revenue' | 'expense';

export type TransactionCategory =
  | 'consultation'
  | 'procedure'
  | 'salary'
  | 'rent'
  | 'utilities'
  | 'materials'
  | 'marketing'
  | 'other';

export interface FinancialTransaction {
  id: string;
  tenantId: string;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: number;
  date: string;
  isPaid: boolean;
  paymentMethod: string;
}
