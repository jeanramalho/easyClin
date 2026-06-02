/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Tenant, Patient, Appointment, Procedure, Budget, FinancialTransaction, AuditLog } from '../types';
import { dbObj } from '../services/db';

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

  // Mobile navigation drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface dark:bg-inverse-surface text-on-surface dark:text-inverse-on-surface">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-[48px] text-rose-500">gpp_maybe</span>
          <p className="text-xs text-rose-500 font-extrabold uppercase tracking-widest">Sessão Corrompida</p>
          <h2 className="text-xl font-bold mt-1">Tenant não localizado</h2>
          <button onClick={onLogout} className="mt-4 px-4 py-2 border rounded-xl cursor-pointer">Voltar ao Login</button>
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
    <div className="min-h-screen flex bg-background text-on-background transition-colors duration-300">
      
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* 1. Sidebar Left Navigation (aside) */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen z-40 w-[280px] bg-surface-container-lowest dark:bg-inverse-surface border-r border-outline-variant dark:border-outline/20 flex flex-col p-6 shrink-0 transition-transform duration-300 md:translate-x-0 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            medical_services
          </span>
          <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">EasyClin</span>
        </div>

        {/* Tenant Quick Info */}
        <div className="bg-surface-container dark:bg-inverse-surface rounded-xl p-3 mb-6 border border-outline-variant/30">
          <div className="flex items-center gap-3 min-w-0">
            {activeTenant.logoUrl ? (
              <img 
                src={activeTenant.logoUrl} 
                alt={activeTenant.name} 
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-outline-variant"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shrink-0">
                {activeTenant.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-body-md text-body-md text-on-surface font-semibold truncate leading-none mb-1">{activeTenant.name}</h3>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                activeTenant.status === 'active' 
                  ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' 
                  : activeTenant.status === 'trial' 
                  ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400' 
                  : 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
              }`}>
                {activeTenant.status}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Tabs */}
        <nav className="space-y-1 flex-1">
          <button
            onClick={() => {
              setActiveTab('agenda');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-title-sm text-title-sm text-left transition-colors cursor-pointer focus:outline-none ${
              activeTab === 'agenda'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container dark:hover:bg-inverse-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            <span>Agenda Central</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('patients');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-title-sm text-title-sm text-left transition-colors cursor-pointer focus:outline-none ${
              activeTab === 'patients'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container dark:hover:bg-inverse-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
            <span>Fichas e Prontuários</span>
          </button>

          <button
            disabled={isReceptionist}
            onClick={() => {
              setActiveTab('budgets');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-title-sm text-title-sm text-left transition-colors focus:outline-none ${
              isReceptionist ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-container dark:hover:bg-inverse-surface'
            } ${
              activeTab === 'budgets'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">description</span>
              <span>Orçamentos</span>
            </div>
            {isReceptionist && <span className="material-symbols-outlined text-sm text-outline">lock</span>}
          </button>

          <button
            disabled={isReceptionist || isProfessional}
            onClick={() => {
              setActiveTab('pricing');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-title-sm text-title-sm text-left transition-colors focus:outline-none ${
              isReceptionist || isProfessional ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-container dark:hover:bg-inverse-surface'
            } ${
              activeTab === 'pricing'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">calculate</span>
              <span>Precificação (QiDent)</span>
            </div>
            {(isReceptionist || isProfessional) && <span className="material-symbols-outlined text-sm text-outline">lock</span>}
          </button>

          <button
            disabled={isReceptionist}
            onClick={() => {
              setActiveTab('finance');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-title-sm text-title-sm text-left transition-colors focus:outline-none ${
              isReceptionist ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-container dark:hover:bg-inverse-surface'
            } ${
              activeTab === 'finance'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">payments</span>
              <span>Financeiro</span>
            </div>
            {isReceptionist && <span className="material-symbols-outlined text-sm text-outline">lock</span>}
          </button>

          <button
            disabled={!isAdmin}
            onClick={() => {
              setActiveTab('admin');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-title-sm text-title-sm text-left transition-colors focus:outline-none ${
              !isAdmin ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-container dark:hover:bg-inverse-surface'
            } ${
              activeTab === 'admin'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span>Configurações</span>
            </div>
            {!isAdmin && <span className="material-symbols-outlined text-sm text-outline">lock</span>}
          </button>
        </nav>

        {/* Sidebar Footer Developer Simulator */}
        <div className="border-t border-outline-variant dark:border-outline/20 pt-4 mt-auto space-y-4">
          <div className="space-y-1">
            <label className="font-label-sm text-[10px] text-outline uppercase tracking-wider block font-semibold">Simulador de Papel</label>
            <div className="relative">
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const matched = simulatedStaffMembers.find(m => m.id === e.target.value);
                  if (matched) {
                    onRoleSwitch(matched);
                    setMobileSidebarOpen(false);
                  }
                }}
                className="w-full text-xs bg-surface-container-low dark:bg-inverse-surface border border-outline-variant/60 dark:border-outline/40 p-2 rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
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
          </div>
          
          <button 
            onClick={onLogout} 
            className="w-full flex items-center justify-center gap-2 p-2.5 bg-error/10 hover:bg-error/20 text-error rounded-lg text-xs font-semibold cursor-pointer transition-colors focus:outline-none"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span>Sair do Consultório</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Workspace Layout Area (Right side) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        
        {/* Top Header bar */}
        <header className="h-16 border-b border-outline-variant dark:border-outline/20 bg-surface-container-lowest dark:bg-inverse-surface px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          
          {/* Mobile menu toggle */}
          <button 
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 text-on-surface-variant hover:bg-surface-container dark:hover:bg-inverse-surface rounded-lg md:hidden mr-2 cursor-pointer focus:outline-none"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Left pill search input */}
          <div className="relative w-[280px] group hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors text-[20px]">search</span>
            </div>
            <input 
              type="text" 
              placeholder="Buscar paciente..." 
              className="w-full pl-9 pr-4 py-1.5 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant dark:border-outline rounded-full font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all outline-none" 
            />
          </div>

          {/* Right actions and active profile */}
          <div className="flex items-center gap-4 ml-auto">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container dark:hover:bg-inverse-surface rounded-full transition-colors relative cursor-pointer focus:outline-none">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
            </button>

            <div className="h-6 w-px bg-outline-variant dark:bg-outline/20"></div>

            {/* User profile */}
            <div className="flex items-center gap-3">
              {currentUser.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.name} 
                  className="w-9 h-9 object-cover rounded-full shrink-0 border border-primary/10" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-outline-variant">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div className="text-left hidden md:block leading-none">
                <h4 className="font-body-md text-body-md font-semibold text-on-surface truncate max-w-[120px] mb-0.5">{currentUser.name}</h4>
                <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider block font-bold truncate max-w-[120px]">
                  {currentUser.role === 'clinic_admin' ? 'Dono/Administrador' : currentUser.role === 'receptionist' ? 'Recepção' : currentUser.specialty || 'Dentista'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* 3. Main Workspace Container Panel */}
        {activeTenant.status === 'suspended' ? (
          /* Locked Suspended Screen */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full p-8 rounded-2xl border border-outline-variant dark:border-outline/20 bg-surface-container-lowest dark:bg-inverse-surface text-center space-y-6 shadow-2xl">
              <div className="mx-auto w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'wght' 500" }}>gpp_maybe</span>
              </div>

              <div className="space-y-2">
                <span className="bg-error/10 text-error border border-error/20 text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full">
                  ACESSO SUSPENSO AUTOMATICAMENTE
                </span>
                <h2 className="text-xl font-bold">Faturamento Vencido há +15 dias</h2>
                <p className="text-outline text-xs leading-relaxed">
                  Olá, <strong>{activeTenant.ownerName}</strong>. O faturamento mensal do EasyClin Silver referente à clínica <strong>{activeTenant.name}</strong> não foi conciliado. Por motivos de segurança e conformidade LGPD, a operação comercial está suspensa.
                </p>
              </div>

              {/* Developer simulator unlock button */}
              <div className="p-4 rounded-xl bg-surface-container-low dark:bg-inverse-surface border border-outline-variant/60 dark:border-outline/20 space-y-3">
                <p className="text-[10px] text-on-surface-variant font-medium leading-tight">Como administrador de homologação, você pode liquidar este boleto fictício em 1 clique para testar as dependências instantâneas de liberação de login do SaaS:</p>
                
                <button
                  onClick={handleClearAtraso}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10 transition-transform active:scale-95 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                  <span>Registrar Pagamento Simulado</span>
                </button>
              </div>

              <button
                onClick={onLogout}
                className="px-4 py-1.5 border border-outline-variant hover:bg-surface-container rounded-xl text-xs font-semibold cursor-pointer focus:outline-none"
              >
                Voltar à escolha de perfil
              </button>
            </div>
          </div>
        ) : (
          /* Normal pathways screen Workspace */
          <main className="flex-1 p-6 space-y-6 max-w-[1440px] w-full mx-auto">
            
            {/* Summary statistics subheader widgets */}
            <div className="px-6 py-4 flex flex-wrap justify-between items-center gap-4 bg-surface-container-low dark:bg-slate-900/60 rounded-xl border border-outline-variant dark:border-outline/20">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-body-md text-on-surface-variant font-medium">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-base">group</span>
                  <span>Pacientes Cadastrados: <strong className="text-on-surface font-bold">{patients.length}</strong></span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-base">calendar_today</span>
                  <span>Consultas Hoje: <strong className="text-on-surface font-bold">{appointments.length}</strong></span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-base">calculate</span>
                  <span>Tratamentos Disponíveis: <strong className="text-on-surface font-bold">{procedures.length}</strong></span>
                </span>
              </div>
              
              {activeTenant.status === 'trial' && (
                <div className="bg-tertiary-container text-on-tertiary-container rounded-full px-3.5 py-1 flex items-center gap-1.5 font-semibold font-label-md text-label-md animate-pulse">
                  <span className="material-symbols-outlined text-base">info</span>
                  <span>Modo de Teste (Trial de 15 Dias)</span>
                </div>
              )}
            </div>

            {/* Render sub-panels based on selected tab */}
            <div className="min-h-0">
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

              {activeTab === 'admin' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Local collaborator list & creation (Left) */}
                  <div className="col-span-1 p-6 rounded-xl border border-outline-variant dark:border-outline/20 bg-surface-container-lowest dark:bg-inverse-surface space-y-4">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-outline flex items-center gap-2 border-b dark:border-outline/20 pb-2.5">
                      <span className="material-symbols-outlined text-primary text-base">group</span>
                      <span>Gerenciar Colaboradores</span>
                    </h4>

                    {/* Listing collaborators */}
                    <div className="space-y-2 border-b dark:border-outline/20 pb-4 max-h-[220px] overflow-y-auto pr-1">
                      {allUsers.map((u) => {
                        let shortRole = u.role === 'clinic_admin' ? 'Dono' : u.role === 'receptionist' ? 'Recepção' : 'Profissional';
                        return (
                          <div key={u.id} className="p-3 rounded-lg border border-outline-variant/60 dark:border-outline/40 flex justify-between items-center text-xs">
                            <div className="min-w-0">
                              <p className="font-bold text-on-surface truncate">{u.name}</p>
                              <span className="text-[10px] text-outline font-mono truncate block">{u.email}</span>
                            </div>
                            <span className="text-[9px] bg-primary/10 text-primary dark:text-primary-fixed-dim px-2 py-0.5 rounded font-semibold shrink-0 uppercase">{shortRole}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Registration input form */}
                    <form onSubmit={handleRegisterStaff} className="space-y-4 text-xs">
                      <span className="text-[10px] uppercase tracking-wide font-mono text-outline block font-semibold">Novo Colaborador</span>
                      
                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase text-on-surface-variant font-semibold">Nome Completo</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Dra. Juliana Reis"
                          value={newStaffName}
                          onChange={(e) => setNewStaffName(e.target.value)}
                          className="w-full px-3 py-2 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase text-on-surface-variant font-semibold">E-mail</label>
                        <input
                          type="email"
                          required
                          placeholder="juliana@clinica.com"
                          value={newStaffEmail}
                          onChange={(e) => setNewStaffEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[10px] uppercase text-on-surface-variant font-semibold">Função</label>
                          <select
                            value={newStaffRole}
                            onChange={(e) => setNewStaffRole(e.target.value as any)}
                            className="w-full px-2 py-2 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-lg text-xs"
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
                            onChange={(e) => setNewStaffSpecialty(e.target.value)}
                            className="w-full px-3 py-2 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-lg text-xs disabled:opacity-40 outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-2.5 rounded-lg text-xs mt-2 cursor-pointer transition-colors"
                      >
                        Registrar Integrante
                      </button>
                    </form>
                  </div>

                  {/* Clinical and administrative Audit Trail logs specific to this clinical clinic tenant (Right) */}
                  <div className="col-span-1 lg:col-span-2 p-6 rounded-xl border border-outline-variant dark:border-outline/20 bg-surface-container-lowest dark:bg-inverse-surface space-y-4">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-outline flex items-center gap-2 border-b dark:border-outline/20 pb-2.5">
                      <span className="material-symbols-outlined text-emerald-500 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>shield_heart</span>
                      <span>Logs de Auditoria Interna (LGPD Certificado)</span>
                    </h4>

                    <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                      {auditLogs.length === 0 ? (
                        <p className="text-xs text-outline italic text-center py-6">Nenhum evento auditado.</p>
                      ) : (
                        auditLogs.map((log) => (
                          <div 
                            key={log.id} 
                            className="p-3.5 rounded-xl border border-outline-variant/65 dark:border-outline/35 text-[11px] leading-relaxed relative bg-surface-container-lowest dark:bg-inverse-surface"
                          >
                            <div className="flex justify-between border-b border-dashed dark:border-outline/20 pb-1 mb-2 text-outline text-[10px] font-mono">
                              <span className="font-bold text-primary dark:text-primary-fixed-dim uppercase">[{log.action}]</span>
                              <span>{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-on-surface font-sans font-medium">{log.details}</p>
                            <div className="text-[9px] text-outline mt-2.5 font-mono flex items-center justify-between">
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
            </div>

          </main>
        )}

      </div>

    </div>
  );
}
