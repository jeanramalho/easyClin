/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { dbObj, PLANS } from '../services/db';
import { Tenant, AuditLog, User, SubscriptionStatus } from '../types';
import { 
  TrendingUp, Users, AlertTriangle, ShieldCheck, Search, Filter, 
  Ban, CheckCircle, RefreshCcw, Landmark, Clock, FileLock2, Lock, ListFilter, PlayCircle
} from 'lucide-react';

interface SuperAdminProps {
  currentUser: User;
  onLogout: () => void;
  darkMode: boolean;
}

export default function SuperAdmin({ currentUser, onLogout, darkMode }: SuperAdminProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'clinics' | 'audit'>('clinics');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Load database items on start
  useEffect(() => {
    setTenants(dbObj.getTenants());
    setAuditLogs(dbObj.getAuditLogs());
  }, []);

  // Recalculate metrics
  const activeCount = tenants.filter(t => t.status === 'active').length;
  const trialCount = tenants.filter(t => t.status === 'trial').length;
  const overdueCount = tenants.filter(t => t.status === 'overdue' || t.status === 'pending').length;
  const suspendedCount = tenants.filter(t => t.status === 'suspended').length;

  const totalMRR = tenants
    .filter(t => t.status === 'active')
    .reduce((sum, t) => {
      const plan = PLANS.find(p => p.id === t.planId);
      return sum + (plan ? plan.priceMonthly : 0);
    }, 0);

  // Functions to update tenant subscriptions
  const handleUpdateStatus = (tenantId: string, newStatus: SubscriptionStatus) => {
    const target = tenants.find(t => t.id === tenantId);
    if (!target) return;

    const oldStatus = target.status;
    const updatedTenant: Tenant = { ...target, status: newStatus };
    
    // Save to storage
    dbObj.saveTenant(updatedTenant);
    
    // Log the audit event
    dbObj.logAction(
      currentUser.id,
      currentUser.name,
      'super_admin',
      'Alteração de Plano / Status',
      `Alterou o status comercial do tenant "${target.name}" de "${oldStatus}" para "${newStatus}".`,
      'system'
    );

    // Refresh state
    setTenants(dbObj.getTenants());
    setAuditLogs(dbObj.getAuditLogs());
    if (selectedTenant && selectedTenant.id === tenantId) {
      setSelectedTenant(updatedTenant);
    }
  };

  const handleUpdatePlan = (tenantId: string, planId: string) => {
    const target = tenants.find(t => t.id === tenantId);
    const plan = PLANS.find(p => p.id === planId);
    if (!target || !plan) return;

    const oldPlanId = target.planId;
    const updatedTenant: Tenant = { ...target, planId };

    dbObj.saveTenant(updatedTenant);

    dbObj.logAction(
      currentUser.id,
      currentUser.name,
      'super_admin',
      'Upgrade/Downgrade de Plano',
      `Migrou o tenant "${target.name}" para o plano "${plan.name}" (R$ ${plan.priceMonthly}/mês).`,
      'system'
    );

    setTenants(dbObj.getTenants());
    setAuditLogs(dbObj.getAuditLogs());
    if (selectedTenant && selectedTenant.id === tenantId) {
      setSelectedTenant(updatedTenant);
    }
  };

  // Filter tenants
  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`min-h-screen py-6 px-4 md:px-8 transition-colors duration-300 ${
      darkMode ? 'bg-inverse-surface text-inverse-on-surface' : 'bg-surface text-on-surface'
    }`}>
      
      {/* Header Panel */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-5 mb-6 border-outline-variant dark:border-outline/20 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full">
              SaaS Executivo (Super-Admin)
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">EasyClin Cloud Platform</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Monitorando {tenants.length} clínicas parceiras. Licenciamento, inadimplência e auditoria sob a LGPD.
          </p>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold">{currentUser.name}</p>
            <p className="text-xs text-on-surface-variant font-mono">Suporte Global</p>
          </div>
          <button
            onClick={onLogout}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border hover:bg-surface-container/50 dark:hover:bg-inverse-surface/80 transition-colors"
          >
            Sair do Painel
          </button>
        </div>
      </div>

      {/* Grid of Key SaaS Metrics */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* MRR Card */}
        <div className={`p-6 rounded-2xl border transition-all ${
          darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Faturamento Estimado (MRR)</p>
              <h3 className="text-2xl font-bold mt-2 font-mono">R$ {totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3.5 bg-blue-500/10 rounded-xl text-blue-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 mt-3 font-semibold">
            <span>+12.4% este mês</span>
          </div>
        </div>

        {/* Total Clínicas Ativas Card */}
        <div className={`p-6 rounded-2xl border transition-all ${
          darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Clínicas Licenciadas</p>
              <h3 className="text-2xl font-bold mt-2 font-mono">
                {activeCount} <span className="text-sm font-normal text-on-surface-variant">ativas</span>
              </h3>
            </div>
            <div className="p-3.5 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-on-surface-variant mt-3">
            <span className="font-semibold text-yellow-500">{trialCount} em Trial</span>
            <span>•</span>
            <span className="font-semibold text-rose-500">{suspendedCount} bloqueadas</span>
          </div>
        </div>

        {/* Inadimplência Card */}
        <div className={`p-6 rounded-2xl border transition-all ${
          darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Atraso / Inadimplência</p>
              <h3 className="text-2xl font-bold mt-2 font-mono text-rose-500">
                {((overdueCount / (tenants.length || 1)) * 100).toFixed(0)}%
              </h3>
            </div>
            <div className="p-3.5 bg-rose-500/10 rounded-xl text-rose-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="text-[11px] text-on-surface-variant mt-3">
            <span>{overdueCount} faturamentos vencidos sem repasse</span>
          </div>
        </div>

        {/* Segurança & LGP-D Auditoria Card */}
        <div className={`p-6 rounded-2xl border transition-all ${
          darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Trilha de Auditoria (LGPD)</p>
              <h3 className="text-2xl font-bold mt-2 font-mono text-cyan-500">
                {auditLogs.length} <span className="text-xs font-normal text-on-surface-variant">eventos</span>
              </h3>
            </div>
            <div className="p-3.5 bg-cyan-500/10 rounded-xl text-cyan-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="text-[11px] text-emerald-500 mt-3 font-semibold flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Encriptação e Assinaturas PKI ok</span>
          </div>
        </div>

      </div>

      {/* Main Tab bar */}
      <div className="max-w-7xl mx-auto flex gap-4 border-b border-outline-variant dark:border-outline/20 mb-6">
        <button
          onClick={() => setActiveTab('clinics')}
          className={`pb-3 font-medium text-sm border-b-2 transition-all px-1 flex items-center gap-2 ${
            activeTab === 'clinics'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Landmark className="h-4 w-4" />
          <span>Gestão das Clínicas (Tenants)</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 font-medium text-sm border-b-2 transition-all px-1 flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <FileLock2 className="h-4 w-4" />
          <span>Auditoria Legal do Sistema</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === 'clinics' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Block: Tenant List */}
            <div className={`col-span-1 lg:col-span-2 p-6 rounded-2xl border transition-all ${
              darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
            }`}>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-lg font-bold">Base de Dados de Assinantes</h2>
                
                {/* Filters */}
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-on-surface-variant" />
                    <input
                      type="text"
                      placeholder="Buscar clínica..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-9 pr-4 py-2 border rounded-xl text-xs w-45 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        darkMode ? 'bg-inverse-surface border-outline/20 text-inverse-on-surface' : 'bg-surface-container-lowest border-outline-variant text-on-surface'
                      }`}
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      darkMode ? 'bg-inverse-surface border-outline/20 text-inverse-on-surface' : 'bg-surface-container-lowest border-outline-variant text-on-surface'
                    }`}
                  >
                    <option value="all">Todos status</option>
                    <option value="active">Ativo</option>
                    <option value="trial">Trial</option>
                    <option value="suspended">Suspenso</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant dark:border-outline/20 text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                      <th className="pb-3 text-left">Clínica / Responsável</th>
                      <th className="pb-3 text-left">Plano Contratado</th>
                      <th className="pb-3 text-left">Status Financeiro</th>
                      <th className="pb-3 text-left">Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant dark:divide-outline/20 text-xs">
                    {filteredTenants.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-on-surface-variant">Nenhuma clínica encontrada.</td>
                      </tr>
                    ) : (
                      filteredTenants.map((t) => {
                        const plan = PLANS.find(p => p.id === t.planId);
                        
                        return (
                          <tr 
                            key={t.id} 
                            onClick={() => setSelectedTenant(t)}
                            className={`group cursor-pointer hover:bg-surface-container/50 dark:hover:bg-inverse-surface/40 transition-colors ${
                              selectedTenant?.id === t.id ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                            }`}
                          >
                            <td className="py-3.5 pr-3">
                              <div className="flex items-center gap-3">
                                {t.logoUrl ? (
                                  <img 
                                    src={t.logoUrl} 
                                    alt={t.name} 
                                    className="w-10 h-10 object-cover rounded-xl"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-600 font-bold">
                                    {t.name.charAt(0)}
                                  </div>
                                )}
                                <div className="truncate max-w-42.5">
                                  <p className="font-semibold text-on-surface dark:text-inverse-on-surface">{t.name}</p>
                                  <p className="text-[10px] text-on-surface-variant truncate">{t.ownerName} • {t.ownerEmail}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 pr-3">
                              <p className="font-medium">{plan ? plan.name : 'Plano Custom'}</p>
                              <p className="text-[10px] text-on-surface-variant font-mono">R$ {plan ? plan.priceMonthly : 0}/mês</p>
                            </td>
                            <td className="py-3.5 pr-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                t.status === 'active' 
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                                  : t.status === 'trial' 
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
                                  : t.status === 'suspended'
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                  : 'bg-surface-container-low text-on-surface dark:text-on-surface-variant'
                              }`}>
                                <span className="h-1 w-1 rounded-full bg-current"></span>
                                {t.status === 'active' ? 'Ativo / Pago' : t.status === 'trial' ? 'Período Trial' : t.status === 'suspended' ? 'Suspenso' : 'Cancelado'}
                              </span>
                              <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">Venc: {new Date(t.nextBillingAt).toLocaleDateString('pt-BR')}</p>
                            </td>
                            <td className="py-3.5" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-1.5">
                                {t.status === 'suspended' ? (
                                  <button
                                    onClick={() => handleUpdateStatus(t.id, 'active')}
                                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]"
                                    title="Reativar e Liberar Acesso"
                                  >
                                    Reativar
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUpdateStatus(t.id, 'suspended')}
                                    className="px-2.5 py-1 rounded bg-surface-container-lowest dark:bg-inverse-surface hover:bg-rose-600 hover:text-white transition-colors text-[10px]"
                                    title="Suspender Acesso"
                                  >
                                    Bloquear
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Block: Selected Tenant Actions / Plan management */}
            <div className="col-span-1">
              {selectedTenant ? (
                <div className={`p-6 rounded-2xl border transition-all sticky top-6 ${
                  darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
                }`}>
                  <h3 className="text-md font-bold mb-4 flex items-center gap-1.5">
                    <Landmark className="h-4.5 w-4.5 text-blue-500" />
                    <span>Detalhes do Tenant</span>
                  </h3>

                  <div className="space-y-4 pb-4 border-b border-outline-variant dark:border-outline/20">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider">Identificador Único</p>
                      <p className="text-xs font-mono">{selectedTenant.id}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider">Nome da Clínica / CNPJ</p>
                      <p className="text-sm font-semibold">{selectedTenant.name}</p>
                      <p className="text-xs text-on-surface-variant">{selectedTenant.cnpj || 'CNPJ Não Cadastrado'}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider">Admin Responsável</p>
                      <p className="text-xs font-medium">{selectedTenant.ownerName} ({selectedTenant.ownerEmail})</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider">Informações da Assinatura</p>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-on-surface-variant">Início:</span>
                        <span className="font-mono">{new Date(selectedTenant.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-on-surface-variant">Fim Trial:</span>
                        <span className="font-mono">{new Date(selectedTenant.trialEndsAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Manual administrative actions */}
                  <div className="py-4 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Comandos de Licenciamento</h4>
                    
                    {/* Alter status directly */}
                    <div>
                      <label className="block text-[11px] mb-1.5 text-on-surface-variant">Alterar Status Comercial</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleUpdateStatus(selectedTenant.id, 'active')}
                          className={`py-1.5 px-2 rounded-lg text-[10px] border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                            selectedTenant.status === 'active' 
                              ? 'bg-emerald-500 text-white border-emerald-500' 
                              : 'bg-transparent border-outline-variant dark:border-outline/20 hover:bg-surface-container/50 dark:hover:bg-inverse-surface'
                          }`}
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Ativar Integral</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedTenant.id, 'trial')}
                          className={`py-1.5 px-2 rounded-lg text-[10px] border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                            selectedTenant.status === 'trial' 
                              ? 'bg-amber-500 text-white border-amber-500' 
                              : 'bg-transparent border-outline-variant dark:border-outline/20 hover:bg-surface-container/50 dark:hover:bg-inverse-surface'
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          <span>Modo Trial</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedTenant.id, 'suspended')}
                          className={`py-1.5 px-2 rounded-lg text-[10px] border font-semibold flex items-center justify-center gap-1.5 transition-colors col-span-2 ${
                            selectedTenant.status === 'suspended' 
                              ? 'bg-rose-500 text-white border-rose-500' 
                              : 'bg-transparent border-outline-variant dark:border-outline/20 hover:bg-surface-container/50 dark:hover:bg-inverse-surface'
                          }`}
                        >
                          <Lock className="h-3 w-3" />
                          <span>Suspender (Bloquear Acesso)</span>
                        </button>
                      </div>
                    </div>

                    {/* Change plan */}
                    <div>
                      <label className="block text-[11px] mb-1.5 text-on-surface-variant">Atribuir Plano Comercial</label>
                      <div className="space-y-1.5">
                        {PLANS.map((plan) => (
                          <button
                            key={plan.id}
                            onClick={() => handleUpdatePlan(selectedTenant.id, plan.id)}
                            className={`w-full p-2.5 rounded-xl border text-left flex justify-between items-center transition-colors ${
                              selectedTenant.planId === plan.id
                                ? 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400'
                                : 'border-outline-variant dark:border-outline/20 hover:bg-surface-container/50 dark:hover:bg-inverse-surface'
                            }`}
                          >
                            <div>
                              <p className="text-xs font-semibold">{plan.name}</p>
                              <p className="text-[10px] text-on-surface-variant">Até {plan.maxProfessionals} Profissionais</p>
                            </div>
                            <span className="text-xs font-bold font-mono">R$ {plan.priceMonthly}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              ) : (
                <div className={`p-8 rounded-2xl border border-dashed text-center flex flex-col items-center justify-center ${
                  darkMode ? 'bg-inverse-surface border-outline/20 text-on-surface-variant' : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant'
                }`}>
                  <Landmark className="h-10 w-10 text-on-surface-variant mb-2.5" />
                  <p className="text-xs font-semibold">Nenhuma clínica selecionada</p>
                  <p className="text-[11px] text-on-surface-variant mt-1 max-w-50 mx-auto">
                    Selecione uma clínica na tabela ao lado para gerenciar licenças, status e planos.
                  </p>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* AUDIT TAB - Compliance and security ledger */
          <div className={`p-6 rounded-2xl border transition-all ${
            darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-500" />
                  <span>Trilha de Auditoria Geral (LGPD Compliant)</span>
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  De acordo com a Lei Geral de Proteção de Dados, todas as criações, bloqueios de registros clínicos e suspensões comerciais são persistidos em ledger imutável.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAuditLogs(dbObj.getAuditLogs());
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 hover:bg-surface-container/20 dark:hover:bg-inverse-surface/40"
                >
                  <RefreshCcw className="h-3 w-3" />
                  <span>Atualizar Logs</span>
                </button>
              </div>
            </div>

            {/* Logs List representation */}
            <div className="space-y-3 font-mono">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-6">Nenhum evento registrado na auditoria.</p>
              ) : (
                auditLogs.map((log) => {
                  let alertTheme = 'text-on-surface-variant';
                  if (log.action.includes('Bloqueio') || log.action.includes('LGP-D')) {
                    alertTheme = 'text-cyan-400 font-semibold';
                  } else if (log.action.includes('Alteração') || log.action.includes('Excluir')) {
                    alertTheme = 'text-yellow-400';
                  } else if (log.action.includes('Login')) {
                    alertTheme = 'text-blue-400';
                  }

                  return (
                    <div 
                      key={log.id} 
                      className={`p-3.5 rounded-xl border text-xs leading-relaxed transition-all ${
                        darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between gap-1 mb-2 border-b border-dashed border-outline-variant dark:border-outline/20 pb-1.5">
                        <span className={`uppercase font-bold tracking-wider ${alertTheme}`}>
                          [{log.action}]
                        </span>
                        <span className="text-[10px] text-on-surface-variant">{log.timestamp}</span>
                      </div>
                      <p className="text-on-surface dark:text-inverse-on-surface">{log.details}</p>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-on-surface-variant font-semibold pt-1 border-t border-dashed border-outline-variant dark:border-outline/20">
                        <span>Usuário: {log.userName} ({log.userRole})</span>
                        <span>•</span>
                        <span>IP de Referência: {log.ip}</span>
                        <span>•</span>
                        <span>Tenant ID: <span className="text-blue-500">{log.tenantId || 'SISTEMA'}</span></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
