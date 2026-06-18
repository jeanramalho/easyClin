/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Procedure } from '../types';
import { dbObj } from '../services/db';
import { Button, Card, Input } from './ui';

interface QiDentCalculatorProps {
  tenantId: string;
  procedures: Procedure[];
  onRefreshProcedures: () => void;
  darkMode: boolean;
}

const categories = [
  'Clínica Geral',
  'Tratamento Endodôntico',
  'Cirurgia Implantodôntica',
  'Ortodontia',
  'Fisioterapia',
  'Consultas',
];

const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const calculateSuggestedPrice = (cost: number, clinic: number, commission: number, margin: number) => {
  const divisor = 1 - commission / 100 - margin / 100;
  if (divisor <= 0.05) return (cost + clinic) * 5;
  return (cost + clinic) / divisor;
};

export default function QiDentCalculator({ tenantId, procedures, onRefreshProcedures }: QiDentCalculatorProps) {
  const [editingProc, setEditingProc] = useState<Partial<Procedure> | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [costPrice, setCostPrice] = useState(50);
  const [clinicCost, setClinicCost] = useState(40);
  const [professionalPercent, setProfessionalPercent] = useState(30);
  const [desiredMargin, setDesiredMargin] = useState(35);
  const [finalPracticed, setFinalPracticed] = useState(150);

  const calculatedPrice = calculateSuggestedPrice(costPrice, clinicCost, professionalPercent, desiredMargin);
  const repasseVal = finalPracticed * (professionalPercent / 100);
  const lucroRealLiquido = finalPracticed - costPrice - clinicCost - repasseVal;
  const margemRealLiquida = finalPracticed > 0 ? (lucroRealLiquido / finalPracticed) * 100 : 0;
  const operatingCost = costPrice + clinicCost + repasseVal;
  const operatingCostPct = finalPracticed > 0 ? Math.min(100, (operatingCost / finalPracticed) * 100) : 0;
  const catalogValue = procedures.reduce((sum, procedure) => sum + procedure.finalPrice, 0);
  const averageMargin = procedures.length
    ? procedures.reduce((sum, procedure) => {
        const commission = procedure.finalPrice * (procedure.professionalPercent / 100);
        const profit = procedure.finalPrice - procedure.costPrice - procedure.clinicCost - commission;
        return sum + (procedure.finalPrice > 0 ? (profit / procedure.finalPrice) * 100 : 0);
      }, 0) / procedures.length
    : 0;

  const resetForm = () => {
    setEditingProc(null);
    setName('');
    setCategory(categories[0]);
    setCostPrice(50);
    setClinicCost(40);
    setProfessionalPercent(30);
    setDesiredMargin(35);
    setFinalPracticed(150);
  };

  const startNewProcedure = () => {
    setEditingProc({});
    setName('');
    setCategory(categories[0]);
    setCostPrice(30);
    setClinicCost(30);
    setProfessionalPercent(30);
    setDesiredMargin(30);
    setFinalPracticed(150);
  };

  const updateSuggestedPracticedPrice = (next: {
    cost?: number;
    clinic?: number;
    commission?: number;
    margin?: number;
  }) => {
    const suggested = calculateSuggestedPrice(
      next.cost ?? costPrice,
      next.clinic ?? clinicCost,
      next.commission ?? professionalPercent,
      next.margin ?? desiredMargin
    );
    setFinalPracticed(Math.round(suggested));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProc: Procedure = {
      id: editingProc?.id || `proc_${Math.random().toString(36).substring(2, 9)}`,
      tenantId,
      name: name.trim(),
      category,
      costPrice,
      clinicCost,
      professionalPercent,
      desiredMargin,
      calculatedPrice: Math.round(calculatedPrice * 100) / 100,
      finalPrice: finalPracticed,
    };

    dbObj.saveProcedure(newProc);
    dbObj.logAction(
      dbObj.currentUser.id,
      dbObj.currentUser.name,
      dbObj.currentUser.role,
      editingProc?.id ? 'Atualização de Procedimento' : 'Novo Procedimento Inteligente',
      `Salvou procedimento "${newProc.name}" com custo insumo R$ ${costPrice}, custo sala R$ ${clinicCost} e margem de lucro real de ${desiredMargin}%.`,
      tenantId
    );

    resetForm();
    onRefreshProcedures();
  };

  const handleEdit = (proc: Procedure) => {
    setEditingProc(proc);
    setName(proc.name);
    setCategory(proc.category);
    setCostPrice(proc.costPrice);
    setClinicCost(proc.clinicCost);
    setProfessionalPercent(proc.professionalPercent);
    setDesiredMargin(proc.desiredMargin);
    setFinalPracticed(proc.finalPrice);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">Catálogo QiDent</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Precifique procedimentos a partir de insumos, custo operacional, repasse e margem clínica.
          </p>
        </div>
        <Button type="button" className="h-10 gap-2 rounded-lg" onClick={startNewProcedure}>
          <span className="material-symbols-outlined text-[18px]">add</span>
          Novo Procedimento
        </Button>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard icon="medical_services" label="Procedimentos" value={procedures.length} helper="Itens ativos no catálogo" tone="primary" />
        <MetricCard icon="payments" label="Valor do Catálogo" value={currency(catalogValue)} helper="Soma dos preços praticados" tone="success" />
        <MetricCard icon="monitoring" label="Margem Média" value={`${averageMargin.toFixed(1)}%`} helper="Lucro real médio estimado" tone={averageMargin >= 0 ? 'success' : 'error'} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,8fr)_minmax(320px,4fr)]">
        <Card className="min-w-0">
          <div className="flex flex-col gap-1 border-b border-outline-variant px-5 py-4">
            <h3 className="text-base font-bold text-on-surface">Procedimentos e margens</h3>
            <p className="text-xs text-outline">Clique em um item para abrir a simulação e ajustar a precificação.</p>
          </div>

          {procedures.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <span className="material-symbols-outlined mb-3 text-5xl text-outline">calculate</span>
              <h4 className="text-sm font-semibold text-on-surface-variant">Nenhum procedimento cadastrado</h4>
              <p className="mt-1.5 max-w-sm text-xs text-outline">Crie o primeiro item para alimentar orçamentos e projeções de lucro real.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-surface-container-low text-[10px] font-bold uppercase tracking-wider text-outline">
                  <tr>
                    <th className="px-5 py-3">Nome / Categoria</th>
                    <th className="px-4 py-3">Insumos + Sala</th>
                    <th className="px-4 py-3">Repasse Prof.</th>
                    <th className="px-4 py-3">Sugerido</th>
                    <th className="px-5 py-3 text-right">Praticado / Lucro Real</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {procedures.map((proc) => {
                    const commission = proc.finalPrice * (proc.professionalPercent / 100);
                    const profit = proc.finalPrice - proc.costPrice - proc.clinicCost - commission;
                    const profitMargin = proc.finalPrice > 0 ? (profit / proc.finalPrice) * 100 : 0;
                    const isActive = editingProc?.id === proc.id;

                    return (
                      <tr
                        key={proc.id}
                        onClick={() => handleEdit(proc)}
                        className={`cursor-pointer transition-colors hover:bg-surface-container-low/50 ${
                          isActive ? 'bg-primary/5' : ''
                        }`}
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-on-surface">{proc.name}</p>
                          <span className="text-[10px] text-on-surface-variant">{proc.category}</span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-mono font-medium text-on-surface">{currency(proc.costPrice + proc.clinicCost)}</p>
                          <span className="text-[10px] text-outline">Insumo {currency(proc.costPrice)} + sala {currency(proc.clinicCost)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-mono font-semibold text-primary">{proc.professionalPercent}%</p>
                          <span className="text-[10px] text-outline">{currency(commission)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-mono font-semibold text-on-surface">{currency(proc.calculatedPrice)}</p>
                          <span className="text-[10px] text-outline">Margem alvo {proc.desiredMargin}%</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <p className="font-mono font-bold text-on-surface">{currency(proc.finalPrice)}</p>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            profit >= 0 ? 'bg-emerald-500/10 text-emerald-700' : 'bg-error/10 text-error'
                          }`}>
                            {currency(profit)} ({profitMargin.toFixed(1)}%)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {editingProc ? (
          <Card as="form" onSubmit={handleSave} className="p-5 xl:sticky xl:top-4 xl:self-start">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                  <h3 className="text-base font-bold text-primary">{editingProc.id ? 'Ajustar Procedimento' : 'Simulador QiDent'}</h3>
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">Valide preço sugerido, preço praticado e lucro real.</p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container"
                title="Fechar simulador"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <Input
                required
                label="Nome do Tratamento/Consulta"
                placeholder="Ex: Canal molar ou clareamento"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg bg-surface-container-lowest"
              />

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-outline">Categoria de Atendimento</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {categories.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <MoneyInput
                  label="Insumos"
                  value={costPrice}
                  onChange={(value) => {
                    setCostPrice(value);
                    updateSuggestedPracticedPrice({ cost: value });
                  }}
                />
                <MoneyInput
                  label="Custo Sala"
                  value={clinicCost}
                  onChange={(value) => {
                    setClinicCost(value);
                    updateSuggestedPracticedPrice({ clinic: value });
                  }}
                />
              </div>

              <RangeField
                label="Comissão Profissional"
                value={professionalPercent}
                suffix="%"
                min={0}
                max={60}
                onChange={(value) => {
                  setProfessionalPercent(value);
                  updateSuggestedPracticedPrice({ commission: value });
                }}
              />

              <RangeField
                label="Margem de Lucro Clínica"
                value={desiredMargin}
                suffix="%"
                min={5}
                max={70}
                onChange={(value) => {
                  setDesiredMargin(value);
                  updateSuggestedPracticedPrice({ margin: value });
                }}
              />

              <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-primary">Sugestão de Preço Final</span>
                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-primary">{currency(calculatedPrice)}</span>
                  <span className={`text-xs font-bold ${finalPracticed >= calculatedPrice ? 'text-emerald-700' : 'text-error'}`}>
                    {finalPracticed >= calculatedPrice ? '+' : ''}{(((finalPracticed - calculatedPrice) / (calculatedPrice || 1)) * 100).toFixed(1)}% vs praticado
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                  Preço calculado para cobrir custos operacionais, repasse e margem líquida desejada.
                </p>
              </div>

              <MoneyInput
                label="Preço Praticado"
                value={finalPracticed}
                min={1}
                onChange={setFinalPracticed}
              />

              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-xs">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="font-bold uppercase tracking-wider text-outline">Análise de Custos</span>
                  <span className="font-mono font-bold text-on-surface">{operatingCostPct.toFixed(1)}% do preço</span>
                </div>
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-container">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${operatingCostPct}%` }} />
                </div>
                <CostLine label="Preço Final" value={currency(finalPracticed)} strong />
                <CostLine label="Insumos Físicos" value={`- ${currency(costPrice)}`} negative />
                <CostLine label="Custo Operacional Sala" value={`- ${currency(clinicCost)}`} negative />
                <CostLine label={`Comissão de Repasse (${professionalPercent}%)`} value={`- ${currency(repasseVal)}`} negative />
                <div className="mt-2 flex justify-between border-t border-outline-variant pt-2 font-bold">
                  <span className="text-on-surface">Lucro Clínico Real</span>
                  <span className={`font-mono ${lucroRealLiquido >= 0 ? 'text-emerald-700' : 'text-error'}`}>
                    {currency(lucroRealLiquido)} ({margemRealLiquida.toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" className="flex-1 rounded-lg">
                  {editingProc.id ? 'Salvar Edição' : 'Cadastrar e Precificar'}
                </Button>
                <Button type="button" variant="secondary" className="rounded-lg" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="flex min-h-[360px] flex-col items-center justify-center border-dashed p-8 text-center">
            <span className="material-symbols-outlined mb-3 text-5xl text-outline">calculate</span>
            <p className="text-sm font-semibold text-on-surface">Simule margens reais de lucro</p>
            <p className="mt-1 max-w-xs text-xs text-on-surface-variant">
              Clique em um procedimento na tabela ou crie um novo item para abrir a inteligência de precificação.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}

interface MetricCardProps {
  icon: string;
  label: string;
  value: string | number;
  helper: string;
  tone: 'primary' | 'success' | 'error';
}

function MetricCard({ icon, label, value, helper, tone }: MetricCardProps) {
  const toneClass = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-700',
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

interface MoneyInputProps {
  label: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}

function MoneyInput({ label, value, min = 0, onChange }: MoneyInputProps) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-outline">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">R$</span>
        <input
          type="number"
          min={min}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2.5 pl-9 pr-3 font-mono text-sm text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  );
}

interface RangeFieldProps {
  label: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function RangeField({ label, value, suffix, min, max, onChange }: RangeFieldProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-outline">
        <span>{label}</span>
        <span className="font-mono text-xs text-primary">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="h-1.5 w-full cursor-pointer rounded-lg accent-primary"
      />
    </div>
  );
}

interface CostLineProps {
  label: string;
  value: string;
  strong?: boolean;
  negative?: boolean;
}

function CostLine({ label, value, strong, negative }: CostLineProps) {
  return (
    <div className="flex justify-between border-b border-dashed border-outline-variant py-1 text-on-surface-variant">
      <span>{label}</span>
      <span className={`font-mono ${strong ? 'font-bold text-on-surface' : ''} ${negative ? 'text-error' : ''}`}>{value}</span>
    </div>
  );
}
