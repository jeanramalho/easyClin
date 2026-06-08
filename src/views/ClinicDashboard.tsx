/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Tenant, Patient, Appointment, Procedure, Budget, FinancialTransaction, AuditLog } from '../types';
import { dbObj } from '../services/db';

// Child panels
import DashboardPanel from '../components/DashboardPanel';
import AgendaPanel from '../components/AgendaPanel';
import PatientPanel from '../components/PatientPanel';
import BudgetPanel from '../components/BudgetPanel';
import QiDentCalculator from '../components/QiDentCalculator';
import FinancePanel from '../components/FinancePanel';

type TabId = 'dashboard' | 'agenda' | 'patients' | 'budgets' | 'pricing' | 'finance' | 'admin';

interface NavItem {
  id: TabId;
  label: string;
  icon: string;
  requiresRole?: ('clinic_admin' | 'health_professional' | 'receptionist')[];
  lockedFor?: ('receptionist' | 'health_professional')[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard',          icon: 'dashboard' },
  { id: 'agenda',    label: 'Agenda',              icon: 'calendar_today' },
  { id: 'patients',  label: 'Fichas e Prontuários',icon: 'groups' },
  { id: 'budgets',   label: 'Orçamentos',          icon: 'request_quote',      lockedFor: ['receptionist'] },
  { id: 'pricing',   label: 'Precificação (QiDent)',icon: 'calculate',          lockedFor: ['receptionist', 'health_professional'] },
  { id: 'finance',   label: 'Financeiro',          icon: 'payments',           lockedFor: ['receptionist'] },
  { id: 'admin',     label: 'Configurações',       icon: 'settings',           requiresRole: ['clinic_admin'] },
];

interface ClinicDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onRoleSwitch: (newUser: User) => void;
}

