/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 
  | 'super_admin'           // Plataforma Super Admin
  | 'clinic_admin'          // Dono / Administrador da Clínica
  | 'health_professional'   // Profissional de Saúde (Médico, Dentista, etc)
  | 'receptionist'          // Recepção / Secretária
  | 'patient';              // Paciente (Mapeado para visualização)

export type UserStatus = 'active' | 'suspended' | 'blocked';

export type SubscriptionStatus = 'trial' | 'active' | 'pending' | 'overdue' | 'suspended' | 'cancelled';

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
  balance: number; // Mapeado no financeiro consolidado
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  specialty?: string;
  registrationNumber?: string; // CRM, CRO, crefito, etc
  avatarUrl?: string;
}

export type PatientStatus = 'active' | 'inactive';

export interface Patient {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  document: string; // CPF
  gender: string;
  birthDate: string;
  status: PatientStatus;
  hasMedicalAlert: boolean;
  medicalAlertDescription?: string;
  createdAt: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  tenantId: string;
  patientId: string;
  professionalId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // minutos
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
  isLocked: boolean; // LGPD: registros finalizados não podem ser alterados livremente
}

export interface Procedure {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  costPrice: number; // Força de lucro real do QiDent (Custo de insumos)
  clinicCost: number; // Custo hora da clínica
  professionalPercent: number; // Comissão do profissional (%)
  desiredMargin: number; // Margem de lucro desejada (%)
  calculatedPrice: number; // Preço sugerido
  finalPrice: number; // Preço praticado
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
  discount: number; // Desconto em valor
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
  totalProfit: number; // Lucro Real Previsto
  subtotal: number;
  discount: number;
  total: number;
  status: BudgetStatus;
  paymentPlan: string; // Ex: "3x no cartão", "À vista"
  createdAt: string;
}

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

export interface AuditLog {
  id: string;
  tenantId?: string; // Pode ser global se for ação de Super-Admin
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  ip: string;
  timestamp: string;
}
