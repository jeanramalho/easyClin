/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { UserRole } from './identity';

export interface AuditLog {
  id: string;
  tenantId?: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  ip: string;
  timestamp: string;
}
