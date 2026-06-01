/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Tenant, User, Patient, Appointment, MedicalRecordEntry, 
  Procedure, Budget, FinancialTransaction, AuditLog, 
  SubscriptionStatus, Plan, UserRole, UserStatus
} from '../types';

// Catalog of SaaS plans
export const PLANS: Plan[] = [
  {
    id: 'plan_bronze',
    name: 'EasyClin Starter (Trial/Solo)',
    priceMonthly: 149.90,
    maxProfessionals: 1,
    features: ['Agenda Básica', 'Prontuário Simples', '1 Profissional', 'Relatórios Financeiros']
  },
  {
    id: 'plan_silver',
    name: 'EasyClin Premium (Clínica)',
    priceMonthly: 299.90,
    maxProfessionals: 5,
    features: ['Agenda Inteligente', 'Prontuário LGPD', 'Até 5 Profissionais', 'Cálculo de Lucro Real (QiDent)', 'Gestão de Orçamentos', 'Notificações SMS/WhatsApp', 'Multicomunidades']
  },
  {
    id: 'plan_gold',
    name: 'EasyClin Platinum (Rede/Ilimitado)',
    priceMonthly: 599.90,
    maxProfessionals: 99,
    features: ['Recursos Ilimitados', 'Multiunidade', 'Profissionais Ilimitados', 'Todas as Automações', 'Conciliação Bancária', 'Suporte VIP 24h', 'Acesso Completo a APIs']
  }
];

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Static Seed Data
const DEFAULT_TENANTS: Tenant[] = [
  {
    id: 'tenant_odonto_premium',
    name: 'Clínica OdontoPremium',
    cnpj: '12.345.678/0001-90',
    ownerName: 'Dr. Arthur Mendes',
    ownerEmail: 'arthur@odontopremium.com',
    status: 'active',
    planId: 'plan_silver',
    createdAt: '2026-01-10T10:00:00Z',
    trialEndsAt: '2026-01-25T10:00:00Z',
    nextBillingAt: '2026-07-10T10:00:00Z',
    logoUrl: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=120&h=120',
    balance: 14250.00
  },
  {
    id: 'tenant_clin_geral',
    name: 'Clínica Médica Viver Mais',
    cnpj: '98.765.432/0001-10',
    ownerName: 'Dra. Luana Rocha',
    ownerEmail: 'contato@vivermais.com.br',
    status: 'trial',
    planId: 'plan_bronze',
    createdAt: '2026-05-20T08:00:00Z',
    trialEndsAt: '2026-06-15T08:00:00Z',
    nextBillingAt: '2026-06-15T08:00:00Z',
    logoUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=120&h=120',
    balance: 0
  },
  {
    id: 'tenant_inadimplente',
    name: 'Clínica FisioFort (Suspenso)',
    cnpj: '45.123.654/0001-22',
    ownerName: 'Dr. Ricardo Silva',
    ownerEmail: 'ricardo@fisiofort.com',
    status: 'suspended',
    planId: 'plan_silver',
    createdAt: '2025-08-01T10:00:00Z',
    trialEndsAt: '2025-08-16T10:00:00Z',
    nextBillingAt: '2026-05-01T10:00:00Z',
    logoUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=120&h=120',
    balance: -899.70 // Reflete atrasos/faturamento pendente
  }
];

