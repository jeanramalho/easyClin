/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Budget, Patient, Procedure, BudgetItem, BudgetStatus, FinancialTransaction } from '../types';
import { dbObj } from '../services/db';

interface BudgetPanelProps {
  tenantId: string;
  budgets: Budget[];
  patients: Patient[];
  procedures: Procedure[];
  onRefresh: () => void;
  darkMode: boolean;
}

const statusConfig = {
  pending:  { label: 'Pendente',  bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',  border: 'border-amber-500/20',  icon: 'schedule' },
  approved: { label: 'Aprovado',  bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', icon: 'check_circle' },
  rejected: { label: 'Recusado', bg: 'bg-error/10',        text: 'text-error',                           border: 'border-error/20',      icon: 'cancel' },
};

export default function BudgetPanel({ tenantId, budgets, patients, procedures, onRefresh, darkMode }: BudgetPanelProps) {
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
    setPatientId(''); setSelectedProcedures([]); setDiscountVal(0); setShowCreate(false);
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

  const selectClass = `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
    darkMode ? 'bg-inverse-surface border-outline/30 text-white' : 'bg-surface-container-lowest border-outline-variant text-on-surface'
  }`;
  const inputClass = selectClass;

  return (
    <div className="space-y-6">

      {/* ── Header Bar ── */}
      <div className={`rounded-xl border px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${
        darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
      }`}>
        <div>
          <h3 className="font-bold text-on-surface text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            Orçamentos e Margens do Consultório
          </h3>
          <p className="text-xs text-outline mt-0.5">Precificação inteligente com projeção de lucro real via QiDent.</p>
        </div>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm py-2 px-4 rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Novo Orçamento
          </button>
        )}
      </div>

      {showCreate ? (
        /* ── Create Budget Form ── */
        <div className={`rounded-xl border shadow-sm overflow-hidden ${
          darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
        }`}>
          {/* Form Header */}
          <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-outline/20' : 'border-outline-variant'}`}>
            <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">edit_document</span>
              Criando Orçamento Inteligente
            </h4>
            <button onClick={() => setShowCreate(false)}
              className={`px-3 py-1.5 text-xs border rounded-lg cursor-pointer transition-colors font-medium ${
                darkMode ? 'border-outline/30 hover:bg-inverse-surface text-outline' : 'border-outline-variant hover:bg-surface-container text-on-surface-variant'
              }`}>
              ← Voltar à lista
            </button>
          </div>

          <form onSubmit={handleSaveBudget} className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* ── Left/Center: Form Fields ── */}
            <div className="lg:col-span-2 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-outline uppercase tracking-wider">Paciente *</label>
                  <select required value={patientId} onChange={e => setPatientId(e.target.value)} className={selectClass}>
                    <option value="">Selecione o paciente...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.document})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-outline uppercase tracking-wider">Forma de Pagamento *</label>
                  <input type="text" required value={paymentPlan} onChange={e => setPaymentPlan(e.target.value)}
                    placeholder="Ex: Entrada de R$500 + 3x Cartão" className={inputClass} />
                </div>
              </div>

              {/* Add Procedure */}
              <div className={`p-4 rounded-xl border border-dashed ${darkMode ? 'border-outline/30 bg-primary/5' : 'border-primary/30 bg-primary/5'}`}>
                <label className="block text-[10px] font-semibold text-primary uppercase tracking-wider mb-2">Adicionar Procedimento ao Orçamento</label>
                <div className="flex gap-2">
                  <select value={currentProcId} onChange={e => setCurrentProcId(e.target.value)}
                    className={`flex-1 px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                      darkMode ? 'bg-inverse-surface border-outline/30 text-white' : 'bg-surface-container-lowest border-outline-variant text-on-surface'
                    }`}>
                    <option value="">Selecione do catálogo QiDent...</option>
                    {procedures.map(proc => (
                      <option key={proc.id} value={proc.id}>{proc.name} — R$ {proc.finalPrice.toFixed(2)}</option>
                    ))}
                  </select>
                  <button type="button" onClick={handleAddProcedureEntry} disabled={!currentProcId}
                    className="bg-primary hover:bg-primary-container disabled:opacity-40 text-on-primary px-4 py-2 rounded-xl font-bold text-sm transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-base">add</span>
                  </button>
                </div>
              </div>

              {/* Procedures Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Tratamentos Selecionados ({selectedProcedures.length})</span>
                </div>
                {selectedProcedures.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <span className="material-symbols-outlined text-4xl text-outline mb-2">playlist_add</span>
                    <p className="text-xs text-outline">Adicione procedimentos ao orçamento acima.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedProcedures.map((item, index) => {
                      const commission = item.finalPrice * (item.professionalPercent / 100);
                      const netProfit = item.finalPrice - item.costPrice - item.clinicCost - commission;
                      return (
                        <div key={index} className={`p-3 rounded-xl border flex justify-between items-center ${
                          darkMode ? 'bg-inverse-surface/40 border-outline/20' : 'bg-surface-container border-outline-variant'
                        }`}>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-on-surface">{item.procedureName}</p>
                            <div className="flex gap-3 text-[10px] text-outline font-mono mt-1 flex-wrap">
                              <span>Insumo: R$ {item.costPrice.toFixed(2)}</span>
                              <span>Sala: R$ {item.clinicCost.toFixed(2)}</span>
                              <span>Repasse: R$ {commission.toFixed(2)} ({item.professionalPercent}%)</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            <div className="text-right">
                              <span className="font-mono text-sm font-bold text-on-surface">R$ {item.finalPrice.toFixed(2)}</span>
                              <span className={`block text-[10px] font-bold ${netProfit > 0 ? 'text-emerald-500' : 'text-error'}`}>
                                Real: {netProfit > 0 ? '+' : ''}R$ {netProfit.toFixed(2)}
                              </span>
                            </div>
                            <button type="button" onClick={() => handleRemoveProcedureEntry(index)}
                              className="p-1.5 hover:bg-error/10 hover:text-error rounded-lg text-outline transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: QiDent Profit Simulation ── */}
            <div className={`p-5 rounded-xl border space-y-4 ${
              darkMode ? 'bg-primary/5 border-primary/20' : 'bg-surface-container border-outline-variant'
            }`}>
              <h5 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                Simulação QiDent — Lucro Real
              </h5>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal bruto:</span>
                  <span className="font-mono font-semibold text-on-surface">R$ {subtotal.toFixed(2)}</span>
                </div>

                {/* Discount Slider */}
                <div className={`p-3 rounded-lg border ${darkMode ? 'border-outline/20 bg-inverse-surface/20' : 'border-outline-variant bg-surface-container-low'}`}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-on-surface-variant font-medium">Desconto comercial:</span>
                    <span className="font-mono font-bold text-error">- R$ {discountVal.toFixed(2)}</span>
                  </div>
                  <input type="range" min="0" max={Math.round(subtotal * 0.4)} value={discountVal}
                    onChange={e => setDiscountVal(parseInt(e.target.value) || 0)}
                    className="w-full h-1.5 accent-primary rounded-full cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-outline mt-1">
                    <span>R$ 0</span>
                    <span>Máx. 40%</span>
                  </div>
                </div>

                <div className={`flex justify-between font-bold text-base pt-1 pb-3 border-b ${darkMode ? 'border-outline/20' : 'border-outline-variant'}`}>
                  <span>TOTAL:</span>
                  <span className="font-mono text-on-surface">R$ {total.toFixed(2)}</span>
                </div>

                {/* Cost breakdown */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Deduções de Lucratividade:</span>
                  <div className="flex justify-between text-xs text-on-surface-variant">
                    <span>Insumos clínicos</span>
                    <span className="font-mono">- R$ {totalCostPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-on-surface-variant">
                    <span>Custos operacionais</span>
                    <span className="font-mono">- R$ {totalClinCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-on-surface-variant">
                    <span>Comissão profissional</span>
                    <span className="font-mono">- R$ {totalCommission.toFixed(2)}</span>
                  </div>
                </div>

                {/* Profit highlight */}
                <div className={`p-4 rounded-xl border mt-2 ${
                  totalProfit > 0
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-error/10 border-error/20'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-outline">Projeção Lucro Real</span>
                  <div className={`text-2xl font-mono font-bold ${totalProfit > 0 ? 'text-emerald-500' : 'text-error'}`}>
                    R$ {totalProfit.toFixed(2)}
                  </div>
                  <div className={`text-xs font-semibold mt-1 ${totalProfit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-error'}`}>
                    Margem: {profitMarginPct.toFixed(1)}%
                  </div>
                  <p className="text-[10px] text-outline mt-1.5 leading-relaxed">
                    Rentabilidade clínica real pós-custos e comissões.
                  </p>
                </div>
              </div>

              <button type="submit" disabled={selectedProcedures.length === 0 || !patientId}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer text-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-base">task_alt</span>
                Registrar Proposta Comercial
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ── Budget List Table ── */
        <div className={`rounded-xl border overflow-hidden shadow-sm ${
          darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
        }`}>
          <div className={`px-6 py-4 border-b ${darkMode ? 'border-outline/20' : 'border-outline-variant'}`}>
            <h4 className="font-semibold text-sm text-on-surface">
              Orçamentos Cadastrados
              <span className="ml-2 text-xs font-normal text-outline">({budgets.length} total)</span>
            </h4>
          </div>

          {budgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <span className="material-symbols-outlined text-5xl text-outline mb-3">description</span>
              <h4 className="font-semibold text-on-surface-variant text-sm">Nenhum orçamento criado</h4>
              <p className="text-xs text-outline mt-1.5 max-w-[260px]">Clique em "Novo Orçamento" para criar a primeira proposta comercial para um paciente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                    darkMode ? 'border-outline/20 text-outline' : 'border-outline-variant text-outline'
                  }`}>
                    <th className="px-6 py-3">Paciente</th>
                    <th className="px-4 py-3">Condições</th>
                    <th className="px-4 py-3">Procedimentos</th>
                    <th className="px-4 py-3">Projeção QiDent</th>
                    <th className="px-4 py-3 text-right">Status / Ação</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-outline/10' : 'divide-outline-variant/50'}`}>
                  {budgets.map(bud => {
                    const patient = patients.find(p => p.id === bud.patientId);
                    const cfg = statusConfig[bud.status];
                    return (
                      <tr key={bud.id} className={`transition-colors ${
                        darkMode ? 'hover:bg-inverse-surface/20' : 'hover:bg-surface-container/50'
                      }`}>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-on-surface">{patient?.name || 'N/A'}</p>
                          <span className="text-[10px] text-outline font-mono">{new Date(bud.createdAt).toLocaleDateString('pt-BR')}</span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-on-surface font-mono">R$ {bud.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <span className="text-[10px] text-outline truncate max-w-[120px] block">{bud.paymentPlan}</span>
                        </td>
                        <td className="px-4 py-4 text-on-surface-variant max-w-[160px]">
                          <p className="truncate text-xs">{bud.items.map(it => it.procedureName).join(', ')}</p>
                          <span className="text-[10px] text-outline">{bud.items.length} procedimento{bud.items.length !== 1 ? 's' : ''}</span>
                        </td>
                        <td className="px-4 py-4">
                          <p className={`font-bold font-mono text-sm ${bud.totalProfit >= 0 ? 'text-emerald-500' : 'text-error'}`}>
                            R$ {bud.totalProfit.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
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
        </div>
      )}
    </div>
  );
}
