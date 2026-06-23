/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole =
  | 'super_admin'
  | 'clinic_admin'
  | 'health_professional'
  | 'receptionist'
  | 'patient';

export type UserStatus = 'active' | 'suspended' | 'blocked';

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  specialty?: string;
  registrationNumber?: string;
  avatarUrl?: string;
}