const DEFAULT_USERS: User[] = [
  // Super Admin da plataforma EasyClin
  {
    id: 'user_super_admin',
    tenantId: 'system',
    name: 'Sérgio Ramos (SaaS Owner)',
    email: 'admin@easyclin.com',
    role: 'super_admin',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100'
  } as any,
  // Tenant OdontoPremium
  {
    id: 'user_arthur_owner',
    tenantId: 'tenant_odonto_premium',
    name: 'Dr. Arthur Mendes',
    email: 'arthur@odontopremium.com',
    role: 'clinic_admin',
    status: 'active',
    specialty: 'Implantodontia & Estética',
    registrationNumber: 'CRO-SP 12345',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=100&h=100'
  },
  {
    id: 'user_mariana_dentist',
    tenantId: 'tenant_odonto_premium',
    name: 'Dra. Mariana Costa',
    email: 'mariana@odontopremium.com',
    role: 'health_professional',
    status: 'active',
    specialty: 'Odontopediatria',
    registrationNumber: 'CRO-SP 98765',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=100&h=100'
  },
  {
    id: 'user_sabrina_reception',
    tenantId: 'tenant_odonto_premium',
    name: 'Sabrina Souza',
    email: 'sabrina@odontopremium.com',
    role: 'receptionist',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100'
  },
  // Tenant Viver Mais (Geral)
  {
    id: 'user_luana_owner',
    tenantId: 'tenant_clin_geral',
    name: 'Dra. Luana Rocha',
    email: 'luana@vivermais.com.br',
    role: 'clinic_admin',
    status: 'active',
    specialty: 'Pediatria e Família',
    registrationNumber: 'CRM-SP 45678',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100&h=100'
  },
  // Tenant FisioFort Suspenso
  {
    id: 'user_ricardo_owner',
    tenantId: 'tenant_inadimplente',
    name: 'Dr. Ricardo Silva',
    email: 'ricardo@fisiofort.com',
    role: 'clinic_admin',
    status: 'active',
    specialty: 'Fisioterapia Esportiva',
    registrationNumber: 'CREFITO-3 15152',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=100&h=100'
  }
];

const DEFAULT_PATIENTS: Patient[] = [
  {
    id: 'pat_1',
    tenantId: 'tenant_odonto_premium',
    name: 'Carlos Henrique Albuquerque',
    email: 'carlos.albuquerque@gmail.com',
    phone: '(11) 98111-2233',
    document: '123.456.789-00',
    gender: 'Masculino',
    birthDate: '1985-04-12',
    status: 'active',
    hasMedicalAlert: true,
    medicalAlertDescription: 'Hipertenso e alérgico a Penicilina',
    createdAt: '2026-02-01T11:00:00Z'
  },
  {
    id: 'pat_2',
    tenantId: 'tenant_odonto_premium',
    name: 'Ana Paula Medeiros',
    email: 'anapaula.med@yahoo.com.br',
    phone: '(11) 97321-4455',
    document: '987.654.321-12',
    gender: 'Feminino',
    birthDate: '1992-11-25',
    status: 'active',
    hasMedicalAlert: false,
    createdAt: '2026-02-15T15:20:00Z'
  },
  {
    id: 'pat_3',
    tenantId: 'tenant_odonto_premium',
    name: 'Roberto Godoy',
    email: 'robertogodoy@gmail.com',
    phone: '(11) 96155-9090',
    document: '456.789.123-44',
    gender: 'Masculino',
    birthDate: '1968-07-03',
    status: 'active',
    hasMedicalAlert: true,
    medicalAlertDescription: 'Cardiopata. Usa marcapasso.',
    createdAt: '2026-03-05T09:12:00Z'
  },
  {
    id: 'pat_4',
    tenantId: 'tenant_clin_geral',
    name: 'Gabriel Rocha Mendes',
    email: 'gabi.rocha@hotmail.com',
    phone: '(11) 95532-1122',
    document: '234.567.890-11',
    gender: 'Masculino',
    birthDate: '2019-09-14',
    status: 'active',
    hasMedicalAlert: false,
    createdAt: '2026-05-21T10:00:00Z'
  }
];

