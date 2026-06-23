/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Procedure } from '../entities';

export interface PricingInput {
  costPrice: number;
  clinicCost: number;
  professionalPercent: number;
  desiredMargin: number;
}

export interface PracticedPricingInput extends PricingInput {
  finalPrice: number;
}

export interface PricingAnalysis {
  suggestedPrice: number;
  professionalCommission: number;
  netProfit: number;
  netMarginPercent: number;
  operatingCost: number;
  operatingCostPercent: number;
}

const MINIMUM_SAFE_DIVISOR = 0.05;
const UNSAFE_PRICE_MULTIPLIER = 5;

const percentOf = (value: number, percent: number): number => value * (percent / 100);

export class PricingService {
  static calculateSuggestedPrice(input: PricingInput): number {
    const fixedCost = input.costPrice + input.clinicCost;
    const divisor = 1 - input.professionalPercent / 100 - input.desiredMargin / 100;

    if (divisor <= MINIMUM_SAFE_DIVISOR) {
      return fixedCost * UNSAFE_PRICE_MULTIPLIER;
    }

    return fixedCost / divisor;
  }

  static calculateProfessionalCommission(finalPrice: number, professionalPercent: number): number {
    return percentOf(finalPrice, professionalPercent);
  }

  static calculateNetProfit(input: PracticedPricingInput): number {
    const professionalCommission = this.calculateProfessionalCommission(
      input.finalPrice,
      input.professionalPercent
    );

    return input.finalPrice - input.costPrice - input.clinicCost - professionalCommission;
  }

  static calculateNetMarginPercent(finalPrice: number, netProfit: number): number {
    return finalPrice > 0 ? (netProfit / finalPrice) * 100 : 0;
  }

  static analyze(input: PracticedPricingInput): PricingAnalysis {
    const suggestedPrice = this.calculateSuggestedPrice(input);
    const professionalCommission = this.calculateProfessionalCommission(
      input.finalPrice,
      input.professionalPercent
    );
    const netProfit = input.finalPrice - input.costPrice - input.clinicCost - professionalCommission;
    const netMarginPercent = this.calculateNetMarginPercent(input.finalPrice, netProfit);
    const operatingCost = input.costPrice + input.clinicCost + professionalCommission;
    const operatingCostPercent = input.finalPrice > 0
      ? Math.min(100, (operatingCost / input.finalPrice) * 100)
      : 0;

    return {
      suggestedPrice,
      professionalCommission,
      netProfit,
      netMarginPercent,
      operatingCost,
      operatingCostPercent,
    };
  }

  static analyzeProcedure(procedure: Procedure): PricingAnalysis {
    return this.analyze({
      costPrice: procedure.costPrice,
      clinicCost: procedure.clinicCost,
      professionalPercent: procedure.professionalPercent,
      desiredMargin: procedure.desiredMargin,
      finalPrice: procedure.finalPrice,
    });
  }
}
