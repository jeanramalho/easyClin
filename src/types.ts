/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Compatibility facade while the UI is migrated to domain imports.
export type {
  Appointment,
  AppointmentStatus,
  AuditLog,
  Budget,
  BudgetItem,
  BudgetStatus,
  FinancialTransaction,
  MedicalRecordEntry,
  Patient,
  PatientStatus,
  Plan,
  Procedure,
  SubscriptionStatus,
  Tenant,
  TransactionCategory,
  TransactionType,
  User,
  UserRole,
  UserStatus,
} from './domain/entities';
