/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PatientStatus = 'active' | 'inactive';

export interface Patient {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  gender: string;
  birthDate: string;
  status: PatientStatus;
  hasMedicalAlert: boolean;
  medicalAlertDescription?: string;
  createdAt: string;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Appointment {
  id: string;
  tenantId: string;
  patientId: string;
  professionalId: string;
  date: string;
  time: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
  procedureId?: string;
  value: number;
}

export interface MedicalRecordEntry {
  id: string;
  tenantId: string;
  patientId: string;
  professionalId: string;
  date: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  evolutionNotes: string;
  isLocked: boolean;
}
