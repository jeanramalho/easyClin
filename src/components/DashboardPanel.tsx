/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Patient, Appointment, Budget, FinancialTransaction, Procedure, User } from '../types';

interface DashboardPanelProps {
  patients: Patient[];
  appointments: Appointment[];
  budgets: Budget[];
  transactions: FinancialTransaction[];
  procedures: Procedure[];
  professionals: User[];
  onNavigate: (tab: string) => void;
}

// --- Micro Sparkline Component ---
const Sparkline = ({ color = '#003ec7', down = false }: { color?: string; down?: boolean }) => {
  const paths = down
    ? 'M0 10 Q 20 30, 40 20 T 70 25 T 100 18'
    : 'M0 25 Q 10 20, 20 22 T 40 15 T 60 18 T 80 10 T 100 12';
  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className="w-full h-8"
    >
      <path
        d={paths}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

// --- Progress Ring Component ---
const ProgressRing = ({ pct, color }: { pct: number; color: string }) => {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#e2e7ff" strokeWidth="6" />
      <circle
        cx="28" cy="28" r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x="28" y="33" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>
        {pct}%
      </text>
    </svg>
  );
};

export default function DashboardPanel({
  patients,
  appointments,
  budgets,
  transactions,
  procedures,
  professionals,
  onNavigate,
}: DashboardPanelProps) {
  const today = new Date().toISOString().split('T')[0];

  // Computed metrics
  const todayAppointments = appointments.filter(a => a.date === today);
  const pendingBudgets = budgets.filter(b => b.status === 'pending');
  const totalRevenue = transactions
    .filter(t => t.type === 'revenue')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalRevenue - totalExpense;

  // Upcoming appointments (sorted by time)
  const upcomingApps = appointments
    .filter(a => a.date >= today && a.status !== 'cancelled' && a.status !== 'completed')
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .slice(0, 4);

  const patientMap = Object.fromEntries(patients.map(p => [p.id, p]));
  const userMap = Object.fromEntries(professionals.map(u => [u.id, u]));
  const procedureMap = Object.fromEntries(procedures.map(pr => [pr.id, pr]));

  const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
    confirmed:    { bg: 'bg-primary/10', text: 'text-primary', label: 'Confirmado' },
    pending:      { bg: 'bg-amber-100',  text: 'text-amber-700', label: 'Em Espera' },
    in_progress:  { bg: 'bg-blue-100',   text: 'text-blue-700', label: 'Em Andamento' },
    completed:    { bg: 'bg-green-100',  text: 'text-green-700', label: 'Concluído' },
    cancelled:    { bg: 'bg-red-100',    text: 'text-red-700', label: 'Cancelado' },
  };

  // Simple month labels for chart
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'];
  const revenueHeights = [40, 60, 55, 75, 90];
  const expenseHeights = [20, 30, 25, 40, 45];

  return (
    <div className="space-y-6">

      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-on-surface tracking-tight">Executive Dashboard</h2>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Visão geral do desempenho clínico em tempo real
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Patients */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-secondary-container rounded-lg">
              <span className="material-symbols-outlined text-secondary text-[20px]">group</span>
            </div>
            <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +12.5%
            </span>
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Pacientes</p>
          <h3 className="text-2xl font-bold text-on-surface mb-3">{patients.length.toLocaleString('pt-BR')}</h3>
          <div className="overflow-hidden">
            <Sparkline color="#003ec7" />
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-surface-container-highest rounded-lg">
              <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
            </div>
            <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +8.2%
            </span>
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Receita no Mês</p>
          <h3 className="text-2xl font-bold text-on-surface mb-3">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </h3>
          <div className="overflow-hidden">
            <Sparkline color="#003ec7" />
          </div>
        </div>

        {/* Appointments Today */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-secondary-container rounded-lg">
              <span className="material-symbols-outlined text-secondary text-[20px]">event_available</span>
            </div>
            <span className="flex items-center gap-1 text-tertiary text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]">trending_down</span>
              -3.1%
            </span>
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Consultas Hoje</p>
          <h3 className="text-2xl font-bold text-on-surface mb-3">{todayAppointments.length}</h3>
          <div className="overflow-hidden">
            <Sparkline color="#952200" down />
          </div>
        </div>

        {/* Pending Quotes */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-tertiary-fixed rounded-lg">
              <span className="material-symbols-outlined text-tertiary text-[20px]">pending_actions</span>
            </div>
            <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +15%
            </span>
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Orçamentos Pendentes</p>
          <h3 className="text-2xl font-bold text-on-surface mb-3">{pendingBudgets.length}</h3>
          <div className="overflow-hidden">
            <Sparkline color="#003ec7" />
          </div>
        </div>
      </div>

      {/* Central Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Financial Chart + Productivity Metrics */}
        <div className="lg:col-span-2 space-y-5">

          {/* Financial Flow Chart */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-semibold text-base text-on-surface">Fluxo Financeiro</h3>
                <p className="text-xs text-on-surface-variant">Comparativo entre Receitas e Despesas</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary inline-block" />
                  <span className="text-xs text-on-surface-variant">Receitas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-tertiary inline-block" />
                  <span className="text-xs text-on-surface-variant">Despesas</span>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="relative w-full h-56 flex items-end justify-around pt-6">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-0">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-full border-t border-dashed border-outline-variant/40" />
                ))}
              </div>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-on-surface-variant pb-6 font-mono">
                <span>60k</span>
                <span>40k</span>
                <span>20k</span>
                <span>0</span>
              </div>

              {/* Bars */}
              <div className="flex-1 ml-8 h-full flex items-end justify-around pb-6 gap-2">
                {months.map((m, i) => (
                  <div key={m} className="flex flex-col items-center gap-1 group">
                    <div
                      className="w-7 bg-primary rounded-t transition-all hover:opacity-80"
                      style={{ height: `${revenueHeights[i]}%` }}
                      title={`Receita ${m}`}
                    />
                    <div
                      className="w-7 bg-tertiary/70 rounded-t transition-all hover:opacity-80"
                      style={{ height: `${expenseHeights[i]}%` }}
                      title={`Despesa ${m}`}
                    />
                    <span className="text-[10px] text-on-surface-variant mt-1.5">{m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Balance Summary */}
            <div className="mt-4 pt-4 border-t border-outline-variant flex justify-between items-center">
              <div className="text-sm">
                <span className="text-on-surface-variant">Saldo Consolidado: </span>
                <span className={`font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                onClick={() => onNavigate('finance')}
                className="text-xs text-primary font-bold hover:underline"
              >
                Ver Financeiro →
              </button>
            </div>
          </div>

          {/* Productivity Metrics Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex items-center gap-4 shadow-sm">
              <ProgressRing pct={84} color="#003ec7" />
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Ocupação Média</p>
                <h4 className="text-xl font-bold text-on-surface">84%</h4>
                <p className="text-[10px] text-emerald-600 font-semibold">↑ Acima da meta</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex items-center gap-4 shadow-sm">
              <ProgressRing pct={98} color="#003ec7" />
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Satisfação (NPS)</p>
                <h4 className="text-xl font-bold text-on-surface">4.9/5.0</h4>
                <p className="text-[10px] text-emerald-600 font-semibold">↑ Excelente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Upcoming Appointments + Operation Alerts */}
        <div className="space-y-5">

          {/* Próximos atendimentos */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-semibold text-sm text-on-surface">Próximos Atendimentos</h3>
              <button
                onClick={() => onNavigate('agenda')}
                className="text-xs text-primary font-bold hover:underline"
              >
                Ver Agenda
              </button>
            </div>
            <div className="divide-y divide-outline-variant/50 max-h-[320px] overflow-y-auto">
              {upcomingApps.length === 0 ? (
                <div className="p-6 text-center text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl text-outline block mb-2">event_available</span>
                  Nenhum atendimento próximo.
                </div>
              ) : (
                upcomingApps.map(app => {
                  const patient = patientMap[app.patientId];
                  const professional = userMap[app.professionalId];
                  const procedure = app.procedureId ? procedureMap[app.procedureId] : null;
                  const badge = statusBadge[app.status] || statusBadge.pending;
                  const initials = patient?.name
                    ? patient.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                    : '?';
                  return (
                    <div key={app.id} className="px-4 py-3 hover:bg-surface-container-low transition-colors flex gap-3 items-center">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-xs text-on-surface truncate">{patient?.name || 'Paciente'}</h4>
                        <p className="text-[10px] text-on-surface-variant truncate">
                          {procedure?.name || professional?.specialty || 'Consulta'} • {app.time}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 ${badge.bg} ${badge.text} text-[9px] font-bold rounded uppercase shrink-0`}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Alertas da Operação */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-sm text-on-surface mb-4">Alertas da Operação</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="material-symbols-outlined text-emerald-600 text-[18px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <div>
                  <h4 className="text-xs font-bold text-emerald-800">Sincronização Cloud</h4>
                  <p className="text-[10px] text-emerald-700 mt-0.5">Todos os registros foram salvos e encriptados com sucesso.</p>
                </div>
              </div>

              {pendingBudgets.length > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                  <span className="material-symbols-outlined text-red-600 text-[18px] mt-0.5">warning</span>
                  <div>
                    <h4 className="text-xs font-bold text-red-800">Orçamentos Pendentes</h4>
                    <p className="text-[10px] text-red-700 mt-0.5">
                      {pendingBudgets.length} orçamento{pendingBudgets.length > 1 ? 's aguardam' : ' aguarda'} aprovação do paciente.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <span className="material-symbols-outlined text-blue-600 text-[18px] mt-0.5">info</span>
                <div>
                  <h4 className="text-xs font-bold text-blue-800">Atualização do Sistema</h4>
                  <p className="text-[10px] text-blue-700 mt-0.5">Nova versão (v2.4) disponível para instalação noturna.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-sm text-on-surface mb-3">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('agenda')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-container hover:bg-secondary-container transition-colors text-secondary"
              >
                <span className="material-symbols-outlined text-[22px]">calendar_today</span>
                <span className="text-[10px] font-semibold">Agenda</span>
              </button>
              <button
                onClick={() => onNavigate('patients')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-container hover:bg-secondary-container transition-colors text-secondary"
              >
                <span className="material-symbols-outlined text-[22px]">group</span>
                <span className="text-[10px] font-semibold">Pacientes</span>
              </button>
              <button
                onClick={() => onNavigate('budgets')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-container hover:bg-secondary-container transition-colors text-secondary"
              >
                <span className="material-symbols-outlined text-[22px]">request_quote</span>
                <span className="text-[10px] font-semibold">Orçamentos</span>
              </button>
              <button
                onClick={() => onNavigate('finance')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-container hover:bg-secondary-container transition-colors text-secondary"
              >
                <span className="material-symbols-outlined text-[22px]">payments</span>
                <span className="text-[10px] font-semibold">Financeiro</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