// Seed procedures showing cost base & desired markups
const DEFAULT_PROCEDURES: Procedure[] = [
  {
    id: 'proc_1',
    tenantId: 'tenant_odonto_premium',
    name: 'Canal (Endodontia Molar)',
    category: 'Tratamento Endodôntico',
    costPrice: 220.00,       // QiDent Lucro Real: Insumos, agulhas, resinas
    clinicCost: 150.00,      // Custo hora operacional da sala
    professionalPercent: 30, // Repasse ao profissional de saúde (%)
    desiredMargin: 40,       // Margem líquida desejada (%)
    calculatedPrice: 875.00,
    finalPrice: 890.00
  },
  {
    id: 'proc_2',
    tenantId: 'tenant_odonto_premium',
    name: 'Implante Dentário de Titânio',
    category: 'Cirurgia Implantodôntica',
    costPrice: 650.00,
    clinicCost: 200.00,
    professionalPercent: 25,
    desiredMargin: 45,
    calculatedPrice: 2000.00,
    finalPrice: 2100.00
  },
  {
    id: 'proc_3',
    tenantId: 'tenant_odonto_premium',
    name: 'Restauração de Resina Fotopolimerizável',
    category: 'Clínica Geral',
    costPrice: 35.00,
    clinicCost: 50.00,
    professionalPercent: 35,
    desiredMargin: 50,
    calculatedPrice: 215.00,
    finalPrice: 220.00
  },
  {
    id: 'proc_4',
    tenantId: 'tenant_odonto_premium',
    name: 'Limpeza e Profilaxia Odontológica',
    category: 'Prevenção',
    costPrice: 15.00,
    clinicCost: 40.00,
    professionalPercent: 40,
    desiredMargin: 45,
    calculatedPrice: 140.00,
    finalPrice: 150.00
  },
  {
    id: 'proc_clinger_1',
    tenantId: 'tenant_clin_geral',
    name: 'Consulta Pediátrica Mensal',
    category: 'Consultas',
    costPrice: 10.00,
    clinicCost: 25.00,
    professionalPercent: 50,
    desiredMargin: 30,
    calculatedPrice: 150.00,
    finalPrice: 150.00
  }
];

const DEFAULT_APPOINTMENTS: Appointment[] = [
  {
    id: 'app_1',
    tenantId: 'tenant_odonto_premium',
    patientId: 'pat_1',
    professionalId: 'user_arthur_owner',
    date: '2026-06-01',
    time: '09:00',
    duration: 60,
    status: 'completed',
    notes: 'Exame de rotina e raio-X realizado. Necessário implantar molar 36.',
    procedureId: 'proc_4',
    value: 150.00
  },
  {
    id: 'app_2',
    tenantId: 'tenant_odonto_premium',
    patientId: 'pat_2',
    professionalId: 'user_arthur_owner',
    date: '2026-06-01',
    time: '11:00',
    duration: 90,
    status: 'confirmed',
    notes: 'Anestesia local. Executar procedimento de restauração e profilaxia.',
    procedureId: 'proc_3',
    value: 220.00
  },
  {
    id: 'app_3',
    tenantId: 'tenant_odonto_premium',
    patientId: 'pat_3',
    professionalId: 'user_mariana_dentist',
    date: '2026-06-01',
    time: '14:30',
    duration: 60,
    status: 'pending',
    notes: 'Início do tratamento endodôntico.',
    procedureId: 'proc_1',
    value: 890.00
  },
  {
    id: 'app_4',
    tenantId: 'tenant_odonto_premium',
    patientId: 'pat_1',
    professionalId: 'user_mariana_dentist',
    date: '2026-06-02',
    time: '10:00',
    duration: 60,
    status: 'pending',
    notes: 'Retorno para acompanhamento da cicatrização inicial.',
    value: 0
  },
  {
    id: 'app_5',
    tenantId: 'tenant_clin_geral',
    patientId: 'pat_4',
    professionalId: 'user_luana_owner',
    date: '2026-06-01',
    time: '10:00',
    duration: 45,
    status: 'confirmed',
    notes: 'Puericultura de rotina.',
    procedureId: 'proc_clinger_1',
    value: 150.00
  }
];

