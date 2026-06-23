/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SubscriptionStatus, Tenant } from '../entities';

export interface SubscriptionMetrics {
  activeCount: number;
  trialCount: number;
  delinquentCount: number;
  suspendedCount: number;
  cancelledCount: number;
  billableCount: number;
  churnRiskCount: number;
  activationRate: number;
  churnRate: number;
}

export class SubscriptionPolicy {
  static isTrial(status: SubscriptionStatus): boolean {
    return status === 'trial';
  }

  static isActive(status: SubscriptionStatus): boolean {
    return status === 'active';
  }

  static isPending(status: SubscriptionStatus): boolean {
    return status === 'pending';
  }

  static isOverdue(status: SubscriptionStatus): boolean {
    return status === 'overdue';
  }

  static isSuspended(status: SubscriptionStatus): boolean {
    return status === 'suspended';
  }

  static isCancelled(status: SubscriptionStatus): boolean {
    return status === 'cancelled';
  }

  static isBillable(status: SubscriptionStatus): boolean {
    return this.isActive(status);
  }

  static isDelinquent(status: SubscriptionStatus): boolean {
    return this.isPending(status) || this.isOverdue(status);
  }

  static isChurnRisk(status: SubscriptionStatus): boolean {
    return this.isDelinquent(status) || this.isSuspended(status);
  }

  static hasOperationalAccess(status: SubscriptionStatus): boolean {
    return !this.isSuspended(status) && !this.isCancelled(status);
  }

  static shouldShowTrialNotice(status: SubscriptionStatus): boolean {
    return this.isTrial(status);
  }

  static nextStatusAfterManualPayment(status: SubscriptionStatus): SubscriptionStatus {
    if (this.isDelinquent(status) || this.isSuspended(status)) {
      return 'active';
    }

    return status;
  }

  static getReactiveStatus(status: SubscriptionStatus): SubscriptionStatus {
    return this.isSuspended(status) ? 'active' : 'suspended';
  }

  static calculateMetrics(tenants: Tenant[]): SubscriptionMetrics {
    const activeCount = tenants.filter(tenant => this.isActive(tenant.status)).length;
    const trialCount = tenants.filter(tenant => this.isTrial(tenant.status)).length;
    const delinquentCount = tenants.filter(tenant => this.isDelinquent(tenant.status)).length;
    const suspendedCount = tenants.filter(tenant => this.isSuspended(tenant.status)).length;
    const cancelledCount = tenants.filter(tenant => this.isCancelled(tenant.status)).length;
    const billableCount = tenants.filter(tenant => this.isBillable(tenant.status)).length;
    const churnRiskCount = tenants.filter(tenant => this.isChurnRisk(tenant.status)).length;

    return {
      activeCount,
      trialCount,
      delinquentCount,
      suspendedCount,
      cancelledCount,
      billableCount,
      churnRiskCount,
      activationRate: tenants.length > 0 ? (activeCount / tenants.length) * 100 : 0,
      churnRate: tenants.length > 0 ? ((cancelledCount + suspendedCount) / tenants.length) * 100 : 0,
    };
  }
}
