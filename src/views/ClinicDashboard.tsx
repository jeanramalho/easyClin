/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Tenant, Patient, Appointment, Procedure, Budget, FinancialTransaction, AuditLog } from '../types';
import { dbObj } from '../services/db';
import { 
  Building2, Users, Calendar, Calculator, FileSpreadsheet, 
  PiggyBank, ShieldCheck, Settings, AlertTriangle, Play, RefreshCw, 
  LogOut, ShieldX, UserCheck, Stethoscope, Lock, Mail, Phone, MapPin
} from 'lucide-react';

// Child panels imports
import AgendaPanel from '../components/AgendaPanel';
import PatientPanel from '../components/PatientPanel';
import BudgetPanel from '../components/BudgetPanel';
import QiDentCalculator from '../components/QiDentCalculator';
import FinancePanel from '../components/FinancePanel';

interface ClinicDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onRoleSwitch: (newUser: User) => void;
  darkMode: boolean;
}

export default function ClinicDashboard({ currentUser, onLogout, onRoleSwitch, darkMode }: ClinicDashboardProps) {
  // Local state replicas of DB
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'agenda' | 'patients' | 'budgets' | 'pricing' | 'finance' | 'admin'>('agenda');

  // Staff registration handler
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'health_professional' | 'receptionist'>('health_professional');
  const [newStaffSpecialty, setNewStaffSpecialty] = useState('');

  // Load database items on launch and refresh helper
  const reloadData = () => {
    const tenant = dbObj.activeTenant;
    setActiveTenant(tenant);

    if (tenant) {
      setPatients(dbObj.getPatients(tenant.id));
      setAppointments(dbObj.getAppointments(tenant.id));
      setProcedures(dbObj.getProcedures(tenant.id));
      setBudgets(dbObj.getBudgets(tenant.id));
      setTransactions(dbObj.getTransactions(tenant.id));
      setAuditLogs(dbObj.getAuditLogs(tenant.id));
      setAllUsers(dbObj.getUsers().filter(u => u.tenantId === tenant.id));
    }
  };

  useEffect(() => {
    reloadData();
  }, [currentUser]);

  if (!activeTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-white">
        <div className="text-center">
          <p className="text-xs text-rose-500 font-extrabold uppercase tracking-widest">Sessão Corrompida</p>
          <h2 className="text-xl font-bold mt-1">Tenant não localizado</h2>
          <button onClick={onLogout} className="mt-4 px-4 py-2 border rounded-xl">Voltar ao Login</button>
        </div>
      </div>
    );
  }

  // Privilege controls under specific roles
  const isReceptionist = currentUser.role === 'receptionist';
  const isProfessional = currentUser.role === 'health_professional';
  const isAdmin = currentUser.role === 'clinic_admin';

  // Instant simulation: clearances of billing suspensions
  const handleClearAtraso = () => {
    const updatedTenant: Tenant = { 
      ...activeTenant, 
      status: 'active',
      nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // posterga 30 dias
    };
    dbObj.saveTenant(updatedTenant);
    dbObj.logAction(
      currentUser.id,
      currentUser.name,
      currentUser.role,
      'Liquidação Financeira Manual',
      `Liberou acesso comercial após regularização simulada de pagamento da mensalidade.`,
      activeTenant.id
    );
    reloadData();
  };

  const handleRegisterStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;

    const newStaff: User = {
      id: `user_${Math.random().toString(36).substring(2, 9)}`,
      tenantId: activeTenant.id,
      name: newStaffName,
      email: newStaffEmail,
      role: newStaffRole,
      status: 'active',
      specialty: newStaffRole === 'health_professional' ? newStaffSpecialty : undefined
    };

    dbObj.saveUser(newStaff);

    dbObj.logAction(
      currentUser.id,
      currentUser.name,
      currentUser.role,
      'Novo Membro Registrado',
      `Cadastrou novo colaborador ${newStaffName} com permissão "${newStaffRole}".`,
      activeTenant.id
    );

    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffSpecialty('');
    reloadData();
  };

  // Switch role simulator within identical clinic tenant
  const simulatedStaffMembers = dbObj.getUsers().filter(u => u.tenantId === activeTenant.id);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* 1. Header Banner */}
      <header className={`border-b px-4 md:px-8 py-3.5 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-30 shadow-sm transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Brand/Clinic details */}
        <div className="flex items-center gap-3">
          {activeTenant.logoUrl ? (
            <img 
              src={activeTenant.logoUrl} 
              alt={activeTenant.name} 
              className="w-10 h-10 object-cover rounded-xl shrink-0" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold font-sans">
              {activeTenant.name.charAt(0)}
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <h2 className="font-extrabold text-sm md:text-md tracking-tight">{activeTenant.name}</h2>
              <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase ${
                activeTenant.status === 'active' 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : activeTenant.status === 'trial' 
                  ? 'bg-amber-500/10 text-amber-500' 
                  : 'bg-rose-500/10 text-rose-500'
              }`}>
                {activeTenant.status}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">Tenant ID: {activeTenant.id}</p>
          </div>
        </div>

        {/* Simulator controls + role selectors (Middle of header) */}
        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
          darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-100/80 border-slate-200'
        }`}>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Simulador de Papel:</span>
          
          <select
            value={currentUser.id}
            onChange={(e) => {
              const matched = simulatedStaffMembers.find(m => m.id === e.target.value);
              if (matched) onRoleSwitch(matched);
            }}
            className="p-1 px-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent"
          >
            {simulatedStaffMembers.map(m => {
              let labelRole = m.role === 'clinic_admin' ? 'Dono' : m.role === 'receptionist' ? 'Recepção' : 'Dentista/Médico';
              return (
                <option key={m.id} value={m.id}>
                  {m.name} ({labelRole})
                </option>
              );
            })}
          </select>
        </div>

        {/* Right logout credits */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="text-right">
            <span className="text-slate-400 font-normal uppercase text-[9px] tracking-widest block leading-3">Conectado como</span>
            <span className="text-slate-900 dark:text-slate-100 font-bold">{currentUser.name}</span>
          </div>

          <button
            onClick={onLogout}
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-850 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 transition-colors cursor-pointer"
            title="Sair do consultório"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 2. Overdue Subscription Blocker Screen */}
      {activeTenant.status === 'suspended' ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className={`max-w-md w-full p-8 rounded-2xl border text-center space-y-6 shadow-2xl ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="mx-auto w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center">
              <ShieldX className="h-10 w-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full">
                ACESSO BLOQUEADO AUTOMATICAMENTE
              </span>
              <h2 className="text-xl font-bold">Faturamento Vencido há +15 dias</h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Olá, <strong>{activeTenant.ownerName}</strong>. O faturamento mensal do EasyClin Silver referente à clínica <strong>{activeTenant.name}</strong> não foi conciliado. Por motivos de segurança e LGPD, a operação comercial está suspensa.
              </p>
            </div>

            {/* Simulated Regularize / pay button */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-3">
              <p className="text-[10px] text-slate-400 font-medium leading-tight">Como administrador de homologação, você pode liquidar este boleto fictício em 1 clique para testar as dependências instantâneas de liberação de login do SaaS:</p>
              
              <button
                onClick={handleClearAtraso}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10 transition-transform active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Registrar Pagamento Simulado</span>
              </button>
            </div>

            <button
              onClick={onLogout}
              className="px-4 py-1.5 border hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold"
            >
              Voltar à escolha de perfil
            </button>
          </div>
        </div>
      ) : (
        /* 3. NORMAL OPERATOR PATHWAYS SCREEN */
        <>
          {/* Subheader summary stats & trial alerts */}
          <div className={`px-4 md:px-8 py-3.5 flex flex-wrap justify-between items-center gap-3 border-b text-xs ${
            darkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-100/50 border-slate-200'
          }`}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-blue-500" />
                Pacientes: <strong>{patients.length}</strong>
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                Agenda Hoje: <strong>{appointments.length} Consultas</strong>
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <Calculator className="h-3.5 w-3.5 text-blue-500" />
                Catálogo: <strong>{procedures.length} Tratamentos</strong>
              </span>
            </div>

            {/* Trial period notification alerts */}
            {activeTenant.status === 'trial' && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl px-4 py-1.5 flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 animate-bounce" />
                <span>Você está rodando no modo TRIAL de Testes (Expira em breve).</span>
              </div>
            )}
          </div>

          {/* Core Dashboard Grid Layout */}
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Left sidebar nav container */}
            <div className="col-span-1 border-r border-slate-200 dark:border-slate-800 pr-0 md:pr-4 flex flex-col gap-1.5">
              
              {/* Agenda Tab */}
              <button
                onClick={() => setActiveTab('agenda')}
                className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-colors ${
                  activeTab === 'agenda'
                    ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/10'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Calendar className="h-4.5 w-4.5 shrink-0" />
                <div>
                  <p className="text-xs">Agenda Central</p>
                  <span className="text-[10px] opacity-75 font-normal">Operações e WhatsApp CRM</span>
                </div>
              </button>

              {/* Patients Tab */}
              <button
                onClick={() => setActiveTab('patients')}
                className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-colors ${
                  activeTab === 'patients'
                    ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/10'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Users className="h-4.5 w-4.5 shrink-0" />
                <div>
                  <p className="text-xs">Fichas e Prontuários</p>
                  <span className="text-[10px] opacity-75 font-normal">Evoluções em conformidade LGPD</span>
                </div>
              </button>

              {/* Budgets Tab (Blocked for Receptionists) */}
              <button
                onClick={() => {
                  if (isReceptionist) return;
                  setActiveTab('budgets');
                }}
                disabled={isReceptionist}
                className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-colors ${
                  isReceptionist ? 'opacity-40 cursor-not-allowed' : ''
                } ${
                  activeTab === 'budgets'
                    ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/10'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-4.5 w-4.5 shrink-0" />
                  <div>
                    <p className="text-xs">Orçamentos Propostos</p>
                    <span className="text-[10px] opacity-75 font-normal">Valores e Custos do Paciente</span>
                  </div>
                </div>
                {isReceptionist && <Lock className="h-3 w-3 text-slate-400 shrink-0" />}
              </button>

              {/* QiDent Pricing Tab (Admin Only simulation) */}
              <button
                onClick={() => {
                  if (isReceptionist || isProfessional) return;
                  setActiveTab('pricing');
                }}
                disabled={isReceptionist || isProfessional}
                className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-colors ${
                  isReceptionist || isProfessional ? 'opacity-40 cursor-not-allowed' : ''
                } ${
                  activeTab === 'pricing'
                    ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/10'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calculator className="h-4.5 w-4.5 shrink-0" />
                  <div>
                    <p className="text-xs">Fórmula de Precificação</p>
                    <span className="text-[10px] opacity-75 font-normal">Parâmetros de Margem QiDent</span>
                  </div>
                </div>
                {(isReceptionist || isProfessional) && <Lock className="h-3 w-3 text-slate-400 shrink-0" />}
              </button>

              {/* Finance Tab (Restricted) */}
              <button
                onClick={() => {
                  if (isReceptionist) return;
                  setActiveTab('finance');
                }}
                disabled={isReceptionist}
                className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-colors ${
                  isReceptionist ? 'opacity-40 cursor-not-allowed' : ''
                } ${
                  activeTab === 'finance'
                    ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/10'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <PiggyBank className="h-4.5 w-4.5 shrink-0" />
                  <div>
                    <p className="text-xs">Financeiro e Caixa</p>
                    <span className="text-[10px] opacity-75 font-normal">Fluxos de despesa e receita</span>
                  </div>
                </div>
                {isReceptionist && <Lock className="h-3 w-3 text-slate-400 shrink-0" />}
              </button>

              {/* Admin/Settings Tab */}
              <button
                onClick={() => {
                  if (!isAdmin) return;
                  setActiveTab('admin');
                }}
                disabled={!isAdmin}
                className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-colors ${
                  !isAdmin ? 'opacity-40 cursor-not-allowed' : ''
                } ${
                  activeTab === 'admin'
                    ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/10'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-4.5 w-4.5 shrink-0" />
                  <div>
                    <p className="text-xs">Clínica & Colaboradores</p>
                    <span className="text-[10px] opacity-75 font-normal">Permissões e Auditoria</span>
                  </div>
                </div>
                {!isAdmin && <Lock className="h-3 w-3 text-slate-400 shrink-0" />}
              </button>

            </div>

            {/* Right details workspace column */}
            <div className="col-span-1 md:col-span-3 space-y-4">
              
              {activeTab === 'agenda' && (
                <AgendaPanel
                  tenantId={activeTenant.id}
                  appointments={appointments}
                  patients={patients}
                  procedures={procedures}
                  professionals={allUsers}
                  onRefresh={reloadData}
                  darkMode={darkMode}
                />
              )}

              {activeTab === 'patients' && (
                <PatientPanel
                  tenantId={activeTenant.id}
                  patients={patients}
                  professionals={allUsers}
                  onRefresh={reloadData}
                  darkMode={darkMode}
                />
              )}

              {activeTab === 'budgets' && (
                <BudgetPanel
                  tenantId={activeTenant.id}
                  budgets={budgets}
                  patients={patients}
                  procedures={procedures}
                  onRefresh={reloadData}
                  darkMode={darkMode}
                />
              )}

              {activeTab === 'pricing' && (
                <QiDentCalculator
                  tenantId={activeTenant.id}
                  procedures={procedures}
                  onRefreshProcedures={reloadData}
                  darkMode={darkMode}
                />
              )}

              {activeTab === 'finance' && (
                <FinancePanel
                  tenantId={activeTenant.id}
                  transactions={transactions}
                  onRefresh={reloadData}
                  darkMode={darkMode}
                />
              )}

              {/* Local Tenant Admin - adding collaborators and local audit trails */}
              {activeTab === 'admin' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Local collaborator list & creation (Left) */}
                  <div className={`col-span-1 lg:col-span-1 p-5 rounded-2xl border space-y-4 ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Users className="h-4.5 w-4.5 text-blue-500" />
                      <span>Gerenciar Staff</span>
                    </h4>

                    {/* Listing collaborators */}
                    <div className="space-y-2 border-b dark:border-slate-800 pb-4">
                      {allUsers.map((u) => {
                        let shortRole = u.role === 'clinic_admin' ? 'Dono' : u.role === 'receptionist' ? 'Recepção' : 'Profissional';
                        return (
                          <div key={u.id} className="p-2.5 rounded-lg border dark:border-slate-800 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold">{u.name}</p>
                              <span className="text-[10px] text-slate-500 font-mono">{u.email}</span>
                            </div>
                            <span className="text-[10px] bg-slate-500/10 text-slate-400 px-1.5 py-0.2 rounded font-semibold">{shortRole}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Registration input form */}
                    <form onSubmit={handleRegisterStaff} className="space-y-3 font-semibold text-xs text-slate-400">
                      <span className="text-[9px] uppercase tracking-wide font-mono block">Cadastrar Colaborador</span>
                      
                      <div>
                        <label className="block text-[9px] mb-0.5 uppercase">Nome Completo</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Dra. Juliana Reis"
                          value={newStaffName}
                          onChange={(e) => setNewStaffName(e.target.value)}
                          className={`w-full px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] mb-0.5 uppercase">E-mail</label>
                        <input
                          type="email"
                          required
                          placeholder="juliana@clinica.com"
                          value={newStaffEmail}
                          onChange={(e) => setNewStaffEmail(e.target.value)}
                          className={`w-full px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] mb-0.5 uppercase">Função</label>
                          <select
                            value={newStaffRole}
                            onChange={(e) => setNewStaffRole(e.target.value as any)}
                            className="w-full px-2 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent"
                          >
                            <option value="health_professional">Profissional</option>
                            <option value="receptionist">Recepção</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] mb-0.5 uppercase">Especialidade</label>
                          <input
                            type="text"
                            placeholder="Ex: Orto"
                            disabled={newStaffRole !== 'health_professional'}
                            value={newStaffSpecialty}
                            onChange={(e) => setNewStaffSpecialty(e.target.value)}
                            className={`w-full px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                            }`}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs mt-2 cursor-pointer"
                      >
                        Registrar Integrante
                      </button>
                    </form>
                  </div>

                  {/* Clinical and administrative Audit Trail logs specific to this clinical clinic tenant (Right) */}
                  <div className={`col-span-1 lg:col-span-2 p-5 rounded-2xl border space-y-4 ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1 border-b pb-2.5 dark:border-slate-800">
                      <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
                      <span>Logs de Auditoria Interna (LGPD Certificado)</span>
                    </h4>

                    <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                      {auditLogs.length === 0 ? (
                        <p className="text-xs text-slate-500 italic text-center py-6">Nenhum evento auditado.</p>
                      ) : (
                        auditLogs.map((log) => (
                          <div 
                            key={log.id} 
                            className={`p-3 rounded-xl border text-[11px] leading-relaxed relative font-mono ${
                              darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex justify-between border-b border-dashed dark:border-slate-800 pb-1 mb-1 text-slate-400 text-[10px]">
                              <span className="font-bold text-blue-500">[{log.action}]</span>
                              <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300">{log.details}</p>
                            <div className="text-[9px] text-slate-400 mt-2">
                              <span>Operador: {log.userName} ({log.userRole}) • IP: {log.ip}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        </>
      )}

    </div>
  );
}