const DEFAULT_BUDGETS: Budget[] = [
  {
    id: 'bud_1',
    tenantId: 'tenant_odonto_premium',
    patientId: 'pat_1',
    items: [
      {
        procedureId: 'proc_2',
        procedureName: 'Implante Dentário de Titânio',
        costPrice: 650.00,
        clinicCost: 200.00,
        professionalPercent: 25,
        desiredMargin: 45,
        calculatedPrice: 2000.00,
        finalPrice: 2000.00,
        discount: 0
      },
      {
        procedureId: 'proc_3',
        procedureName: 'Restauração de Resina Fotopolimerizável',
        costPrice: 35.00,
        clinicCost: 50.00,
        professionalPercent: 35,
        desiredMargin: 50,
        calculatedPrice: 215.00,
        finalPrice: 200.00,
        discount: 20.00
      }
    ],
    totalCostPrice: 685.00,
    totalClinCost: 250.00,
    totalCommission: 570.00, // 25% de 2000, 35% de 200
    totalProfit: 695.00, // 2200 - 685 (insumos) - 250 (sala) - 570 (comissão)
    subtotal: 2215.00,
    discount: 20.00,
    total: 2195.00,
    status: 'approved',
    paymentPlan: 'Entrada de R$ 500 + 4x de R$ 423,75 s/ juros',
    createdAt: '2026-05-25T14:15:00Z'
  },
  {
    id: 'bud_2',
    tenantId: 'tenant_odonto_premium',
    patientId: 'pat_3',
    items: [
      {
        procedureId: 'proc_1',
        procedureName: 'Canal (Endodontia Molar)',
        costPrice: 220.00,
        clinicCost: 150.00,
        professionalPercent: 30,
        desiredMargin: 40,
        calculatedPrice: 875.00,
        finalPrice: 875.00,
        discount: 0
      }
    ],
    totalCostPrice: 220.00,
    totalClinCost: 150.00,
    totalCommission: 262.50,
    totalProfit: 242.50,
    subtotal: 875.00,
    discount: 0,
    total: 875.00,
    status: 'pending',
    paymentPlan: 'À vista com 5% de desconto via Pix',
    createdAt: '2026-05-28T16:00:00Z'
  }
];

const DEFAULT_FINANCES: FinancialTransaction[] = [
  {
    id: 'fin_1',
    tenantId: 'tenant_odonto_premium',
    type: 'revenue',
    category: 'procedure',
    description: 'Rendimento Orçamento Aprovado (Carlos Henrique) - Entrada',
    amount: 500.00,
    date: '2026-05-25',
    isPaid: true,
    paymentMethod: 'Pix'
  },
  {
    id: 'fin_2',
    tenantId: 'tenant_odonto_premium',
    type: 'revenue',
    category: 'consultation',
    description: 'Atendimento de Limpeza (Carlos Henrique)',
    amount: 150.00,
    date: '2026-06-01',
    isPaid: true,
    paymentMethod: 'Débito'
  },
  {
    id: 'fin_3',
    tenantId: 'tenant_odonto_premium',
    type: 'expense',
    category: 'materials',
    description: 'Compra de luvas, agulhas e resina ortodôntica - Dental Dental',
    amount: 1450.00,
    date: '2026-05-18',
    isPaid: true,
    paymentMethod: 'Boleto'
  },
  {
    id: 'fin_4',
    tenantId: 'tenant_odonto_premium',
    type: 'expense',
    category: 'rent',
    description: 'Aluguel do imóvel da clínica - Sala Comercial 14',
    amount: 3200.00,
    date: '2026-05-05',
    isPaid: true,
    paymentMethod: 'Transferência'
  },
  {
    id: 'fin_5',
    tenantId: 'tenant_odonto_premium',
    type: 'revenue',
    category: 'procedure',
    description: 'Parcela 1/4 Orçamento Carlos Henrique',
    amount: 423.75,
    date: '2026-05-30',
    isPaid: true,
    paymentMethod: 'Cartão de Crédito'
  }
];

const DEFAULT_EVOLUTIONS: MedicalRecordEntry[] = [
  {
    id: 'ev_1',
    tenantId: 'tenant_odonto_premium',
    patientId: 'pat_1',
    professionalId: 'user_arthur_owner',
    date: '2026-06-01T10:15:00Z',
    symptoms: 'Paciente queixava-se de sensibilidade extrema ao frio no molar 36.',
    diagnosis: 'Fratura profunda coronária com comprometimento pulpar.',
    prescription: 'Decongestionador de endo-selante + Amoxicilina 500mg em caso de dor intensa.',
    evolutionNotes: 'Realizado o isolamento absoluto e abertura de canal. Procedimento transcorreu com exito, dor diminuída de imediato pós-canal parcial. Retorno agendado para término do canal.',
    isLocked: true // LGPD Audit locked
  }
];

