/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinancialTransaction, TransactionCategory, TransactionType } from '../types';
import { dbObj } from '../services/db';
import { 
  PiggyBank, ArrowUpRight, ArrowDownLeft, Plus, DollarSign, 
  Search, Filter, CalendarPlus, Landmark, Check
} from 'lucide-react';

interface FinancePanelProps {
  tenantId: string;
  transactions: FinancialTransaction[];
  onRefresh: () => void;
  darkMode: boolean;
}

export default function FinancePanel({ tenantId, transactions, onRefresh, darkMode }: FinancePanelProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(100);
  const [type, setType] = useState<TransactionType>('revenue');
  const [category, setCategory] = useState<TransactionCategory>('consultation');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || amount <= 0) return;

    const newTx: FinancialTransaction = {
      id: `fin_${Math.random().toString(36).substring(2, 9)}`,
      tenantId,
      type,
      category,
      description,
      amount,
      date,
      isPaid: true,
      paymentMethod
    };

    dbObj.saveTransaction(newTx);

    dbObj.logAction(
      dbObj.currentUser.id,
      dbObj.currentUser.name,
      dbObj.currentUser.role,
      'Lançamento Financeiro',
      `Registrou lançamento de ${type === 'revenue' ? 'receita' : 'despesa'} R$ ${amount.toFixed(2)}: "${description}".`,
      tenantId
    );

    // Reset Form
    setDescription('');
    setAmount(100);
    setShowAdd(false);
    onRefresh();
  };

  // Metrics
  const totalRevenue = transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalRevenue - totalExpense;

  return (
    <div className="space-y-6">
      
      {/* 3 Top Cards metrics for balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total balance card */}
        <div className={`p-6 rounded-2xl border ${
          darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Saldo em Caixa Consolidado</p>
              <h3 className={`text-2xl font-bold mt-2 font-mono ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-on-surface-variant font-medium mt-3">Soma líquida de recebimentos e gastos da clínica.</p>
        </div>

        {/* Total Incoming */}
        <div className={`p-6 rounded-2xl border ${
          darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Total Receitas</p>
              <h3 className="text-2xl font-bold mt-2 font-mono text-emerald-500">
                +R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-on-surface-variant font-medium mt-3">Consultas, orçamentos e procedimentos faturados.</p>
        </div>

        {/* Total Outgoing */}
        <div className={`p-6 rounded-2xl border ${
          darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Total Despesas</p>
              <h3 className="text-2xl font-bold mt-2 font-mono text-rose-500">
                -R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-on-surface-variant font-medium mt-3">Insumos de saúde, aluguel, laboratório e comissões.</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left main transactions stream ledger */}
        <div className={`lg:col-span-2 p-5 rounded-2xl border ${
          darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
        }`}>
          <div className="flex justify-between items-center mb-5">
            <div>
              <h4 className="font-bold text-sm">Extrato de Fluxo de Caixa</h4>
              <p className="text-xs text-on-surface-variant">Trilha de registros fiscais e reconciliação.</p>
            </div>
            
            {!showAdd && (
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Lançar Gasto / Receita</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-2.5">Descrição</th>
                  <th className="pb-2.5">Data / Categoria</th>
                  <th className="pb-2.5">Meio</th>
                  <th className="pb-2.5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">Nenhum lançamento registrado no fluxo de caixa.</td>
                  </tr>
                ) : (
                  transactions.sort((a, b) => b.date.localeCompare(a.date)).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/15 dark:hover:bg-slate-800/15 transition-colors">
                      <td className="py-3 pr-2 font-semibold text-slate-900 dark:text-slate-100">
                        {tx.description}
                        <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400 font-mono mt-0.5">ID: {tx.id}</span>
                      </td>
                      <td className="py-3 pr-2">
                        <p className="font-mono">{new Date(tx.date).toLocaleDateString()}</p>
                        <span className="text-[10px] text-slate-500 uppercase font-bold text-[9px]">{tx.category}</span>
                      </td>
                      <td className="py-3 pr-2 text-slate-500">{tx.paymentMethod}</td>
                      <td className={`py-3 text-right font-bold font-mono text-xs ${
                        tx.type === 'revenue' ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {tx.type === 'revenue' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right launcher panel form */}
        <div className="col-span-1">
          {showAdd ? (
            <form onSubmit={handleCreateTransaction} className={`p-5 rounded-2xl border space-y-4 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CalendarPlus className="h-4.5 w-4.5 text-blue-500" />
                <span>Lançamento Contábil</span>
              </h4>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Nome / Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de Luvas / Aluguel Sala 10"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    darkMode ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-250 text-black'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Valor Unitário</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-[10px] text-slate-400">R$</span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className={`w-full pl-7 pr-2 py-1.5 border rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Forma</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className={`w-full px-2.5 py-1.8 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      darkMode ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-225 text-black'
                    }`}
                  >
                    <option value="Pix">Pix Transf</option>
                    <option value="Boleto">Boleto Bancário</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Dinheiro">Dinheiro Físico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Sentido de Caixa</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TransactionType)}
                    className="w-full px-2.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-transparent text-slate-800 dark:text-white"
                  >
                    <option value="revenue">Receita (Entrada)</option>
                    <option value="expense">Despesa (Gasto)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                    className="w-full px-2.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-transparent text-slate-800 dark:text-white"
                  >
                    <option value="consultation">Consulta</option>
                    <option value="procedure">Tratamento</option>
                    <option value="salary">Salários / Pró-labore</option>
                    <option value="materials">Materiais Insumo</option>
                    <option value="rent">Aluguel Consultório</option>
                    <option value="utilities">Energia / Internet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Data Efetiva</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-3 py-1.8 border rounded-xl text-xs ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-black'
                  }`}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs text-center cursor-pointer"
                >
                  Registrar Lançamento
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-3.5 py-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-500"
                >
                  Cancelar
                </button>
              </div>

            </form>
          ) : (
            <div className={`p-5 rounded-2xl border border-dashed text-center flex flex-col items-center justify-center ${
              darkMode ? 'bg-inverse-surface border-outline/20 text-on-surface-variant' : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant'
            }`}>
              <Landmark className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Conciliação de Balanço</p>
              <p className="text-[11px] text-slate-400 mt-1">Lançamentos de orçamentos aprovados de pacientes são computados de forma <strong>automática</strong> de modo a alimentar estes balancetes corporativos!</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
