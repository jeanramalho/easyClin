/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Appointment, Patient, Procedure, User, AppointmentStatus } from '../types';
import { dbObj } from '../services/db';
import { Calendar, UserPlus, PhoneOutgoing, BellDot, CheckCircle2, XCircle, Clock, Save, FilePlus } from 'lucide-react';

interface AgendaPanelProps {
  tenantId: string;
  appointments: Appointment[];
  patients: Patient[];
  procedures: Procedure[];
  professionals: User[];
  onRefresh: () => void;
  darkMode: boolean;
}

export default function AgendaPanel({ 
  tenantId, appointments, patients, procedures, professionals, onRefresh, darkMode 
}: AgendaPanelProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id || '');
  const [procedureId, setProcedureId] = useState('');
  const [date, setDate] = useState('2026-06-01');
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  
  // CRM Alert state
  const [alertMsg, setAlertMsg] = useState<{ id: string; text: string } | null>(null);

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !professionalId) return;

    const procedure = procedures.find(p => p.id === procedureId);
    
    const newAppointment: Appointment = {
      id: `app_${Math.random().toString(36).substring(2, 9)}`,
      tenantId,
      patientId,
      professionalId,
      date,
      time,
      duration,
      status: 'pending',
      notes,
      procedureId: procedureId || undefined,
      value: procedure ? procedure.finalPrice : 0
    };

    dbObj.saveAppointment(newAppointment);

    // Audit Log
    const patientName = patients.find(p => p.id === patientId)?.name || 'Paciente';
    dbObj.logAction(
      dbObj.currentUser.id,
      dbObj.currentUser.name,
      dbObj.currentUser.role,
      'Agendamento Consulta',
      `Criou consulta para ${patientName} no dia ${date} às ${time}.`,
      tenantId
    );

    // Reset Form
    setPatientId('');
    setProcedureId('');
    setNotes('');
    setShowAddModal(false);
    onRefresh();
  };

  const handleChangeStatus = (appId: string, newStatus: AppointmentStatus) => {
    const app = appointments.find(a => a.id === appId);
    if (!app) return;

    const oldStatus = app.status;
    const updated = { ...app, status: newStatus };
    dbObj.saveAppointment(updated);

    const pat = patients.find(p => p.id === app.patientId);

    dbObj.logAction(
      dbObj.currentUser.id,
      dbObj.currentUser.name,
      dbObj.currentUser.role,
      'Status de Consulta Alterado',
      `Alterou o status da consulta do paciente "${pat ? pat.name : 'N/A'}" de "${oldStatus}" para "${newStatus}".`,
      tenantId
    );

    onRefresh();
  };

  const simulateNotification = (app: Appointment) => {
    const pat = patients.find(p => p.id === app.patientId);
    if (!pat) return;

    setAlertMsg({
      id: app.id,
      text: `📱 Disparando CRM Automatizado WhatsApp para ${pat.name} (${pat.phone})...`
    });

    setTimeout(() => {
      setAlertMsg({
        id: app.id,
        text: `✅ Confirmado! Paciente respondeu 'SIM'. Status da consulta alterado para [CONFIRMADO].`
      });

      // Automatically confirm appointment
      const updated = { ...app, status: 'confirmed' as AppointmentStatus };
      dbObj.saveAppointment(updated);
      
      dbObj.logAction(
        'automated_crm',
        'CRM EasyClin Bot',
        'receptionist',
        'Confirmação CRM Automática',
        `Disparou aviso de WhatsApp para ${pat.name}. Recebeu resposta afirmativa. Status da consulta id: ${app.id} modificado para Confirmado.`,
        tenantId
      );

      onRefresh();

      setTimeout(() => {
        setAlertMsg(null);
      }, 4000);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Search and control banner */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h3 className="text-md font-bold">Agenda Central Odontológica/Médica</h3>
          <p className="text-xs text-slate-400">Controles operacionais e disparos de confirmação automática.</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-md cursor-pointer"
        >
          <Calendar className="h-4 w-4" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {/* Main timeline listing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Appointments Feed */}
        <div className={`lg:col-span-2 p-5 rounded-2xl border ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Grade Diária de Horários</h4>

          <div className="space-y-4">
            {appointments.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Nenhum compromisso agendado para o período.</p>
            ) : (
              appointments.sort((a, b) => a.time.localeCompare(b.time)).map((app) => {
                const patient = patients.find(p => p.id === app.patientId);
                const professional = professionals.find(p => p.id === app.professionalId);
                const procedure = procedures.find(p => p.id === app.procedureId);

                return (
                  <div 
                    key={app.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all relative ${
                      darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    {/* Time indicator */}
                    <div className="flex items-center gap-3.5">
                      <div className="px-3.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-center shrink-0 border border-blue-500/20">
                        <span className="text-sm font-bold block">{app.time}</span>
                        <span className="text-[9px] uppercase">{app.duration} min</span>
                      </div>
                      
                      <div>
                        {/* Patient & specialty */}
                        <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs sm:text-sm">
                          {patient ? patient.name : 'Paciente Não Cadastrado'}
                          {patient?.hasMedicalAlert && (
                            <span 
                              className="text-[9px] bg-rose-500/15 text-rose-500 border border-rose-500/30 font-bold px-1.5 py-0.2 rounded"
                              title={patient.medicalAlertDescription}
                            >
                              Alerta Médico
                            </span>
                          )}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500 mt-1">
                          <span>Dr(a). {professional ? professional.name.split(' ')[1] : 'N/A'}</span>
                          <span>•</span>
                          <span>Proc: <strong className="text-slate-700 dark:text-slate-300">{procedure ? procedure.name : 'Consulta Geral'}</strong></span>
                          <span>•</span>
                          <span className="font-mono text-blue-500 font-semibold">Valor: R$ {app.value.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right action control & status badges */}
                    <div className="flex flex-col items-end gap-1.5 mt-2 sm:mt-0 w-full sm:w-auto">
                      <div className="flex items-center gap-1.5">
                        {/* WhatsApp automated notify action */}
                        {app.status === 'pending' && (
                          <button
                            onClick={() => simulateNotification(app)}
                            disabled={alertMsg !== null}
                            className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-500/25 p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                            title="Confirmar Presença automatizada"
                          >
                            <PhoneOutgoing className="h-3.5 w-3.5" />
                            <span>Remind</span>
                          </button>
                        )}

                        {/* Status badge representation */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          app.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : app.status === 'confirmed'
                            ? 'bg-blue-500/10 text-blue-600'
                            : app.status === 'in_progress'
                            ? 'bg-violet-500/10 text-violet-500'
                            : app.status === 'cancelled'
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-yellow-500/10 text-yellow-600'
                        }`}>
                          {app.status}
                        </span>
                      </div>

                      {/* State transition triggers */}
                      <div className="flex gap-1">
                        {app.status !== 'completed' && app.status !== 'cancelled' && (
                          <>
                            {app.status === 'confirmed' && (
                              <button
                                onClick={() => handleChangeStatus(app.id, 'in_progress')}
                                className="px-2 py-0.5 border text-purple-500 hover:bg-purple-500 hover:text-white rounded text-[10px] transition-colors"
                              >
                                Chamar
                              </button>
                            )}
                            {app.status === 'in_progress' && (
                              <button
                                onClick={() => handleChangeStatus(app.id, 'completed')}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px]"
                              >
                                Finalizar
                              </button>
                            )}
                            {app.status !== 'in_progress' && (
                              <button
                                onClick={() => handleChangeStatus(app.id, 'confirmed')}
                                className="px-2 py-0.5 border text-slate-500 hover:bg-slate-100 rounded text-[10px] dark:hover:bg-slate-800"
                              >
                                Confirmar
                              </button>
                            )}
                            <button
                              onClick={() => handleChangeStatus(app.id, 'cancelled')}
                              className="px-2 py-0.5 border text-rose-500 hover:bg-rose-500 hover:text-white rounded text-[10px] transition-colors"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Live notification simulated prompt overlay */}
                    {alertMsg && alertMsg.id === app.id && (
                      <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center text-xs text-white p-3 rounded-xl z-20">
                        <div className="flex items-center gap-2">
                          <BellDot className="h-4 w-4 text-emerald-400 animate-bounce" />
                          <span>{alertMsg.text}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Calendar widget info sidebar */}
        <div className="col-span-1 space-y-4">
          <div className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Informações de Agenda</h4>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between pb-2 border-b dark:border-slate-800">
                <span className="text-slate-500">Total Hoje:</span>
                <span className="font-bold font-mono">{appointments.length} Consultas</span>
              </div>
              <div className="flex justify-between pb-2 border-b dark:border-slate-800">
                <span className="text-slate-500">Confirmadas:</span>
                <span className="font-bold text-blue-500 font-mono">{appointments.filter(a => a.status === 'confirmed').length}</span>
              </div>
              <div className="flex justify-between pb-2 border-b dark:border-slate-800">
                <span className="text-slate-500">Finalizadas:</span>
                <span className="font-bold text-emerald-500 font-mono">{appointments.filter(a => a.status === 'completed').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Horas Clínicas Ativas:</span>
                <span className="font-bold text-purple-500 font-mono">
                  {(appointments.reduce((sum, a) => sum + (a.status !== 'cancelled' ? a.duration : 0), 0) / 60).toFixed(1)}h
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/15 text-xs text-blue-700 dark:text-blue-300">
            <span className="font-bold block mb-1">CRM Automatizado Ativado</span>
            Os lembretes automáticos funcionam em tempo real. Dispare a funcionalidade <strong>Remind</strong> acima para simular a resposta automatizada do paciente via WhatsApp e seu auto-ajuste de status na agenda central!
          </div>
        </div>

      </div>

      {/* Appointment Creation Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-1.5">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span>Novo Agendamento Clínico</span>
            </h3>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Paciente</label>
                <select
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-250 font-semibold'
                  }`}
                >
                  <option value="">Selecione o paciente...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Profissional Conduzindo</label>
                <select
                  required
                  value={professionalId}
                  onChange={(e) => setProfessionalId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-250 font-semibold'
                  }`}
                >
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.specialty || 'Clínico Geral'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Procedimento Associado</label>
                <select
                  value={procedureId}
                  onChange={(e) => setProcedureId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-250 font-semibold'
                  }`}
                >
                  <option value="">Consulta Simples / Diagnóstico Avulso (R$ 0)</option>
                  {procedures.map(proc => (
                    <option key={proc.id} value={proc.id}>{proc.name} (R$ {proc.finalPrice})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      darkMode ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-250'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Horário</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      darkMode ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-250'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Observações Internas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instruções clínicas de apoio..."
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    darkMode ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-250'
                  }`}
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl font-semibold text-xs cursor-pointer text-center"
                >
                  Confirmar Agendamento
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