const DEFAULT_AUDIT: AuditLog[] = [
  {
    id: 'aud_1',
    tenantId: 'tenant_odonto_premium',
    userId: 'user_arthur_owner',
    userName: 'Dr. Arthur Mendes',
    userRole: 'clinic_admin',
    action: 'Bloqueio de Prontuário LGP-D',
    details: 'Bloqueou a evolução do paciente Carlos Henrique (pat_1) gerada em 01/06/2026.',
    ip: '192.168.1.101',
    timestamp: '2026-06-01T10:16:00Z'
  },
  {
    id: 'aud_2',
    tenantId: 'tenant_odonto_premium',
    userId: 'user_arthur_owner',
    userName: 'Dr. Arthur Mendes',
    userRole: 'clinic_admin',
    action: 'Criação de Orçamento Inteligente',
    details: 'Criou orçamento bud_1 para o paciente Carlos Henrique no valor de R$ 2.195,00.',
    ip: '192.168.1.101',
    timestamp: '2026-05-25T14:15:00Z'
  },
  {
    id: 'aud_3',
    userId: 'user_super_admin',
    userName: 'Sérgio Ramos',
    userRole: 'super_admin',
    action: 'Bloqueio de Tenant Inadimplente',
    details: 'Bloqueou a operação comercial do Tenant "Clínica FisioFort" devido à inadimplência superior a 15 dias.',
    ip: '189.44.110.22',
    timestamp: '2026-05-15T00:05:00Z'
  }
];

