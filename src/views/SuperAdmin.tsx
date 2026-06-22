/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { dbObj, PLANS } from '../services/db';
import { AuditLog, Plan, SubscriptionStatus, Tenant, User } from '../types';
import { Button, Card, EasyClinMark } from '../components/ui';

interface SuperAdminProps {
  currentUser: User;
  onLogout: () => void;
}

type AdminTab = 'clinics' | 'audit';
type StatusFilter = SubscriptionStatus | 'all';

const statusLabels: Record<SubscriptionStatus, string> = {
  trial: 'Teste',
  active: 'Ativa',
  pending: 'Pendente',
  overdue: 'Inadimplente',
  suspended: 'Suspensa',
  cancelled: 'Cancelada',
};

const statusStyles: Record<SubscriptionStatus, string> = {
  trial: 'bg-primary/10 text-primary border-primary/20',
  active: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  overdue: 'bg-error/10 text-error border-error/20',
  suspended: 'bg-error/10 text-error border-error/20',
  cancelled: 'bg-surface-container text-on-surface-variant border-outline-variant',
};

const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const getInitials = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');

export default function SuperAdmin({ currentUser, onLogout }: SuperAdminProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [activeTab, setActiveTab] = useState<AdminTab>('clinics');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    const loadedTenants = dbObj.getTenants();
    setTenants(loadedTenants);
    setAuditLogs(dbObj.getAuditLogs());
    setSelectedTenant(current => current || loadedTenants[0] || null);
  }, []);

  const refreshAdminData = (tenantId?: string) => {
    const nextTenants = dbObj.getTenants();
    const nextLogs = dbObj.getAuditLogs();
    setTenants(nextTenants);
    setAuditLogs(nextLogs);

    if (tenantId) {
      setSelectedTenant(nextTenants.find(tenant => tenant.id === tenantId) || null);
      return;
    }

    if (selectedTenant) {
      setSelectedTenant(nextTenants.find(tenant => tenant.id === selectedTenant.id) || nextTenants[0] || null);
    }
  };

  const metrics = useMemo(() => {
    const activeCount = tenants.filter(t => t.status === 'active').length;
    const trialCount = tenants.filter(t => t.status === 'trial').length;
    const overdueCount = tenants.filter(t => t.status === 'overdue' || t.status === 'pending').length;
    const suspendedCount = tenants.filter(t => t.status === 'suspended').length;
    const cancelledCount = tenants.filter(t => t.status === 'cancelled').length;
    const totalMRR = tenants
      .filter(t => t.status === 'active')
      .reduce((sum, tenant) => sum + getPlanPrice(tenant.planId), 0);
    const churnRate = tenants.length > 0 ? ((cancelledCount + suspendedCount) / tenants.length) * 100 : 0;

    return {
      activeCount,
      trialCount,
      overdueCount,
      suspendedCount,
      totalMRR,
      churnRate,
      activationRate: tenants.length > 0 ? (activeCount / tenants.length) * 100 : 0,
    };
  }, [tenants]);

  const filteredTenants = tenants.filter(tenant => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      tenant.name.toLowerCase().includes(query) ||
      tenant.ownerName.toLowerCase().includes(query) ||
      tenant.ownerEmail.toLowerCase().includes(query) ||
      tenant.id.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedPlan = selectedTenant ? PLANS.find(plan => plan.id === selectedTenant.planId) : undefined;
  const recentLogs = auditLogs.slice(0, 4);

  const handleUpdateStatus = (tenantId: string, newStatus: SubscriptionStatus) => {
    const target = tenants.find(t => t.id === tenantId);
    if (!target) return;

    const updatedTenant: Tenant = { ...target, status: newStatus };
    dbObj.saveTenant(updatedTenant);
    dbObj.logAction(
      currentUser.id,
      currentUser.name,
      'super_admin',
      'Alteração de Plano / Status',
      `Alterou o status comercial do tenant "${target.name}" de "${target.status}" para "${newStatus}".`,
      'system'
    );
    refreshAdminData(tenantId);
  };

  const handleUpdatePlan = (tenantId: string, planId: string) => {
    const target = tenants.find(t => t.id === tenantId);
    const plan = PLANS.find(p => p.id === planId);
    if (!target || !plan) return;

    const updatedTenant: Tenant = { ...target, planId };
    dbObj.saveTenant(updatedTenant);
    dbObj.logAction(
      currentUser.id,
      currentUser.name,
      'super_admin',
      'Upgrade/Downgrade de Plano',
      `Migrou o tenant "${target.name}" para o plano "${plan.name}" (${currency(plan.priceMonthly)}/mês).`,
      'system'
    );
    refreshAdminData(tenantId);
  };

  return (
    <div className="min-h-screen bg-surface px-4 py-6 text-on-surface md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-outline-variant pb-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-2 sm:block">
              <div className="h-9 w-9">
                <EasyClinMark />
              </div>
            </div>
            <div>
              <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary">
                SaaS Executivo (Super Admin)
              </span>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">EasyClin Cloud Platform</h1>
              <p className="mt-1 text-sm text-on-surface-variant">
                Licenciamento, assinaturas, inadimplência e auditoria LGPD para {tenants.length} clínicas parceiras.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">{currentUser.name}</p>
              <p className="font-mono text-xs text-on-surface-variant">Suporte Global</p>
            </div>
            <Button type="button" variant="secondary" size="sm" className="rounded-lg" onClick={onLogout}>
              Sair do Painel
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon="payments"
            label="MRR Atual"
            value={currency(metrics.totalMRR)}
            helper={`${metrics.activeCount} clínicas pagantes`}
            tone="primary"
            progress={metrics.activationRate}
          />
          <MetricCard
            icon="apartment"
            label="Clínicas Ativas"
            value={String(metrics.activeCount)}
            helper={`${metrics.trialCount} trials em andamento`}
            tone="success"
          />
          <MetricCard
            icon="person_remove"
            label="Risco / Churn"
            value={`${metrics.churnRate.toFixed(1)}%`}
            helper={`${metrics.suspendedCount} suspensas ou canceladas`}
            tone={metrics.churnRate > 12 ? 'error' : 'warning'}
          />
          <MetricCard
            icon="pending_actions"
            label="Ativações Pendentes"
            value={String(metrics.overdueCount)}
            helper="Pendências e inadimplência"
            tone={metrics.overdueCount > 0 ? 'error' : 'success'}
          />
        </section>

        <nav className="flex gap-4 border-b border-outline-variant">
          <TabButton active={activeTab === 'clinics'} icon="domain" onClick={() => setActiveTab('clinics')}>
            Gestão das Clínicas
          </TabButton>
          <TabButton active={activeTab === 'audit'} icon="admin_panel_settings" onClick={() => setActiveTab('audit')}>
            Auditoria Legal
          </TabButton>
        </nav>

        {activeTab === 'clinics' ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,8fr)_minmax(340px,4fr)]">
            <Card className="min-w-0">
              <div className="flex flex-col gap-4 border-b border-outline-variant bg-surface-container-lowest px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-bold text-on-surface">Listagem de Clínicas</h2>
                  <p className="mt-0.5 text-xs text-outline">
                    {filteredTenants.length} tenant{filteredTenants.length !== 1 ? 's' : ''} encontrado{filteredTenants.length !== 1 ? 's' : ''}.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative sm:w-72">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">search</span>
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar clínica, gestor ou ID..."
                      className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 pl-10 text-sm text-on-surface placeholder-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">Todos os status</option>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredTenants.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <span className="material-symbols-outlined mb-3 text-5xl text-outline">domain_disabled</span>
                  <h3 className="text-sm font-semibold text-on-surface-variant">Nenhuma clínica encontrada</h3>
                  <p className="mt-1 max-w-sm text-xs text-outline">Ajuste a busca ou o filtro de status para ampliar a listagem.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-xs">
                    <thead className="bg-surface-container-low text-[10px] font-bold uppercase tracking-wider text-outline">
                      <tr>
                        <th className="px-5 py-3">Clínica / ID</th>
                        <th className="px-5 py-3">Gestor</th>
                        <th className="px-5 py-3">Plano</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Renovação</th>
                        <th className="px-5 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {filteredTenants.map((tenant) => {
                        const plan = PLANS.find(p => p.id === tenant.planId);
                        const isSelected = selectedTenant?.id === tenant.id;

                        return (
                          <tr
                            key={tenant.id}
                            onClick={() => setSelectedTenant(tenant)}
                            className={`cursor-pointer transition-colors hover:bg-surface-container-low/50 ${isSelected ? 'bg-primary/5' : ''}`}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {tenant.logoUrl ? (
                                  <img
                                    src={tenant.logoUrl}
                                    alt={tenant.name}
                                    className="h-10 w-10 rounded-lg object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed font-bold text-primary">
                                    {getInitials(tenant.name)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="truncate font-bold text-on-surface">{tenant.name}</p>
                                  <p className="font-mono text-[10px] text-outline">ID: {tenant.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-semibold text-on-surface-variant">{tenant.ownerName}</p>
                              <p className="truncate text-[10px] text-outline">{tenant.ownerEmail}</p>
                            </td>
                            <td className="px-5 py-4">
                              <PlanPill plan={plan} />
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge status={tenant.status} />
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-mono text-on-surface">{formatDate(tenant.nextBillingAt)}</p>
                              <p className="text-[10px] text-outline">Trial ate {formatDate(tenant.trialEndsAt)}</p>
                            </td>
                            <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedTenant(tenant)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-outline transition-colors hover:bg-primary/10 hover:text-primary"
                                  title="Gerenciar clínica"
                                >
                                  <span className="material-symbols-outlined text-[18px]">settings_applications</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(tenant.id, tenant.status === 'suspended' ? 'active' : 'suspended')}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-outline transition-colors hover:bg-error/10 hover:text-error"
                                  title={tenant.status === 'suspended' ? 'Reativar clínica' : 'Suspender clínica'}
                                >
                                  <span className="material-symbols-outlined text-[18px]">{tenant.status === 'suspended' ? 'lock_open' : 'block'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface-container-low px-5 py-4 text-sm text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
                <span>Mostrando {filteredTenants.length} de {tenants.length} clínicas</span>
                <div className="flex items-center gap-1">
                  <button type="button" className="flex h-8 w-8 items-center justify-center rounded text-outline opacity-40" disabled>
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button type="button" className="flex h-8 w-8 items-center justify-center rounded bg-primary font-bold text-on-primary">1</button>
                  <button type="button" className="flex h-8 w-8 items-center justify-center rounded text-on-surface-variant hover:bg-surface-container">2</button>
                  <button type="button" className="flex h-8 w-8 items-center justify-center rounded text-on-surface-variant hover:bg-surface-container">3</button>
                  <button type="button" className="flex h-8 w-8 items-center justify-center rounded text-on-surface-variant hover:bg-surface-container">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            </Card>

            <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              {selectedTenant ? (
                <>
                  <Card className="overflow-hidden">
                    <div className="bg-primary-container p-6 text-on-primary-container">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="rounded-md bg-on-primary/20 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-on-primary">Plano Atual</span>
                          <h3 className="mt-2 text-2xl font-bold">{selectedPlan?.name || 'Plano Custom'}</h3>
                          <p className="mt-1 text-sm text-on-primary-container/80">
                            Renovação em {formatDate(selectedTenant.nextBillingAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs opacity-80">Mensal</p>
                          <p className="font-mono text-xl font-bold">{currency(selectedPlan?.priceMonthly || 0)}</p>
                        </div>
                      </div>
                      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-on-primary/20 pt-5">
                        <PlanFact label="Usuários" value={`Até ${selectedPlan?.maxProfessionals || 0}`} />
                        <PlanFact label="Status" value={statusLabels[selectedTenant.status]} />
                        <PlanFact label="Saldo" value={currency(selectedTenant.balance)} />
                      </div>
                    </div>

                    <div className="space-y-5 p-5">
                      <div>
                        <h4 className="text-base font-bold text-on-surface">{selectedTenant.name}</h4>
                        <p className="text-xs text-on-surface-variant">{selectedTenant.cnpj || 'CNPJ não cadastrado'}</p>
                        <p className="mt-2 text-xs text-on-surface-variant">
                          Responsável: <span className="font-semibold text-on-surface">{selectedTenant.ownerName}</span>
                        </p>
                      </div>

                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-outline">Status Comercial</p>
                        <div className="grid grid-cols-2 gap-2">
                          <StatusAction status="active" current={selectedTenant.status} onClick={() => handleUpdateStatus(selectedTenant.id, 'active')} />
                          <StatusAction status="trial" current={selectedTenant.status} onClick={() => handleUpdateStatus(selectedTenant.id, 'trial')} />
                          <StatusAction status="overdue" current={selectedTenant.status} onClick={() => handleUpdateStatus(selectedTenant.id, 'overdue')} />
                          <StatusAction status="suspended" current={selectedTenant.status} onClick={() => handleUpdateStatus(selectedTenant.id, 'suspended')} />
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-outline">Planos Comerciais</p>
                        <div className="space-y-2">
                          {PLANS.map(plan => (
                            <PlanOption
                              key={plan.id}
                              plan={plan}
                              active={selectedTenant.planId === plan.id}
                              onClick={() => handleUpdatePlan(selectedTenant.id, plan.id)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-base font-bold text-on-surface">Método de Pagamento</h3>
                      <button type="button" className="text-sm font-bold text-primary hover:underline">Editar</button>
                    </div>
                    <div className="flex items-center gap-4 rounded-xl bg-surface-container-low p-4">
                      <span className="material-symbols-outlined rounded bg-inverse-surface p-2 text-inverse-on-surface">credit_card</span>
                      <div>
                        <p className="text-sm font-bold">•••• •••• •••• 4242</p>
                        <p className="text-xs text-on-surface-variant">Faturas enviadas para {selectedTenant.ownerEmail}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 border-t border-outline-variant pt-4 text-xs font-medium text-primary">
                      <span className="material-symbols-outlined text-[16px]">lock</span>
                      Pagamento seguro e auditado
                    </div>
                  </Card>
                </>
              ) : (
                <Card className="flex min-h-[360px] flex-col items-center justify-center border-dashed p-8 text-center">
                  <span className="material-symbols-outlined mb-3 text-5xl text-outline">domain</span>
                  <p className="text-sm font-semibold text-on-surface">Nenhuma clínica selecionada</p>
                  <p className="mt-1 max-w-xs text-xs text-on-surface-variant">
                    Selecione uma clínica na listagem para gerenciar licença, status e plano.
                  </p>
                </Card>
              )}
            </aside>

            <section className="xl:col-span-2">
              <Card className="p-5">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h3 className="flex items-center gap-2 text-base font-bold text-on-surface">
                    <span className="material-symbols-outlined text-primary">terminal</span>
                    Logs de Atividade Técnica
                  </h3>
                  <button type="button" className="text-sm font-bold text-primary hover:underline" onClick={() => setActiveTab('audit')}>
                    Ver todos
                  </button>
                </div>
                <div className="space-y-3">
                  {recentLogs.length === 0 ? (
                    <p className="py-6 text-center text-xs text-on-surface-variant">Nenhum evento técnico registrado.</p>
                  ) : (
                    recentLogs.map(log => <AuditSnippet key={log.id} log={log} />)
                  )}
                </div>
              </Card>
            </section>

            <Card className="p-5">
              <h3 className="mb-5 text-base font-bold text-on-surface">Distribuição Operacional</h3>
              <div className="flex aspect-square items-center justify-center rounded-lg bg-surface-container-high p-6 text-center">
                <div className="w-full">
                  <span className="material-symbols-outlined mb-2 text-5xl text-primary">map</span>
                  <p className="text-sm font-semibold text-on-surface-variant">Densidade por região</p>
                  <DistributionBar label="Sudeste" value={62} />
                  <DistributionBar label="Sul" value={18} />
                  <DistributionBar label="Nordeste" value={12} />
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <div className="flex flex-col gap-4 border-b border-outline-variant px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-on-surface">
                  <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                  Trilha de Auditoria Geral
                </h2>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Eventos de sistema, licenciamento, login e ações clínicas persistidos no ledger de auditoria.
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" className="w-fit gap-2 rounded-lg" onClick={() => refreshAdminData()}>
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Atualizar Logs
              </Button>
            </div>

            {auditLogs.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-on-surface-variant">Nenhum evento registrado na auditoria.</div>
            ) : (
              <div className="divide-y divide-outline-variant">
                {auditLogs.map(log => <AuditRow key={log.id} log={log} />)}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

const getPlanPrice = (planId: string) => PLANS.find(plan => plan.id === planId)?.priceMonthly || 0;

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  helper: string;
  tone: 'primary' | 'success' | 'warning' | 'error';
  progress?: number;
}

function MetricCard({ icon, label, value, helper, tone, progress }: MetricCardProps) {
  const toneClass = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-700',
    warning: 'bg-tertiary-fixed text-tertiary',
    error: 'bg-error/10 text-error',
  }[tone];

  return (
    <Card className="relative overflow-hidden p-5">
      <span className="material-symbols-outlined absolute right-4 top-4 text-6xl opacity-10">{icon}</span>
      <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{label}</p>
      <h3 className="mt-2 break-words font-mono text-2xl font-bold text-on-surface">{value}</h3>
      <div className={`mt-4 inline-flex items-center gap-1 text-xs font-semibold ${toneClass} rounded-lg px-2 py-1`}>
        <span className="material-symbols-outlined text-[14px]">{tone === 'error' ? 'warning' : 'trending_up'}</span>
        {helper}
      </div>
      {typeof progress === 'number' && (
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-outline-variant">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      )}
    </Card>
  );
}

interface TabButtonProps {
  active: boolean;
  icon: string;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, icon, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
        active ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyles[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}

function PlanPill({ plan }: { plan?: Plan }) {
  return (
    <span className="inline-flex rounded bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
      {plan?.name || 'Custom'}
    </span>
  );
}

interface StatusActionProps {
  status: SubscriptionStatus;
  current: SubscriptionStatus;
  onClick: () => void;
}

function StatusAction({ status, current, onClick }: StatusActionProps) {
  const active = status === current;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${
        active ? `${statusStyles[status]} border-current` : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
      }`}
    >
      {statusLabels[status]}
    </button>
  );
}

interface PlanOptionProps {
  plan: Plan;
  active: boolean;
  onClick: () => void;
}

function PlanOption({ plan, active, onClick }: PlanOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-3 text-left transition-colors ${
        active ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant hover:bg-surface-container'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{plan.name}</p>
          <p className="mt-1 text-xs text-on-surface-variant">Até {plan.maxProfessionals} profissionais</p>
        </div>
        <span className="font-mono text-sm font-bold">{currency(plan.priceMonthly)}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {plan.features.slice(0, 2).map(feature => (
          <span key={feature} className="rounded bg-surface-container px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">
            {feature}
          </span>
        ))}
      </div>
    </button>
  );
}

function PlanFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs opacity-70">{label}</p>
      <p className="truncate text-sm font-bold">{value}</p>
    </div>
  );
}

function AuditSnippet({ log }: { log: AuditLog }) {
  const tone = getAuditTone(log);

  return (
    <div className={`rounded-lg border-l-4 bg-surface-container p-3 ${tone.border}`}>
      <p className="text-sm font-semibold text-on-surface">
        {log.action} <span className="ml-2 text-xs font-normal text-outline">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
      </p>
      <p className="mt-1 truncate font-mono text-xs text-on-surface-variant">{log.details}</p>
    </div>
  );
}

function AuditRow({ log }: { log: AuditLog }) {
  const tone = getAuditTone(log);

  return (
    <div className="px-5 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tone.badge}`}>
            {log.action}
          </span>
          <p className="mt-2 text-sm text-on-surface">{log.details}</p>
        </div>
        <span className="shrink-0 font-mono text-xs text-outline">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-dashed border-outline-variant pt-2 text-[10px] font-semibold text-on-surface-variant">
        <span>Usuário: {log.userName} ({log.userRole})</span>
        <span>IP: {log.ip}</span>
        <span>Tenant: <span className="text-primary">{log.tenantId || 'SISTEMA'}</span></span>
      </div>
    </div>
  );
}

function getAuditTone(log: AuditLog) {
  if (log.action.includes('Bloqueio') || log.action.includes('LGP-D')) {
    return { border: 'border-primary', badge: 'bg-primary/10 text-primary' };
  }

  if (log.action.includes('Alteração') || log.action.includes('Excluir') || log.action.includes('Upgrade')) {
    return { border: 'border-tertiary', badge: 'bg-tertiary-fixed text-tertiary' };
  }

  if (log.action.includes('Login')) {
    return { border: 'border-primary', badge: 'bg-primary/10 text-primary' };
  }

  return { border: 'border-emerald-500', badge: 'bg-emerald-500/10 text-emerald-700' };
}

function DistributionBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mt-4 rounded-lg border border-outline-variant bg-surface-container-lowest/50 p-3 text-left">
      <div className="mb-1 flex items-center justify-between text-xs font-bold">
        <span>{label}</span>
        <span className="text-primary">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-outline-variant">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
