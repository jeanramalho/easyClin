/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Procedure } from '../types';
import { dbObj } from '../services/db';
import { Calculator, Percent, Sparkles, Plus, Trash2, ArrowRightLeft, DollarSign, BookmarkCheck } from 'lucide-react';

interface QiDentCalculatorProps {
  tenantId: string;
  procedures: Procedure[];
  onRefreshProcedures: () => void;
  darkMode: boolean;
}

export default function QiDentCalculator({ tenantId, procedures, onRefreshProcedures, darkMode }: QiDentCalculatorProps) {
  const [editingProc, setEditingProc] = useState<Partial<Procedure> | null>(null);
  
  // States for live smart modeling inputs
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Clínica Geral');
  const [costPrice, setCostPrice] = useState(50.00); // Insumos/Consumíveis
  const [clinicCost, setClinicCost] = useState(40.00); // Custo hora operacional da sala
  const [professionalPercent, setProfessionalPercent] = useState(30); // Repasse ao profissional %
  const [desiredMargin, setDesiredMargin] = useState(35); // Margem líquida clínica desejada %

  // Formulator algorithm
  // Price = (CostPrice + ClinicCost) / (1 - (ProfessionalPercent/100) - (DesiredMargin/100))
  const calculateSugerido = (cost: number, clinic: number, repasse: number, margin: number) => {
    const divisor = 1 - (repasse / 100) - (margin / 100);
    if (divisor <= 0.05) return (cost + clinic) * 5; // Limita em caso de taxas abusivas
    return (cost + clinic) / divisor;
  };

  const calculatedPrice = calculateSugerido(costPrice, clinicCost, professionalPercent, desiredMargin);

  const [finalPracticed, setFinalPracticed] = useState(Math.round(calculatedPrice));

  // Live profit analysis based on practices
  const repasseVal = finalPracticed * (professionalPercent / 100);
  const totalInsumos = costPrice;
  const totalSala = clinicCost;
  const lucroRealLiquido = finalPracticed - totalInsumos - totalSala - repasseVal;
  const margemRealLiquida = finalPracticed > 0 ? (lucroRealLiquido / finalPracticed) * 100 : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newProc: Procedure = {
      id: editingProc?.id || `proc_${Math.random().toString(36).substring(2, 9)}`,
      tenantId,
      name,
      category,
      costPrice,
      clinicCost,
      professionalPercent,
      desiredMargin,
      calculatedPrice: Math.round(calculatedPrice * 100) / 100,
      finalPrice: finalPracticed
    };

    dbObj.saveProcedure(newProc);
    
    // Log Audit
    dbObj.logAction(
      dbObj.currentUser.id,
      dbObj.currentUser.name,
      dbObj.currentUser.role,
      editingProc?.id ? 'Atualização de Procedimento' : 'Novo Procedimento Inteligente',
      `Salvou procedimento "${name}" com custo insumo R$ ${costPrice}, custo sala R$ ${clinicCost} e margem de lucro real de ${desiredMargin}%.`,
      tenantId
    );

    // Reset Form
    setName('');
    setEditingProc(null);
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* List of custom procedures and margins */}
      <div className={`lg:col-span-2 p-5 rounded-2xl border ${
        darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
      }`}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-md font-bold">Catálogo de Procedimentos</h3>
            <p className="text-xs text-on-surface-variant">Cada item calcula os repasses de comissão e rentabilidade real da clínica.</p>
          </div>
          <button
            onClick={() => {
              setEditingProc({});
              setName('');
              setCostPrice(30);
              setClinicCost(30);
              setProfessionalPercent(30);
              setDesiredMargin(30);
              setFinalPracticed(150);
            }}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Novo</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-outline-variant dark:border-outline/20 text-on-surface-variant font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-2.5">Nome / Categoria</th>
                <th className="pb-2.5">Insumos + Sala</th>
                <th className="pb-2.5">Repasse Prof.</th>
                <th className="pb-2.5 text-right font-bold text-on-surface dark:text-inverse-on-surface">Praticado / Lucro Real</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant dark:divide-outline/20">
              {procedures.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-on-surface-variant">Nenhum procedimento cadastrado. Adicione um acima!</td>
                </tr>
              ) : (
                procedures.map((proc) => {
                  const commission = proc.finalPrice * (proc.professionalPercent / 100);
                  const profit = proc.finalPrice - proc.costPrice - proc.clinicCost - commission;
                  const profitMargin = proc.finalPrice > 0 ? (profit / proc.finalPrice) * 100 : 0;

                  return (
                    <tr 
                      key={proc.id}
                      onClick={() => handleEdit(proc)}
                      className={`group cursor-pointer hover:bg-surface-container/50 dark:hover:bg-inverse-surface/40 transition-colors ${
                        editingProc?.id === proc.id ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <td className="py-3 pr-2">
                        <p className="font-semibold text-on-surface dark:text-inverse-on-surface">{proc.name}</p>
                        <span className="text-[10px] text-on-surface-variant">{proc.category}</span>
                      </td>
                      <td className="py-3 pr-2">
                        <p className="font-medium">R$ {(proc.costPrice + proc.clinicCost).toFixed(2)}</p>
                        <span className="text-[10px] text-on-surface-variant font-mono">Insumo: {proc.costPrice} | Sala: {proc.clinicCost}h</span>
                      </td>
                      <td className="py-3 pr-2">
                        <p className="font-semibold text-purple-600 dark:text-purple-400">{proc.professionalPercent}%</p>
                        <span className="text-[10px] text-on-surface-variant font-mono">R$ {commission.toFixed(2)}</span>
                      </td>
                      <td className="py-3 text-right">
                        <p className="font-bold text-on-surface dark:text-inverse-on-surface font-mono">R$ {proc.finalPrice.toFixed(2)}</p>
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          profit > 0 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          Lucro: R$ {profit.toFixed(0)} ({profitMargin.toFixed(0)}%)
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculator sandbox and smart designer */}
      <div className="col-span-1">
        {editingProc ? (
          <form onSubmit={handleSave} className={`p-5 rounded-2xl border transition-all ${
            darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5 text-blue-500" />
              <h3 className="text-sm font-bold">
                {editingProc.id ? 'Ajustar Procedimento' : 'Simulador QiDent'}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Nome do Tratamento/Consulta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Canal Molar ou Clareamento"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    darkMode ? 'bg-inverse-surface border-outline/20 text-inverse-on-surface' : 'bg-surface-container-lowest border-outline-variant text-on-surface'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Categoria de Atendimento</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    darkMode ? 'bg-inverse-surface border-outline/20' : 'bg-surface-container-lowest border-outline-variant font-medium'
                  }`}
                >
                  <option value="Clínica Geral">Clínica Geral</option>
                  <option value="Tratamento Endodôntico">Tratamento Endodôntico</option>
                  <option value="Cirurgia Implantodôntica">Cirurgia Implantodôntica</option>
                  <option value="Ortodontia">Ortodontia</option>
                  <option value="Fisioterapia">Fisioterapia</option>
                  <option value="Consultas">Consultas</option>
                </select>
              </div>

              {/* Insumos & Sala Costs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Insumos (Fixo)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-[10px] text-on-surface-variant">R$</span>
                    <input
                      type="number"
                      min={0}
                      value={costPrice}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setCostPrice(val);
                        setFinalPracticed(Math.round(calculateSugerido(val, clinicCost, professionalPercent, desiredMargin)));
                      }}
                      className={`w-full pl-7 pr-2 py-1.5 border rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        darkMode ? 'bg-inverse-surface border-outline/20 text-inverse-on-surface' : 'bg-surface-container-lowest border-outline-variant text-on-surface'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Custo Sala (H)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-[10px] text-on-surface-variant">R$</span>
                    <input
                      type="number"
                      min={0}
                      value={clinicCost}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setClinicCost(val);
                        setFinalPracticed(Math.round(calculateSugerido(costPrice, val, professionalPercent, desiredMargin)));
                      }}
                      className={`w-full pl-7 pr-2 py-1.5 border rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Commission Slider */}
              <div>
                  <div className="flex justify-between items-center text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  <span>Comissão Profissional</span>
                  <span className="font-mono text-xs text-purple-500 font-bold">{professionalPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={professionalPercent}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setProfessionalPercent(val);
                    setFinalPracticed(Math.round(calculateSugerido(costPrice, clinicCost, val, desiredMargin)));
                  }}
                  className="w-full h-1.5 bg-surface-container/30 dark:bg-inverse-surface/40 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Desired margin slider */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  <span>Margem de Lucro Clínica</span>
                  <span className="font-mono text-xs text-emerald-500 font-bold">{desiredMargin}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="70"
                  value={desiredMargin}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setDesiredMargin(val);
                    setFinalPracticed(Math.round(calculateSugerido(costPrice, clinicCost, professionalPercent, val)));
                  }}
                  className="w-full h-1.5 bg-surface-container/30 dark:bg-inverse-surface/40 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Smart feedback box */}
                <div className="p-3 bg-blue-500/10 rounded-xl space-y-2 border border-blue-500/15">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Sugerido Inteligente QiDent:</span>
                </div>
                <div className="text-xl font-extrabold tracking-tight font-mono text-blue-600 dark:text-blue-400">
                  R$ {calculatedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-on-surface-variant">Garante a cobertura total dos consumíveis, custos administrativos por hora do consultório e sua margem líquida líquida de {desiredMargin}%.</p>
              </div>

              {/* Practiced price input */}
              <div>
                <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Preço Praticado (Para o Paciente)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-on-surface-variant">R$</span>
                  <input
                    type="number"
                    min={1}
                    value={finalPracticed}
                    onChange={(e) => setFinalPracticed(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2.5 border rounded-xl font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-on-surface dark:text-inverse-on-surface dark:bg-inverse-surface border-outline-variant dark:border-outline/20 bg-surface-container-lowest"
                  />
                </div>
              </div>

              {/* Actual live simulation breakdown */}
              <div className="p-3.5 rounded-xl bg-surface-container/30 dark:bg-inverse-surface space-y-2 text-xs border border-outline-variant dark:border-outline/20">
                <span className="font-bold text-[10px] text-on-surface-variant uppercase tracking-wider block">Análise de Custos e Lucro Real</span>
                <div className="flex justify-between border-b border-dashed dark:border-outline/20 pb-1 text-on-surface-variant">
                  <span>Preço Final:</span>
                  <span className="font-mono text-on-surface dark:text-inverse-on-surface">R$ {finalPracticed.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-dashed dark:border-outline/20 pb-1 text-on-surface-variant">
                  <span>(-) Insumos Físicos:</span>
                  <span className="font-mono text-rose-500">-R$ {totalInsumos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-dashed dark:border-outline/20 pb-1 text-on-surface-variant">
                  <span>(-) Custo Operacional Sala:</span>
                  <span className="font-mono text-rose-500">-R$ {totalSala.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-dashed dark:border-outline/20 pb-1 text-on-surface-variant">
                  <span>(-) Comissão de Repasse ({professionalPercent}%):</span>
                  <span className="font-mono text-rose-500">-R$ {repasseVal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 font-bold">
                  <span>(=) Lucro Clínico Real:</span>
                  <span className={`font-mono ${lucroRealLiquido > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    R$ {lucroRealLiquido.toFixed(2)} ({margemRealLiquida.toFixed(0)}%)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer text-center"
                >
                  {editingProc.id ? 'Salvar Edição' : 'Cadastrar e Precificar'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProc(null)}
                  className="px-3.5 py-2.5 border rounded-xl text-xs hover:bg-surface-container/50 dark:hover:bg-inverse-surface/40 transition-colors border-outline-variant dark:border-outline/20"
                >
                  Cancelar
                </button>
              </div>

            </div>
          </form>
        ) : (
          <div className={`p-8 rounded-2xl border border-dashed text-center flex flex-col items-center justify-center h-full ${
            darkMode ? 'bg-inverse-surface border-outline/20 text-on-surface-variant' : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant'
          }`}>
            <Calculator className="h-10 w-10 text-on-surface-variant mb-2.5" />
            <p className="text-xs font-semibold">Simule margens reais de lucro</p>
            <p className="text-[11px] text-on-surface-variant mt-1 max-w-50 mx-auto">
              Clique em um procedimento na tabela para editá-lo ou em "Adicionar Novo" no topo para simular o preço inteligente.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