// Local state initialization wrapper
class LocalDatabase {
  private getStorage<T>(key: string, defaultVal: T): T {
    try {
      const item = localStorage.getItem(`easyclin_${key}`);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`easyclin_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('Storage quota exceeded or disabled', e);
    }
  }

  // Active user / session state (Non-persistent session simulator or cookie mockup)
  get currentUser(): User {
    const defaultUser = DEFAULT_USERS[1]; // Dr. Arthur Mendes as default
    return this.getStorage<User>('current_user', defaultUser);
  }

  set currentUser(user: User) {
    this.setStorage<User>('current_user', user);
  }

  get activeTenant(): Tenant | null {
    const userObj = this.currentUser;
    if (userObj.role === 'super_admin' || userObj.tenantId === 'system') {
      return null;
    }
    return this.getTenants().find(t => t.id === userObj.tenantId) || null;
  }

  // Tenants CRUD
  getTenants(): Tenant[] {
    return this.getStorage<Tenant[]>('tenants', DEFAULT_TENANTS);
  }

  saveTenant(tenant: Tenant): void {
    const tenants = this.getTenants();
    const index = tenants.findIndex(t => t.id === tenant.id);
    if (index >= 0) {
      tenants[index] = tenant;
    } else {
      tenants.push(tenant);
    }
    this.setStorage('tenants', tenants);
  }

  // Users CRUD
  getUsers(): User[] {
    return this.getStorage<User[]>('users', DEFAULT_USERS);
  }

  saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.setStorage('users', users);
  }

  // Patients CRUD
  getPatients(tenantId: string): Patient[] {
    const patients = this.getStorage<Patient[]>('patients', DEFAULT_PATIENTS);
    return patients.filter(p => p.tenantId === tenantId);
  }

  getAllPatients(): Patient[] {
    return this.getStorage<Patient[]>('patients', DEFAULT_PATIENTS);
  }

  savePatient(patient: Patient): void {
    const patients = this.getStorage<Patient[]>('patients', DEFAULT_PATIENTS);
    const index = patients.findIndex(p => p.id === patient.id);
    if (index >= 0) {
      patients[index] = patient;
    } else {
      patients.push(patient);
    }
    this.setStorage('patients', patients);
  }

  // Procedures CRUD
  getProcedures(tenantId: string): Procedure[] {
    const procedures = this.getStorage<Procedure[]>('procedures', DEFAULT_PROCEDURES);
    return procedures.filter(p => p.tenantId === tenantId);
  }

  saveProcedure(procedure: Procedure): void {
    const procedures = this.getStorage<Procedure[]>('procedures', DEFAULT_PROCEDURES);
    const index = procedures.findIndex(p => p.id === procedure.id);
    if (index >= 0) {
      procedures[index] = procedure;
    } else {
      procedures.push(procedure);
    }
    this.setStorage('procedures', procedures);
  }

  // Appointments CRUD
  getAppointments(tenantId: string): Appointment[] {
    const appointments = this.getStorage<Appointment[]>('appointments', DEFAULT_APPOINTMENTS);
    return appointments.filter(a => a.tenantId === tenantId);
  }

  saveAppointment(appointment: Appointment): void {
    const appointments = this.getStorage<Appointment[]>('appointments', DEFAULT_APPOINTMENTS);
    const index = appointments.findIndex(a => a.id === appointment.id);
    if (index >= 0) {
      appointments[index] = appointment;
    } else {
      appointments.push(appointment);
    }
    this.setStorage('appointments', appointments);
  }

  // Medical records CRUD
  getMedicalRecords(tenantId: string, patientId: string): MedicalRecordEntry[] {
    const records = this.getStorage<MedicalRecordEntry[]>('medical_records', DEFAULT_EVOLUTIONS);
    return records.filter(r => r.tenantId === tenantId && r.patientId === patientId);
  }

  saveMedicalRecord(record: MedicalRecordEntry): void {
    const records = this.getStorage<MedicalRecordEntry[]>('medical_records', DEFAULT_EVOLUTIONS);
    const index = records.findIndex(r => r.id === record.id);
    if (index >= 0) {
      records[index] = record;
    } else {
      records.push(record);
    }
    this.setStorage('medical_records', records);
  }

  // Budgets CRUD
  getBudgets(tenantId: string): Budget[] {
    const budgets = this.getStorage<Budget[]>('budgets', DEFAULT_BUDGETS);
    return budgets.filter(b => b.tenantId === tenantId);
  }

  saveBudget(budget: Budget): void {
    const budgets = this.getStorage<Budget[]>('budgets', DEFAULT_BUDGETS);
    const index = budgets.findIndex(b => b.id === budget.id);
    if (index >= 0) {
      budgets[index] = budget;
    } else {
      budgets.push(budget);
    }
    this.setStorage('budgets', budgets);
  }

  // Finance CRUD
  getTransactions(tenantId: string): FinancialTransaction[] {
    const txs = this.getStorage<FinancialTransaction[]>('finances', DEFAULT_FINANCES);
    return txs.filter(t => t.tenantId === tenantId);
  }

  saveTransaction(tx: FinancialTransaction): void {
    const txs = this.getStorage<FinancialTransaction[]>('finances', DEFAULT_FINANCES);
    const index = txs.findIndex(t => t.id === tx.id);
    if (index >= 0) {
      txs[index] = tx;
    } else {
      txs.push(tx);
    }
    this.setStorage('finances', txs);
  }

  // Audit Logs CRUD
  getAuditLogs(tenantId?: string): AuditLog[] {
    const logs = this.getStorage<AuditLog[]>('audit_logs', DEFAULT_AUDIT);
    if (tenantId) {
      return logs.filter(l => l.tenantId === tenantId);
    }
    return logs; // Retorna tudo para o SuperAdmin
  }

  logAction(userId: string, userName: string, role: UserRole, action: string, details: string, tenantId?: string): void {
    const logs = this.getStorage<AuditLog[]>('audit_logs', DEFAULT_AUDIT);
    const newLog: AuditLog = {
      id: `aud_${generateId()}`,
      tenantId,
      userId,
      userName,
      userRole: role,
      action,
      details,
      ip: '192.168.1.' + Math.floor(Math.random() * 254 + 1),
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog); // Mais recentes primeiro
    this.setStorage('audit_logs', logs);
  }

  // Helper to re-seed / reset
  resetDatabase(): void {
    localStorage.removeItem('easyclin_tenants');
    localStorage.removeItem('easyclin_users');
    localStorage.removeItem('easyclin_patients');
    localStorage.removeItem('easyclin_procedures');
    localStorage.removeItem('easyclin_appointments');
    localStorage.removeItem('easyclin_medical_records');
    localStorage.removeItem('easyclin_budgets');
    localStorage.removeItem('easyclin_finances');
    localStorage.removeItem('easyclin_audit_logs');
    localStorage.removeItem('easyclin_current_user');
  }
}

export const dbObj = new LocalDatabase();
