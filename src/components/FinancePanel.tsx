/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { FinancialTransaction, TransactionCategory, TransactionType } from '../types';
import { dbObj } from '../services/db';
import { Button, Card, Input } from './ui';

interface FinancePanelProps {
  tenantId: string;
  transactions: FinancialTransaction[];
  onRefresh: () => void;
  darkMode: boolean;
}

type TransactionFilter = 'all' | TransactionType;

const categoryLabels: Record<TransactionCategory, string> = {
  consultation: 'Consulta',
  procedure: 'Tratamento',
  salary: 'Salários',
  rent: 'Aluguel',
  utilities: 'Utilidades',
  materials: 'Materiais',
  marketing: 'Marketing',
  other: 'Outros',
};

const categoryOptions: Array<{ value: TransactionCategory; label: string }> = [
  { value: 'consultation', label: 'Consulta' },
  { value: 'procedure', label: 'Tratamento' },
  { value: 'salary', label: 'Salários / Pró-labore' },
  { value: 'materials', label: 'Materiais e insumos' },
  { value: 'rent', label: 'Aluguel consultório' },
  { value: 'utilities', label: 'Energia / Internet' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Outros' },
];

const paymentMethods = ['Pix', 'Boleto', 'Cartão de Crédito', 'Dinheiro', 'Transferência / Convênio'];

const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const getMonthKey = (value: string) => value.slice(0, 7);

export default function FinancePanel({ tenantId, transactions, onRefresh }: FinancePanelProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(100);
  const [type, setType] = useState<TransactionType>('revenue');
  const [category, setCategory] = useState<TransactionCategory>('consultation');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    const newTx: FinancialTransaction = {
      id: `fin_${Math.random().toString(36).substring(2, 9)}`,
      tenantId,
      type,
      category,
      description: description.trim(),
      amount,
      date,
      isPaid: true,
      paymentMethod,
    };

    dbObj.saveTransaction(newTx);
    dbObj.logAction(
      dbObj.currentUser.id,
      dbObj.currentUser.name,
      dbObj.currentUser.role,
      'Lançamento Financeiro',
      `Registrou lançamento de ${type === 'revenue' ? 'receita' : 'despesa'} R$ ${amount.toFixed(2)}: "${newTx.description}".`,
      tenantId
    );

    setDescription('');
    setAmount(100);
    setType('revenue');
    setCategory('consultation');
    setPaymentMethod('Pix');
    setDate(new Date().toISOString().split('T')[0]);
    setShowAdd(false);
    onRefresh();
  };

  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  );

  const filteredTransactions = sortedTransactions.filter((tx) => {
    const matchesType = filter === 'all' || tx.type === filter;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      tx.description.toLowerCase().includes(query) ||
      categoryLabels[tx.category].toLowerCase().includes(query) ||
      tx.paymentMethod.toLowerCase().includes(query);
    return matchesType && matchesSearch;
  });

  const totalRevenue = transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalRevenue - totalExpense;
  const currentMonth = getMonthKey(new Date().toISOString());
  const monthlyTransactions = transactions.filter(tx => getMonthKey(tx.date) === currentMonth);
  const monthlyRevenue = monthlyTransactions.filter(tx => tx.type === 'revenue').reduce((sum, tx) => sum + tx.amount, 0);
  const monthlyExpense = monthlyTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
  const operatingHealth = totalRevenue > 0 ? Math.max(0, Math.min(100, (balance / totalRevenue) * 100)) : 0;
  const expenseRatio = totalRevenue > 0 ? (totalExpense / totalRevenue) * 100 : 0;
  const healthLabel = balance >= 0 ? 'Operação Saudável' : 'Atenção ao Caixa';
  const chartBars = buildCashflowBars(transactions);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">Gestão Financeira</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
              balance >= 0 ? 'bg-emerald-500/10 text-emerald-700' : 'bg-error/10 text-error'
            }`}>
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              {healthLabel}
            </span>
            <span className="text-sm text-on-surface-variant">Atualizado com lançamentos e orçamentos aprovados.</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex w-fit items-center rounded-lg border border-outline-variant bg-surface-container p-1">
            <PeriodButton active={period === 'monthly'} onClick={() => setPeriod('monthly')}>Mensal</PeriodButton>
            <PeriodButton active={period === 'quarterly'} onClick={() => setPeriod('quarterly')}>Trimestral</PeriodButton>
            <PeriodButton active={period === 'yearly'} onClick={() => setPeriod('yearly')}>Anual</PeriodButton>
          </div>
          <Button type="button" className="h-10 gap-2 rounded-lg" onClick={() => setShowAdd(true)}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            Lançar Gasto / Receita
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon="account_balance_wallet"
          label="Saldo Consolidado"
          value={currency(balance)}
          helper="Receitas menos despesas"
          tone={balance >= 0 ? 'success' : 'error'}
          progress={operatingHealth}
        />
        <MetricCard
          icon="trending_up"
          label="Contas a Receber"
          value={currency(totalRevenue)}
          helper={`${transactions.filter(t => t.type === 'revenue').length} entradas registradas`}
          tone="success"
        />
        <MetricCard
          icon="trending_down"
          label="Contas a Pagar"
          value={currency(totalExpense)}
          helper={`${expenseRatio.toFixed(1)}% das receitas`}
          tone="warning"
        />
        <MetricCard
          icon="calendar_month"
          label="Fluxo do Mês"
          value={currency(monthlyRevenue - monthlyExpense)}
          helper={`${currency(monthlyRevenue)} recebido no mês`}
          tone={monthlyRevenue - monthlyExpense >= 0 ? 'primary' : 'error'}
          progress={monthlyRevenue > 0 ? Math.max(0, Math.min(100, ((monthlyRevenue - monthlyExpense) / monthlyRevenue) * 100)) : 0}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,8fr)_minmax(320px,4fr)]">
        <Card className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-outline-variant px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-on-surface">Previsão de Receita</h3>
              <p className="mt-0.5 text-xs text-on-surface-variant">Fluxo líquido por mês baseado em lançamentos reais.</p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container hover:text-primary"
              title="Mais opções"
            >
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>
          <div className="flex h-72 items-end gap-2 p-5">
            {chartBars.map((bar) => (
              <div key={bar.label} className="group relative flex h-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-lg transition-colors ${
                    bar.value >= 0 ? 'bg-primary-container/30 hover:bg-primary' : 'bg-error/20 hover:bg-error'
                  }`}
                  style={{ height: `${bar.height}%` }}
                />
                <div className="absolute -top-1 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-inverse-surface px-2 py-1 text-[10px] text-inverse-on-surface group-hover:block">
                  {bar.label}: {currency(bar.value)}
                </div>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase text-outline">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 border-t border-outline-variant px-5 py-3 text-xs text-outline">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Saldo positivo</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-error" /> Saldo negativo</span>
          </div>
        </Card>

        {showAdd ? (
          <Card as="form" onSubmit={handleCreateTransaction} className="p-5 xl:sticky xl:top-4 xl:self-start">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">add_card</span>
                  <h3 className="text-base font-bold text-on-surface">Lançamento Contábil</h3>
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">Registre entradas e saídas manuais do caixa.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container"
                title="Fechar formulário"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <Input
                required
                label="Nome / Descrição"
                placeholder="Ex: Compra de luvas / aluguel sala 10"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-lg bg-surface-container-lowest"
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <MoneyInput label="Valor" value={amount} onChange={setAmount} />
                <SelectField label="Forma" value={paymentMethod} onChange={setPaymentMethod}>
                  {paymentMethods.map(method => <option key={method} value={method}>{method}</option>)}
                </SelectField>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <SelectField label="Sentido de Caixa" value={type} onChange={(value) => setType(value as TransactionType)}>
                  <option value="revenue">Receita (Entrada)</option>
                  <option value="expense">Despesa (Gasto)</option>
                </SelectField>
                <SelectField label="Categoria" value={category} onChange={(value) => setCategory(value as TransactionCategory)}>
                  {categoryOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </SelectField>
              </div>

              <Input
                required
                label="Data Efetiva"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg bg-surface-container-lowest"
              />

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" className="flex-1 rounded-lg">
                  Registrar Lançamento
                </Button>
                <Button type="button" variant="secondary" className="rounded-lg" onClick={() => setShowAdd(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-5">
            <h3 className="mb-5 text-base font-bold text-on-surface">Conciliação Bancária</h3>
            <div className="space-y-3">
              <BankAccountCard name="Conta Operacional" detail="Receitas clínicas e convênios" amount={Math.max(balance, 0) * 0.62} />
              <BankAccountCard name="Reserva de Caixa" detail="Capital de giro e provisões" amount={Math.max(balance, 0) * 0.38} />
            </div>
            <button
              type="button"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant py-3 text-sm font-bold text-outline transition-colors hover:border-primary hover:text-primary"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Vincular Nova Conta
            </button>
            <p className="mt-4 text-xs leading-relaxed text-on-surface-variant">
              Orçamentos aprovados já alimentam receitas automaticamente. Use o lançamento manual para despesas, ajustes e recebimentos avulsos.
            </p>
          </Card>
        )}
      </section>

      <Card>
        <div className="flex flex-col gap-4 border-b border-outline-variant px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="text-base font-bold text-on-surface">Transações Recentes</h3>
            <p className="mt-0.5 text-xs text-on-surface-variant">{filteredTransactions.length} lançamento{filteredTransactions.length !== 1 ? 's' : ''} encontrado{filteredTransactions.length !== 1 ? 's' : ''}.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar transação..."
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-3 text-sm text-on-surface placeholder-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>Todos</FilterButton>
              <FilterButton active={filter === 'revenue'} onClick={() => setFilter('revenue')}>Receitas</FilterButton>
              <FilterButton active={filter === 'expense'} onClick={() => setFilter('expense')}>Despesas</FilterButton>
            </div>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="material-symbols-outlined mb-3 text-5xl text-outline">receipt_long</span>
            <h4 className="text-sm font-semibold text-on-surface-variant">Nenhum lançamento encontrado</h4>
            <p className="mt-1.5 max-w-sm text-xs text-outline">Ajuste os filtros ou registre um novo lançamento financeiro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-surface-container-low text-[10px] font-bold uppercase tracking-wider text-outline">
                <tr>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Descrição</th>
                  <th className="px-5 py-3">Categoria</th>
                  <th className="px-5 py-3">Meio</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="transition-colors hover:bg-surface-container-low/50">
                    <td className="px-5 py-4 font-mono text-on-surface">{formatDate(tx.date)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined rounded-lg p-2 text-[18px] ${
                          tx.type === 'revenue' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
                        }`}>
                          {tx.type === 'revenue' ? 'person' : 'shopping_cart'}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-on-surface">{tx.description}</p>
                          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-outline">ID: {tx.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded bg-surface-container px-2 py-1 text-[10px] font-bold text-on-surface-variant">
                        {categoryLabels[tx.category]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant">{tx.paymentMethod}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
                        {tx.isPaid ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className={`px-5 py-4 text-right font-mono font-bold ${
                      tx.type === 'revenue' ? 'text-emerald-700' : 'text-error'
                    }`}>
                      {tx.type === 'revenue' ? '+' : '-'} {currency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function buildCashflowBars(transactions: FinancialTransaction[]) {
  const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
  const now = new Date();
  const months = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 6 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return { key, label: formatter.format(date).replace('.', '') };
  });

  const values = months.map(month => {
    const monthly = transactions.filter(tx => getMonthKey(tx.date) === month.key);
    const revenue = monthly.filter(tx => tx.type === 'revenue').reduce((sum, tx) => sum + tx.amount, 0);
    const expense = monthly.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    return { ...month, value: revenue - expense };
  });

  const maxAbs = Math.max(...values.map(item => Math.abs(item.value)), 1);
  return values.map(item => ({
    ...item,
    height: Math.max(12, (Math.abs(item.value) / maxAbs) * 92),
  }));
}

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
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className={`material-symbols-outlined rounded-lg p-2 text-[20px] ${toneClass}`}>{icon}</span>
      </div>
      <p className="text-sm text-on-surface-variant">{label}</p>
      <h3 className="mt-1 break-words font-mono text-2xl font-bold text-on-surface">{value}</h3>
      <p className="mt-2 text-xs text-outline">{helper}</p>
      {typeof progress === 'number' && (
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-outline-variant">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      )}
    </Card>
  );
}

interface PeriodButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function PeriodButton({ active, onClick, children }: PeriodButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
        active ? 'bg-surface text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'
      }`}
    >
      {children}
    </button>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
        active
          ? 'border-outline-variant bg-surface-container text-on-surface'
          : 'border-transparent text-on-surface-variant hover:bg-surface-container'
      }`}
    >
      {children}
    </button>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

function SelectField({ label, value, onChange, children }: SelectFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-outline">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {children}
      </select>
    </div>
  );
}

interface MoneyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function MoneyInput({ label, value, onChange }: MoneyInputProps) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-outline">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">R$</span>
        <input
          type="number"
          required
          min={1}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2.5 pl-9 pr-3 font-mono text-sm text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  );
}

interface BankAccountCardProps {
  name: string;
  detail: string;
  amount: number;
}

function BankAccountCard({ name, detail, amount }: BankAccountCardProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 transition-colors hover:border-primary">
      <div className="flex min-w-0 items-center gap-3">
        <span className="material-symbols-outlined rounded-full bg-primary/10 p-2 text-primary">account_balance</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-on-surface">{name}</p>
          <p className="truncate text-xs text-outline">{detail}</p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm font-bold text-emerald-700">{currency(amount)}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Sincronizado</p>
      </div>
    </div>
  );
}
