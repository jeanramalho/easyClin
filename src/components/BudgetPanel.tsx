/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Budget, Patient, Procedure, BudgetItem, BudgetStatus, FinancialTransaction } from '../types';
import { dbObj } from '../services/db';
import { 
  FileSpreadsheet, ClipboardCheck, DollarSign, ListPlus, 
  Trash2, FileCheck, CheckCircle, RefreshCw, Sparkles 
} from 'lucide-react';

interface BudgetPanelProps {
  tenantId: string;
  budgets: Budget[];
  patients: Patient[];
  procedures: Procedure[];
  onRefresh: () => void;
  darkMode: boolean;
}

export default function BudgetPanel({ 
  tenantId, budgets, patients, procedures, onRefresh, darkMode 
}: BudgetPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [paymentPlan, setPaymentPlan] = useState('À vista s/ juros');
  const [selectedProcedures, setSelectedProcedures] = useState<BudgetItem[]>([]);
  const [currentProcId, setCurrentProcId] = useState('');
  
  // Custom discount for the whole budget
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
      finalPrice: proc.finalPrice, // Preço praticado inicialmente
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
    
    // Lucro real = practiced total - costs - commissions
    const totalProfit = total - totalCostPrice - totalClinCost - totalCommission;

    return {
      totalCostPrice,
      totalClinCost,
      totalCommission,
      totalProfit,
      subtotal,
      total
    };
  };

  const { totalCostPrice, totalClinCost, totalCommission, totalProfit, subtotal, total } = calculateFullTotals();

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || selectedProcedures.length === 0) return;

    const newBudget: Budget = {
      id: `bud_${Math.random().toString(36).substring(2, 9)}`,
      tenantId,
      patientId,
      items: selectedProcedures,
      totalCostPrice,
      totalClinCost,
      totalCommission,
      totalProfit,
      subtotal,
      discount: discountVal,
      total,
      status: 'pending',
      paymentPlan,
      createdAt: new Date().toISOString()
    };

    dbObj.saveBudget(newBudget);

    const patName = patients.find(p => p.id === patientId)?.name || 'N/A';
    dbObj.logAction(
      dbObj.currentUser.id,
      dbObj.currentUser.name,
      dbObj.currentUser.role,
      'Orçamento Criado',
      `Criou orçamento no valor total R$ ${total.toFixed(2)} para o paciente ${patName}.`,
      tenantId
    );

    // Reset Form
    setPatientId('');
    setSelectedProcedures([]);
    setDiscountVal(0);
    setShowCreate(false);
    onRefresh();
  };

  const handleUpdateStatus = (budget: Budget, newStatus: BudgetStatus) => {
    const updated: Budget = { ...budget, status: newStatus };
    dbObj.saveBudget(updated);

    const patientObj = patients.find(p => p.id === budget.patientId);

    // Dynamic Audit Logging
    dbObj.logAction(
      dbObj.currentUser.id,
      dbObj.currentUser.name,
      dbObj.currentUser.role,
      'Orçamento Atualizado',
      `Orçamento ${budget.id} de ${patientObj ? patientObj.name : 'N/A'} alterado para "${newStatus}".`,
      tenantId
    );

    // SE aprovado, lança automaticamente o fluxo de receitas no financeiro consolidado
    if (newStatus === 'approved') {
      const newTransaction: FinancialTransaction = {
        id: `fin_${Math.random().toString(36).substring(2, 9)}`,
        tenantId,
        type: 'revenue',
        category: 'procedure',
        description: `Orçamento Aprovado ${budget.id} - Paciente ${patientObj ? patientObj.name : 'Paciente'}`,
        amount: budget.total,
        date: new Date().toISOString().split('T')[0],
        isPaid: true,
        paymentMethod: 'Transferência / Convênio'
      };
      dbObj.saveTransaction(newTransaction);

      dbObj.logAction(
        'system_accounting',
        'EasyClin Financeiro',
        'receptionist',
        'Receita Automática Lançada',
        `Lançou recebimento de R$ ${budget.total.toFixed(2)} decorrente do Orçamento Aprovado ID: ${budget.id}.`,
        tenantId
      );
    }

    onRefresh();
  };

  return (
    <div className="space-y-6">
      
      {/* Search and action topbar */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h3 className="text-md font-bold">Orçamentos e Margens do Consultório</h3>
          <p className="text-xs text-slate-400 font-medium">Força de precificação inteligente e projeções de Lucro Real.</p>
        </div>
        
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-md cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Novo Orçamento Comercial</span>
          </button>
        )}
      </div>

      {showCreate ? (
        /* Create panel widget */
        <div className={`p-6 rounded-2xl border ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex justify-between items-center mb-5 border-b pb-3 dark:border-slate-800">
            <h4 className="font-bold text-sm">Criando Orçamento Inteligente</h4>
            <button
              onClick={() => setShowCreate(false)}
              className="px-3 py-1 text-xs border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Voltar
            </button>
          </div>

          <form onSubmit={handleSaveBudget} className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-semibold">
            
            {/* Form Fields Column Selector (Left) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400 mb-1">Escolha o Paciente</label>
                  <select
                    required
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-250'
                    }`}
                  >
                    <option value="">Selecione o paciente...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.document})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400 mb-1">Forma / Plano de Pagamento</label>
                  <input
                    type="text"
                    required
                    value={paymentPlan}
                    onChange={(e) => setPaymentPlan(e.target.value)}
                    placeholder="Ex: Entrada de R$500 + 3x Cartão"
                    className={`w-full px-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      darkMode ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-250 text-black'
                    }`}
                  />
                </div>
              </div>

              {/* Add item sandbox */}
              <div className="p-4 rounded-xl border border-dashed dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                <label className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400 mb-1.5 text-blue-600 dark:text-blue-400">Adicionar Procedimento Clínico</label>
                <div className="flex gap-2">
                  <select
                    value={currentProcId}
                    onChange={(e) => setCurrentProcId(e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      darkMode ? 'bg-slate-950 border-slate-850' : 'bg-white border-slate-250'
                    }`}
                  >
                    <option value="">Selecione procedimento do catálogo...</option>
                    {procedures.map(proc => (
                      <option key={proc.id} value={proc.id}>{proc.name} (Praticado R$ {proc.finalPrice})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddProcedureEntry}
                    disabled={!currentProcId}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl border border-blue-600 font-bold transition-all disabled:opacity-40 cursor-pointer"
                  >
                    Instalar
                  </button>
                </div>
              </div>

              {/* Procedure items list table */}
              <div className="space-y-2.5">
                <label className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400">Tratamentos Selecionados ({selectedProcedures.length})</label>
                
                {selectedProcedures.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4">Nenhum procedimento adicionado ao orçamento provisório.</p>
                ) : (
                  selectedProcedures.map((item, index) => {
                    const commission = item.finalPrice * (item.professionalPercent / 100);
                    const costTotal = item.costPrice + item.clinicCost + commission;
                    const netProfit = item.finalPrice - costTotal;

                    return (
                      <div 
                        key={index} 
                        className={`p-3 rounded-xl border flex justify-between items-center ${
                          darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-xs">{item.procedureName}</p>
                          <div className="flex gap-3 text-[10px] text-slate-400 font-mono mt-1">
                            <span>Cost: R$ {item.costPrice}</span>
                            <span>Sale: R$ {item.clinicCost}</span>
                            <span>Repasse: R$ {commission.toFixed(0)} ({item.professionalPercent}%)</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">R$ {item.finalPrice.toFixed(2)}</span>
                            <span className="block text-[9px] text-emerald-500 font-bold">Real: +R$ {netProfit.toFixed(0)}</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveProcedureEntry(index)}
                            className="p-1 hover:bg-rose-500/10 hover:text-rose-500 rounded text-slate-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Smart pricing forecast sidebar (Right) */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-100 border-slate-200/75'
            }`}>
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-blue-500 animate-spin" />
                <span>Simulação QiDent Lucro Real</span>
              </h5>

              <div className="space-y-2 font-semibold">
                <div className="flex justify-between border-b border-dashed dark:border-slate-850 pb-1 pb-1.5 text-slate-400">
                  <span>Subtotal Bruto:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">R$ {subtotal.toFixed(2)}</span>
                </div>

                {/* Adjust Discount */}
                <div>
                  <div className="flex justify-between items-center text-slate-400 border-b border-dashed dark:border-slate-850 pb-1.5 mb-1">
                    <span>Desconto do Orçamento:</span>
                    <span className="font-mono text-rose-500 font-bold">-R$ {discountVal}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.round(subtotal * 0.4)} // Máximo 40% de desconto corporativo
                    value={discountVal}
                    onChange={(e) => setDiscountVal(parseInt(e.target.value) || 0)}
                    className="w-full h-1 bg-slate-200 roundedaccent-rose-500 appearance-none"
                  />
                </div>

                <div className="flex justify-between font-bold text-sm border-b dark:border-slate-800 pb-2.5">
                  <span>TOTAL ESTIMADO:</span>
                  <span className="font-mono text-slate-900 dark:text-white text-md">R$ {total.toFixed(2)}</span>
                </div>

                <div className="space-y-1.5 pt-1.5">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-widest block font-mono">Deduções de Lucratividade:</span>
                  
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Insumos Clínicos:</span>
                    <span className="font-mono">- R$ {totalCostPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Custos Operacionais Sala:</span>
                    <span className="font-mono">- R$ {totalClinCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Comissão Profissionais:</span>
                    <span className="font-mono">- R$ {totalCommission.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/15 font-bold space-y-1 mt-4">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-blue-500 block">Projeção Lucro Real:</span>
                  <div className={`text-xl font-mono ${totalProfit > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    R$ {totalProfit.toFixed(2)}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 block leading-tight">Representa a rentabilidade de caixa clínica real pós-impostos e custos operacionais indiretos.</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={selectedProcedures.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all text-center cursor-pointer disabled:opacity-40"
              >
                Registrar Proposta Comercial
              </button>
            </div>

          </form>
        </div>
      ) : (
        /* List overview */
        <div className={`p-6 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Orçamentos Cadastrados</h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-2.5">Paciente</th>
                  <th className="pb-2.5">Condições Financeiras</th>
                  <th className="pb-2.5">Procedimentos</th>
                  <th className="pb-2.5">Projeção QiDent</th>
                  <th className="pb-2.5 text-right">Status / Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {budgets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">Nenhum orçamento encontrado. Crie um acima!</td>
                  </tr>
                ) : (
                  budgets.map((bud) => {
                    const patient = patients.find(p => p.id === bud.patientId);

                    return (
                      <tr key={bud.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{patient ? patient.name : 'N/A'}</p>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {bud.id}</span>
                        </td>
                        <td className="py-3">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">R$ {bud.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <span className="text-[10px] text-slate-500 truncate">{bud.paymentPlan}</span>
                        </td>
                        <td className="py-3 max-w-[150px] truncate">
                          {bud.items.map(it => it.procedureName).join(', ')}
                        </td>
                        <td className="py-3">
                          <p className="font-bold text-emerald-500 font-mono">R$ {bud.totalProfit.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest font-mono">Lucro Real</span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Badges */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              bud.status === 'approved' 
                                ? 'bg-emerald-500/10 text-emerald-600' 
                                : bud.status === 'rejected'
                                ? 'bg-rose-500/10 text-rose-600'
                                : 'bg-amber-500/15 text-amber-600'
                            }`}>
                              {bud.status === 'approved' ? 'Aprovado' : bud.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                            </span>

                            {/* Transitions */}
                            {bud.status === 'pending' && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleUpdateStatus(bud, 'approved')}
                                  className="bg-emerald-500 text-white rounded p-1"
                                  title="Aprovar Proposta"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(bud, 'rejected')}
                                  className="bg-rose-500 text-white rounded p-1"
                                  title="Recusar Proposta"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
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
      )}

    </div>
  );
}
