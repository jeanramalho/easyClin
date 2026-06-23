/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BudgetItem } from '../entities';
import { PricingService } from './PricingService';

export interface BudgetTotals {
  totalCostPrice: number;
  totalClinCost: number;
  totalCommission: number;
  totalProfit: number;
  subtotal: number;
  discount: number;
  total: number;
  profitMarginPercent: number;
}

export class BudgetTotalsService {
  static calculate(items: BudgetItem[], discount: number): BudgetTotals {
    const totalCostPrice = items.reduce((sum, item) => sum + item.costPrice, 0);
    const totalClinCost = items.reduce((sum, item) => sum + item.clinicCost, 0);
    const totalCommission = items.reduce(
      (sum, item) => sum + PricingService.calculateProfessionalCommission(
        item.finalPrice,
        item.professionalPercent
      ),
      0
    );
    const subtotal = items.reduce((sum, item) => sum + item.finalPrice, 0);
    const normalizedDiscount = Math.max(0, discount);
    const total = Math.max(0, subtotal - normalizedDiscount);
    const totalProfit = total - totalCostPrice - totalClinCost - totalCommission;
    const profitMarginPercent = PricingService.calculateNetMarginPercent(total, totalProfit);

    return {
      totalCostPrice,
      totalClinCost,
      totalCommission,
      totalProfit,
      subtotal,
      discount: normalizedDiscount,
      total,
      profitMarginPercent,
    };
  }

  static calculateItemCommission(item: BudgetItem): number {
    return PricingService.calculateProfessionalCommission(
      item.finalPrice,
      item.professionalPercent
    );
  }

  static calculateItemProfit(item: BudgetItem): number {
    return PricingService.calculateNetProfit({
      costPrice: item.costPrice,
      clinicCost: item.clinicCost,
      professionalPercent: item.professionalPercent,
      desiredMargin: item.desiredMargin,
      finalPrice: item.finalPrice,
    });
  }

  static calculateMaxDiscount(subtotal: number, maxDiscountPercent = 40): number {
    return Math.round(subtotal * (maxDiscountPercent / 100));
  }
}