export default function ClinicDashboard({ currentUser, onLogout, onRoleSwitch }: ClinicDashboardProps) {
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [patients, setPatients]           = useState<Patient[]>([]);
  const [appointments, setAppointments]   = useState<Appointment[]>([]);
  const [procedures, setProcedures]       = useState<Procedure[]>([]);
  const [budgets, setBudgets]             = useState<Budget[]>([]);
  const [transactions, setTransactions]   = useState<FinancialTransaction[]>([]);
  const [auditLogs, setAuditLogs]         = useState<AuditLog[]>([]);
  const [allUsers, setAllUsers]           = useState<User[]>([]);

  const [activeTab, setActiveTab]         = useState<TabId>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Staff form
  const [newStaffName, setNewStaffName]         = useState('');
  const [newStaffEmail, setNewStaffEmail]       = useState('');
  const [newStaffRole, setNewStaffRole]         = useState<'health_professional' | 'receptionist'>('health_professional');
  const [newStaffSpecialty, setNewStaffSpecialty] = useState('');

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

  useEffect(() => { reloadData(); }, [currentUser]);

  if (!activeTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface text-on-surface">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-error">gpp_maybe</span>
          <p className="text-xs text-error font-extrabold uppercase tracking-widest">Sessão Corrompida</p>
          <h2 className="text-xl font-bold">Tenant não localizado</h2>
          <button onClick={onLogout} className="mt-4 px-4 py-2 border rounded-xl cursor-pointer">
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  const isReceptionist = currentUser.role === 'receptionist';
  const isProfessional  = currentUser.role === 'health_professional';
  const isAdmin         = currentUser.role === 'clinic_admin';

  const handleClearAtraso = () => {
    const updatedTenant: Tenant = {
      ...activeTenant,
      status: 'active',
      nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    dbObj.saveTenant(updatedTenant);
    dbObj.logAction(currentUser.id, currentUser.name, currentUser.role,
      'Liquidação Financeira Manual',
      'Liberou acesso comercial após regularização simulada de pagamento da mensalidade.',
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
      specialty: newStaffRole === 'health_professional' ? newStaffSpecialty : undefined,
    };
    dbObj.saveUser(newStaff);
    dbObj.logAction(currentUser.id, currentUser.name, currentUser.role,
      'Novo Membro Registrado',
      `Cadastrou novo colaborador ${newStaffName} com permissão "${newStaffRole}".`,
      activeTenant.id
    );
    setNewStaffName(''); setNewStaffEmail(''); setNewStaffSpecialty('');
    reloadData();
  };

  const simulatedStaffMembers = dbObj.getUsers().filter(u => u.tenantId === activeTenant.id);

  const isTabLocked = (item: NavItem): boolean => {
    if (item.requiresRole && !item.requiresRole.includes(currentUser.role as any)) return true;
    if (item.lockedFor?.includes(currentUser.role as any)) return true;
    return false;
  };

  const handleNavigate = (tab: string) => {
    const t = tab as TabId;
    const item = NAV_ITEMS.find(n => n.id === t);
    if (item && !isTabLocked(item)) {
      setActiveTab(t);
      setMobileSidebarOpen(false);
    }
  };

  // Tenant status color
  const statusColors: Record<string, string> = {
    active:    'bg-emerald-500/10 text-emerald-600',
    trial:     'bg-amber-500/10 text-amber-600',
    suspended: 'bg-rose-500/10 text-rose-600',
    default:   'bg-outline/10 text-outline',
  };
  const statusLabels: Record<string, string> = {
    active: 'Ativo', trial: 'Trial', suspended: 'Suspenso', pending: 'Pendente',
    overdue: 'Atrasado', cancelled: 'Cancelado',
  };

  return (
    <div className="min-h-screen flex bg-background text-on-background">

      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen z-40 w-64 
        bg-surface border-r border-outline-variant 
        flex flex-col py-6 px-4 shrink-0 
        transition-transform duration-300
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <span
              className="material-symbols-outlined text-on-primary text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              medical_services
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary leading-none">EasyClin</h1>
            <p className="text-[10px] text-on-surface-variant mt-0.5 tracking-wide">Health Management</p>
          </div>
        </div>

        {/* Tenant Info Card */}
        <div className="bg-surface-container rounded-xl p-3 mb-5 border border-outline-variant/40">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeTenant.logoUrl ? (
              <img
                src={activeTenant.logoUrl}
                alt={activeTenant.name}
                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-outline-variant"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {activeTenant.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-on-surface truncate leading-tight">{activeTenant.name}</p>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase mt-0.5 inline-block ${statusColors[activeTenant.status] || statusColors.default}`}>
                {statusLabels[activeTenant.status] || activeTenant.status}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const locked  = isTabLocked(item);
            const active  = activeTab === item.id;
            return (
              <button
                key={item.id}
                disabled={locked}
                onClick={() => handleNavigate(item.id)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left
                  transition-colors focus:outline-none
                  ${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  ${active
                    ? 'bg-secondary-container text-primary font-bold border-r-4 border-primary'
                    : locked
                      ? 'text-on-surface-variant'
                      : 'text-secondary hover:bg-secondary-container/50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {locked && <span className="material-symbols-outlined text-[14px] text-outline">lock</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer: Role Switcher + Logout */}
        <div className="border-t border-outline-variant pt-4 mt-4 space-y-3">
          <div>
            <label className="text-[9px] font-bold text-outline uppercase tracking-wider block mb-1">
              Simulador de Papel
            </label>
            <select
              value={currentUser.id}
              onChange={e => {
                const matched = simulatedStaffMembers.find(m => m.id === e.target.value);
                if (matched) { onRoleSwitch(matched); setMobileSidebarOpen(false); }
              }}
              className="w-full text-xs bg-surface-container border border-outline-variant/60 p-2 rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {simulatedStaffMembers.map(m => {
                const roleLabel = m.role === 'clinic_admin' ? 'Dono' : m.role === 'receptionist' ? 'Recepção' : 'Profissional';
                return <option key={m.id} value={m.id}>{m.name} ({roleLabel})</option>;
              })}
            </select>
          </div>

          {/* Active User */}
          <div className="flex items-center gap-2.5 px-1">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-outline-variant shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-on-surface truncate">{currentUser.name}</p>
              <p className="text-[9px] text-on-surface-variant truncate">{currentUser.specialty || currentUser.role}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-2.5 bg-error/10 hover:bg-error/20 text-error rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Top Header */}
        <header className="h-16 border-b border-outline-variant bg-surface px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg md:hidden mr-2 cursor-pointer"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Search */}
          <div className="relative w-80 hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              type="text"
              placeholder="Buscar pacientes, consultas..."
              className="w-full pl-9 pr-4 py-1.5 bg-surface-container-low border-none rounded-full text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 ml-auto">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-lg text-sm font-semibold hover:bg-primary-fixed/20 transition-colors">
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              Novo Paciente
            </button>
            <button
              onClick={() => handleNavigate('agenda')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span className="hidden sm:inline">Novo Agendamento</span>
            </button>

            <div className="h-6 w-px bg-outline-variant" />

            <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full relative cursor-pointer">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-surface" />
            </button>

            {/* User avatar */}
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-9 h-9 object-cover rounded-full border border-outline-variant cursor-pointer"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-outline-variant cursor-pointer">
                {currentUser.name.charAt(0)}
              </div>
            )}
          </div>
        </header>

        {/* ===== WORKSPACE ===== */}
        {activeTenant.status === 'suspended' ? (
          /* Suspended Screen */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full p-8 rounded-2xl border border-outline-variant bg-surface-container-lowest text-center space-y-6 shadow-2xl">
              <div className="mx-auto w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'wght' 500" }}>gpp_maybe</span>
              </div>
              <div className="space-y-2">
                <span className="bg-error/10 text-error border border-error/20 text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full">
                  ACESSO SUSPENSO AUTOMATICAMENTE
                </span>
                <h2 className="text-xl font-bold">Faturamento Vencido há +15 dias</h2>
                <p className="text-on-surface-variant text-xs leading-relaxed">
                  Olá, <strong>{activeTenant.ownerName}</strong>. O faturamento mensal do EasyClin referente à clínica{' '}
                  <strong>{activeTenant.name}</strong> não foi conciliado.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 space-y-3">
                <p className="text-[10px] text-on-surface-variant font-medium leading-tight">
                  Administrador de homologação — liquidar pagamento fictício para testar liberação:
                </p>
                <button
                  onClick={handleClearAtraso}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-2.5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Registrar Pagamento Simulado
                </button>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-1.5 border border-outline-variant hover:bg-surface-container rounded-xl text-xs font-semibold cursor-pointer"
              >
                Voltar à escolha de perfil
              </button>
            </div>
          </div>
        ) : (
          <main className="flex-1 p-6 max-w-[1440px] w-full mx-auto space-y-0">

            {/* Trial Banner */}
            {activeTenant.status === 'trial' && (
              <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-600">info</span>
                <p className="text-xs text-amber-800 font-medium">
                  <strong>Modo Trial Ativo:</strong> Seu período de teste vai até{' '}
                  {new Date(activeTenant.trialEndsAt).toLocaleDateString('pt-BR')}.
                  Após isso, será necessário assinar um plano.
                </p>
              </div>
            )}

            {/* Active Panel */}
            {activeTab === 'dashboard' && (
              <DashboardPanel
                patients={patients}
                appointments={appointments}
                budgets={budgets}
                transactions={transactions}
                procedures={procedures}
                professionals={allUsers}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'agenda' && (
              <AgendaPanel
                tenantId={activeTenant.id}
                appointments={appointments}
                patients={patients}
                procedures={procedures}
                professionals={allUsers}
                onRefresh={reloadData}
                darkMode={false}
              />
            )}

            {activeTab === 'patients' && (
              <PatientPanel
                tenantId={activeTenant.id}
                patients={patients}
                professionals={allUsers}
                onRefresh={reloadData}
                darkMode={false}
              />
            )}

            {activeTab === 'budgets' && (
              <BudgetPanel
                tenantId={activeTenant.id}
                budgets={budgets}
                patients={patients}
                procedures={procedures}
                onRefresh={reloadData}
                darkMode={false}
              />
            )}

            {activeTab === 'pricing' && (
              <QiDentCalculator
                tenantId={activeTenant.id}
                procedures={procedures}
                onRefreshProcedures={reloadData}
                darkMode={false}
              />
            )}

            {activeTab === 'finance' && (
              <FinancePanel
                tenantId={activeTenant.id}
                transactions={transactions}
                onRefresh={reloadData}
                darkMode={false}
              />
            )}

            {activeTab === 'admin' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Collaborator list + form */}
                <div className="col-span-1 p-6 rounded-xl border border-outline-variant bg-surface-container-lowest space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-outline flex items-center gap-2 border-b border-outline-variant pb-2.5">
                    <span className="material-symbols-outlined text-primary text-[16px]">group</span>
                    Gerenciar Colaboradores
                  </h4>

                  {/* List */}
                  <div className="space-y-2 border-b pb-4 max-h-52 overflow-y-auto pr-1">
                    {allUsers.map(u => {
                      const roleLabel = u.role === 'clinic_admin' ? 'Dono' : u.role === 'receptionist' ? 'Recepção' : 'Profissional';
                      return (
                        <div key={u.id} className="p-3 rounded-lg border border-outline-variant/60 flex justify-between items-center text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-on-surface truncate">{u.name}</p>
                            <span className="text-[10px] text-outline font-mono truncate block">{u.email}</span>
                          </div>
                          <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold shrink-0 uppercase">{roleLabel}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleRegisterStaff} className="space-y-3 text-xs">
                    <span className="text-[10px] uppercase tracking-wide font-mono text-outline block font-semibold">Novo Colaborador</span>

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase text-on-surface-variant font-semibold">Nome Completo</label>
                      <input
                        type="text" required
                        placeholder="Ex: Dra. Juliana Reis"
                        value={newStaffName}
                        onChange={e => setNewStaffName(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase text-on-surface-variant font-semibold">E-mail</label>
                      <input
                        type="email" required
                        placeholder="juliana@clinica.com"
                        value={newStaffEmail}
                        onChange={e => setNewStaffEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase text-on-surface-variant font-semibold">Função</label>
                        <select
                          value={newStaffRole}
                          onChange={e => setNewStaffRole(e.target.value as any)}
                          className="w-full px-2 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs"
                        >
                          <option value="health_professional">Profissional</option>
                          <option value="receptionist">Recepção</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase text-on-surface-variant font-semibold">Especialidade</label>
                        <input
                          type="text"
                          placeholder="Ex: Pediatria"
                          disabled={newStaffRole !== 'health_professional'}
                          value={newStaffSpecialty}
                          onChange={e => setNewStaffSpecialty(e.target.value)}
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs disabled:opacity-40 outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary hover:opacity-90 text-on-primary font-bold py-2.5 rounded-lg text-xs cursor-pointer transition-colors"
                    >
                      Registrar Integrante
                    </button>
                  </form>
                </div>

                {/* Audit Logs */}
                <div className="col-span-1 lg:col-span-2 p-6 rounded-xl border border-outline-variant bg-surface-container-lowest space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-outline flex items-center gap-2 border-b border-outline-variant pb-2.5">
                    <span className="material-symbols-outlined text-emerald-500 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_heart</span>
                    Logs de Auditoria Interna (LGPD Certificado)
                  </h4>
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {auditLogs.length === 0 ? (
                      <p className="text-xs text-outline italic text-center py-6">Nenhum evento auditado.</p>
                    ) : (
                      auditLogs.map(log => (
                        <div key={log.id} className="p-3.5 rounded-xl border border-outline-variant/65 text-[11px] leading-relaxed bg-surface-container-lowest">
                          <div className="flex justify-between border-b border-dashed border-outline-variant pb-1 mb-2 text-outline text-[10px] font-mono">
                            <span className="font-bold text-primary uppercase">[{log.action}]</span>
                            <span>
                              {new Date(log.timestamp).toLocaleDateString('pt-BR')}{' '}
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-on-surface font-medium">{log.details}</p>
                          <div className="text-[9px] text-outline mt-2 font-mono flex justify-between">
                            <span>Operador: <strong className="text-on-surface-variant">{log.userName}</strong> ({log.userRole})</span>
                            <span>IP: {log.ip}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
