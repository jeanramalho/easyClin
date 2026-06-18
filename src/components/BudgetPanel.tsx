/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Budget, Patient, Procedure, BudgetItem, BudgetStatus, FinancialTransaction } from '../types';
import { dbObj } from '../services/db';
import { Button, Card, Input } from './ui';

interface BudgetPanelProps {
  tenantId: string;
  budgets: Budget[];
  patients: Patient[];
  procedures: Procedure[];
  onRefresh: () => void;
  darkMode: boolean;
}

const statusConfig: Record<BudgetStatus, { label: string; bg: string; text: string; border: string; icon: string }> = {
  draft: { label: 'Rascunho', bg: 'bg-surface-container', text: 'text-on-surface-variant', border: 'border-outline-variant', icon: 'edit_note' },
  pending: { label: 'Pendente', bg: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-500/20', icon: 'schedule' },
  approved: { label: 'Aprovado', bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-500/20', icon: 'check_circle' },
  rejected: { label: 'Recusado', bg: 'bg-error/10', text: 'text-error', border: 'border-error/20', icon: 'cancel' },
  converted: { label: 'Convertido', bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', icon: 'sync_alt' },
};

const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function BudgetPanel({ tenantId, budgets, patients, procedures, onRefresh }: BudgetPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [paymentPlan, setPaymentPlan] = useState('À vista s/ juros');
  const [selectedProcedures, setSelectedProcedures] = useState<BudgetItem[]>([]);
  const [currentProcId, setCurrentProcId] = useState('');
  const [discountVal, setDiscountVal] = useState(0);

  const handleAddProcedureEntry = () => {
    const proc = procedures.find(p => p.id === currentProcId);
    if (!proc) return;
    const budgetItem: BudgetItem = {
      procedureId: proc.id,
      procedureName: proc.name,
      costPrice: proc.costPrice,
      clinicCost: proc.clinicCost,
      professionalPercent: proc.professionalPercent,
      desiredMargin: proc.desiredMargin,
      calculatedPrice: proc.calculatedPrice,
      finalPrice: proc.finalPrice,
      discount: 0
    };
    setSelectedProcedures([...selectedProcedures, budgetItem]);
    setCurrentProcId('');
  };

  const handleRemoveProcedureEntry = (idx: number) => {
    setSelectedProcedures(selectedProcedures.filter((_, i) => i !== idx));
  };

  const calculateFullTotals = () => {
    const totalCostPrice = selectedProcedures.reduce((sum, p) => sum + p.costPrice, 0);
    const totalClinCost = selectedProcedures.reduce((sum, p) => sum + p.clinicCost, 0);
    const totalCommission = selectedProcedures.reduce((sum, p) => sum + (p.finalPrice * (p.professionalPercent / 100)), 0);
    const subtotal = selectedProcedures.reduce((sum, p) => sum + p.finalPrice, 0);
    const total = Math.max(0, subtotal - discountVal);
    const totalProfit = total - totalCostPrice - totalClinCost - totalCommission;
    return { totalCostPrice, totalClinCost, totalCommission, totalProfit, subtotal, total };
  };

  const { totalCostPrice, totalClinCost, totalCommission, totalProfit, subtotal, total } = calculateFullTotals();
  const profitMarginPct = subtotal > 0 ? ((totalProfit / total) * 100) : 0;

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || selectedProcedures.length === 0) return;
    const { totalCostPrice, totalClinCost, totalCommission, totalProfit, subtotal, total } = calculateFullTotals();
    const newBudget: Budget = {
      id: `bud_${Math.random().toString(36).substring(2, 9)}`,
      tenantId, patientId, items: selectedProcedures,
      totalCostPrice, totalClinCost, totalCommission, totalProfit, subtotal,
      discount: discountVal, total, status: 'pending', paymentPlan,
      createdAt: new Date().toISOString()
    };
    dbObj.saveBudget(newBudget);
    const patName = patients.find(p => p.id === patientId)?.name || 'N/A';
    dbObj.logAction(dbObj.currentUser.id, dbObj.currentUser.name, dbObj.currentUser.role,
      'Orçamento Criado', `Criou orçamento no valor total R$ ${total.toFixed(2)} para o paciente ${patName}.`, tenantId);
    setPatientId('');
    setSelectedProcedures([]);
    setDiscountVal(0);
    setPaymentPlan('À vista s/ juros');
    setShowCreate(false);
    onRefresh();
  };

  const handleUpdateStatus = (budget: Budget, newStatus: BudgetStatus) => {
    const updated: Budget = { ...budget, status: newStatus };
    dbObj.saveBudget(updated);
    const patientObj = patients.find(p => p.id === budget.patientId);
    dbObj.logAction(dbObj.currentUser.id, dbObj.currentUser.name, dbObj.currentUser.role,
      'Orçamento Atualizado', `Orçamento ${budget.id} de ${patientObj?.name || 'N/A'} alterado para "${newStatus}".`, tenantId);
    if (newStatus === 'approved') {
      const newTx: FinancialTransaction = {
        id: `fin_${Math.random().toString(36).substring(2, 9)}`, tenantId, type: 'revenue', category: 'procedure',
        description: `Orçamento Aprovado ${budget.id} - ${patientObj?.name || 'Paciente'}`,
        amount: budget.total, date: new Date().toISOString().split('T')[0], isPaid: true, paymentMethod: 'Transferência / Convênio'
      };
      dbObj.saveTransaction(newTx);
      dbObj.logAction('system_accounting', 'EasyClin Financeiro', 'receptionist', 'Receita Automática Lançada',
        `Lançou recebimento de R$ ${budget.total.toFixed(2)} decorrente do Orçamento Aprovado ID: ${budget.id}.`, tenantId);
    }
    onRefresh();
  };

  const approvedBudgets = budgets.filter(budget => budget.status === 'approved' || budget.status === 'converted').length;
  const pendingBudgets = budgets.filter(budget => budget.status === 'pending' || budget.status === 'draft').length;
  const totalPipeline = budgets.reduce((sum, budget) => sum + budget.total, 0);
  const projectedProfit = budgets.reduce((sum, budget) => sum + budget.totalProfit, 0);
  const profitMarginPct = total > 0 ? (totalProfit / total) * 100 : 0;
  const maxDiscount = Math.round(subtotal * 0.4);

  const selectClass =
    'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">Orçamentos e Precificação</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Propostas comerciais com projeção de custos, repasse profissional e lucro real QiDent.
          </p>
        </div>
        {!showCreate && (
          <Button
            type="button"
            onClick={() => setShowCreate(true)}
            className="h-10 gap-2 rounded-lg"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Novo Orçamento
          </Button>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon="request_quote" label="Pipeline Total" value={currency(totalPipeline)} helper={`${budgets.length} orçamento${budgets.length !== 1 ? 's' : ''}`} tone="primary" />
        <MetricCard icon="pending_actions" label="Em Negociação" value={pendingBudgets} helper="Aguardando decisão" tone="warning" />
        <MetricCard icon="task_alt" label="Aprovados" value={approvedBudgets} helper="Convertidos em receita" tone="success" />
        <MetricCard icon="insights" label="Lucro Projetado" value={currency(projectedProfit)} helper="Pós-custos e repasses" tone={projectedProfit >= 0 ? 'success' : 'error'} />
      </section>

      {showCreate ? (
        <Card>
          <div className="flex flex-col gap-3 border-b border-outline-variant bg-surface-container-lowest px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-on-surface">Novo orçamento inteligente</h3>
              <p className="mt-0.5 text-xs text-outline">Monte os itens e valide a rentabilidade antes de enviar a proposta.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" className="w-fit gap-2 rounded-lg" onClick={() => setShowCreate(false)}>
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Voltar à lista
            </Button>
          </div>

          <form onSubmit={handleSaveBudget} className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[minmax(0,8fr)_minmax(320px,4fr)]">
            <div className="min-w-0 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Paciente *</label>
                  <select required value={patientId} onChange={e => setPatientId(e.target.value)} className={selectClass}>
                    <option value="">Selecione o paciente...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.document})</option>)}
                  </select>
                </div>
                <Input
                  required
                  label="Forma de Pagamento *"
                  value={paymentPlan}
                  onChange={e => setPaymentPlan(e.target.value)}
                  placeholder="Ex: Entrada de R$ 500 + 3x Cartão"
                  className="rounded-lg bg-surface-container-lowest"
                />
              </div>

              <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-primary">Adicionar Procedimento</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select value={currentProcId} onChange={e => setCurrentProcId(e.target.value)}
                    className={`${selectClass} flex-1`}>
                    <option value="">Selecione do catálogo QiDent...</option>
                    {procedures.map(proc => (
                      <option key={proc.id} value={proc.id}>{proc.name} - {currency(proc.finalPrice)}</option>
                    ))}
                  </select>
                  <Button type="button" onClick={handleAddProcedureEntry} disabled={!currentProcId} className="h-10 rounded-lg px-4">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-outline-variant">
                <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-4 py-3">
                  <h4 className="text-sm font-bold text-on-surface">Serviços e Procedimentos</h4>
                  <span className="rounded-full bg-surface-container-lowest px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-outline">
                    {selectedProcedures.length} item{selectedProcedures.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {selectedProcedures.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-outline mb-2">playlist_add</span>
                    <p className="text-sm font-semibold text-on-surface-variant">Nenhum procedimento selecionado</p>
                    <p className="mt-1 max-w-sm text-xs text-outline">Adicione itens do catálogo QiDent para liberar a simulação de lucro real.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-xs">
                      <thead className="bg-surface-container-low/60 text-[10px] font-bold uppercase tracking-wider text-outline">
                        <tr>
                          <th className="px-4 py-3">Serviço</th>
                          <th className="px-4 py-3">Custos</th>
                          <th className="px-4 py-3">Repasse</th>
                          <th className="px-4 py-3 text-right">Preço / Lucro</th>
                          <th className="px-4 py-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                    {selectedProcedures.map((item, index) => {
                      const commission = item.finalPrice * (item.professionalPercent / 100);
                      const netProfit = item.finalPrice - item.costPrice - item.clinicCost - commission;
                      return (
                        <tr key={`${item.procedureId}-${index}`} className="transition-colors hover:bg-surface-container-low/50">
                          <td className="px-4 py-4">
                            <p className="font-semibold text-on-surface">{item.procedureName}</p>
                            <span className="text-[10px] text-outline">Margem desejada: {item.desiredMargin}%</span>
                          </td>
                          <td className="px-4 py-4 text-on-surface-variant">
                            <p className="font-mono">{currency(item.costPrice + item.clinicCost)}</p>
                            <span className="text-[10px] text-outline">Insumos + sala</span>
                          </td>
                          <td className="px-4 py-4 text-on-surface-variant">
                            <p className="font-mono">{currency(commission)}</p>
                            <span className="text-[10px] text-outline">{item.professionalPercent}% profissional</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <p className="font-mono font-bold text-on-surface">{currency(item.finalPrice)}</p>
                            <span className={`text-[10px] font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-error'}`}>
                              Lucro {currency(netProfit)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button type="button" onClick={() => handleRemoveProcedureEntry(index)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-outline transition-colors hover:bg-error/10 hover:text-error"
                              title="Remover procedimento">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-4 rounded-xl border-2 border-primary/20 bg-surface-container-lowest p-5 shadow-sm lg:sticky lg:top-4 lg:self-start">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                <h3 className="text-base font-bold text-primary">Inteligência de Precificação</h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal bruto:</span>
                  <span className="font-mono font-semibold text-on-surface">{currency(subtotal)}</span>
                </div>

                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-on-surface-variant font-medium">Desconto comercial:</span>
                    <span className="font-mono font-bold text-error">- {currency(discountVal)}</span>
                  </div>
                  <input type="range" min="0" max={maxDiscount} value={Math.min(discountVal, maxDiscount)}
                    onChange={e => setDiscountVal(parseInt(e.target.value) || 0)}
                    className="w-full h-1.5 cursor-pointer rounded-full accent-primary" />
                  <div className="flex justify-between text-[10px] text-outline mt-1">
                    <span>{currency(0)}</span>
                    <span>Máx. 40%</span>
                  </div>
                </div>

                <div className="flex justify-between border-b border-outline-variant pb-3 pt-1 text-base font-bold">
                  <span>TOTAL:</span>
                  <span className="font-mono text-primary">{currency(total)}</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Deduções de Lucratividade:</span>
                  <div className="flex justify-between text-xs text-on-surface-variant">
                    <span>Insumos clínicos</span>
                    <span className="font-mono">- {currency(totalCostPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-on-surface-variant">
                    <span>Custos operacionais</span>
                    <span className="font-mono">- {currency(totalClinCost)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-on-surface-variant">
                    <span>Comissão profissional</span>
                    <span className="font-mono">- {currency(totalCommission)}</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border mt-2 ${
                  totalProfit > 0
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-error/10 border-error/20'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-outline">Projeção Lucro Real</span>
                  <div className={`text-2xl font-mono font-bold ${totalProfit > 0 ? 'text-emerald-500' : 'text-error'}`}>
                    {currency(totalProfit)}
                  </div>
                  <div className={`text-xs font-semibold mt-1 ${totalProfit > 0 ? 'text-emerald-600' : 'text-error'}`}>
                    Margem: {profitMarginPct.toFixed(1)}%
                  </div>
                  <p className="text-[10px] text-outline mt-1.5 leading-relaxed">
                    Rentabilidade clínica real pós-custos e comissões.
                  </p>
                </div>
              </div>

              <Button type="submit" disabled={selectedProcedures.length === 0 || !patientId}
                className="w-full gap-2 rounded-xl bg-emerald-600 py-3 hover:bg-emerald-700">
                <span className="material-symbols-outlined text-[18px]">task_alt</span>
                Registrar Proposta Comercial
              </Button>
            </aside>
          </form>
        </Card>
      ) : (
        <Card>
          <div className="flex flex-col gap-1 border-b border-outline-variant px-5 py-4">
            <h3 className="text-base font-bold text-on-surface">Orçamentos cadastrados</h3>
            <p className="text-xs text-outline">{budgets.length} proposta{budgets.length !== 1 ? 's' : ''} comercial{budgets.length !== 1 ? 'is' : ''} no histórico da clínica.</p>
          </div>

          {budgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <span className="material-symbols-outlined text-5xl text-outline mb-3">description</span>
              <h4 className="font-semibold text-on-surface-variant text-sm">Nenhum orçamento criado</h4>
              <p className="text-xs text-outline mt-1.5 max-w-65">Clique em "Novo Orçamento" para criar a primeira proposta comercial para um paciente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] text-left text-xs">
                <thead className="bg-surface-container-low text-[10px] font-bold uppercase tracking-wider text-outline">
                  <tr>
                    <th className="px-6 py-3">Paciente</th>
                    <th className="px-4 py-3">Condições</th>
                    <th className="px-4 py-3">Procedimentos</th>
                    <th className="px-4 py-3">Projeção QiDent</th>
                    <th className="px-4 py-3 text-right">Status / Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {budgets.map(bud => {
                    const patient = patients.find(p => p.id === bud.patientId);
                    const cfg = statusConfig[bud.status];
                    return (
                      <tr key={bud.id} className="transition-colors hover:bg-surface-container-low/50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-on-surface">{patient?.name || 'N/A'}</p>
                          <span className="text-[10px] text-outline font-mono">{new Date(bud.createdAt).toLocaleDateString('pt-BR')}</span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-on-surface font-mono">{currency(bud.total)}</p>
                          <span className="text-[10px] text-outline truncate max-w-30 block">{bud.paymentPlan}</span>
                        </td>
                        <td className="px-4 py-4 text-on-surface-variant max-w-40">
                          <p className="truncate text-xs">{bud.items.map(it => it.procedureName).join(', ')}</p>
                          <span className="text-[10px] text-outline">{bud.items.length} procedimento{bud.items.length !== 1 ? 's' : ''}</span>
                        </td>
                        <td className="px-4 py-4">
                          <p className={`font-bold font-mono text-sm ${bud.totalProfit >= 0 ? 'text-emerald-500' : 'text-error'}`}>
                            {currency(bud.totalProfit)}
                          </p>
                          <span className="text-[9px] text-outline uppercase font-bold tracking-widest">Lucro Real</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                              {cfg.label}
                            </span>
                            {bud.status === 'pending' && (
                              <div className="flex gap-1">
                                <button onClick={() => handleUpdateStatus(bud, 'approved')}
                                  className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer"
                                  title="Aprovar Proposta">
                                  <span className="material-symbols-outlined text-[14px]">check</span>
                                </button>
                                <button onClick={() => handleUpdateStatus(bud, 'rejected')}
                                  className="p-1.5 bg-error hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                                  title="Recusar Proposta">
                                  <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

interface MetricCardProps {
  icon: string;
  label: string;
  value: string | number;
  helper: string;
  tone: 'primary' | 'success' | 'warning' | 'error';
}

function MetricCard({ icon, label, value, helper, tone }: MetricCardProps) {
  const toneClass = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-700',
    warning: 'bg-amber-500/10 text-amber-700',
    error: 'bg-error/10 text-error',
  }[tone];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{label}</p>
          <p className="mt-2 text-xl font-bold text-on-surface">{value}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{helper}</p>
        </div>
        <span className={`material-symbols-outlined rounded-lg p-2 text-[20px] ${toneClass}`}>{icon}</span>
      </div>
    </Card>
  );
}
