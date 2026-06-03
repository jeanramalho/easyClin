/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Appointment, Patient, Procedure, User, AppointmentStatus } from '../types';
import { dbObj } from '../services/db';

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

  // Helper to resolve border left status color
  const getStatusBorderColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'completed': return 'border-l-success';
      case 'confirmed': return 'border-l-primary';
      case 'in_progress': return 'border-l-secondary';
      case 'cancelled': return 'border-l-error';
      default: return 'border-l-amber-500';
    }
  };

  const getStatusBadgeStyles = (status: AppointmentStatus) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'confirmed': return 'bg-primary/10 text-primary dark:text-primary-fixed-dim';
      case 'in_progress': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'cancelled': return 'bg-error/10 text-error';
      default: return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search and control banner */}
      <div className="p-5 rounded-xl border border-outline-variant dark:border-outline/20 bg-surface-container-lowest dark:bg-inverse-surface flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h3 className="font-title-md text-title-md text-on-surface font-bold">Agenda Central</h3>
          <p className="font-body-md text-body-sm text-outline">Controles operacionais e disparos de confirmação automática.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Period Controller Mockup */}
            <div className="flex items-center bg-surface-container dark:bg-inverse-surface border border-outline-variant/60 dark:border-outline/40 rounded-lg p-1 text-xs shrink-0">
            <button type="button" className="p-1 px-2 hover:bg-surface-container-highest dark:hover:bg-inverse-surface/80 rounded transition-colors cursor-pointer focus:outline-none">
              <span className="material-symbols-outlined text-sm block">chevron_left</span>
            </button>
            <span className="px-3 font-semibold text-on-surface">Hoje: 01 de Junho</span>
            <button type="button" className="p-1 px-2 hover:bg-surface-container-highest dark:hover:bg-inverse-surface/80 rounded transition-colors cursor-pointer focus:outline-none">
              <span className="material-symbols-outlined text-sm block">chevron_right</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs py-2.5 px-4 rounded-lg shadow-sm cursor-pointer transition-colors focus:outline-none ml-auto"
          >
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Main timeline listing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Appointments Feed */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-outline-variant dark:border-outline/20 bg-surface-container-lowest dark:bg-inverse-surface space-y-4">
          <h4 className="font-label-md text-label-md text-outline uppercase tracking-wider font-semibold border-b dark:border-outline/20 pb-2">Grade Diária de Horários</h4>

          <div className="space-y-4">
            {appointments.length === 0 ? (
              <p className="text-xs text-outline italic text-center py-8">Nenhum compromisso agendado para o período.</p>
            ) : (
              appointments.sort((a, b) => a.time.localeCompare(b.time)).map((app) => {
                const patient = patients.find(p => p.id === app.patientId);
                const professional = professionals.find(p => p.id === app.professionalId);
                const procedure = procedures.find(p => p.id === app.procedureId);

                return (
                  <div 
                    key={app.id}
                    className={`glass-card rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:shadow-md transition-all relative border-l-4 ${getStatusBorderColor(app.status)}`}
                  >
                    {/* Left: time and details */}
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Time indicator */}
                      <div className="px-4 py-3 bg-surface-container dark:bg-inverse-surface rounded-lg text-center shrink-0 min-w-20 border border-outline-variant/30">
                        <span className="font-title-md text-title-md font-bold text-on-surface block leading-none mb-1">{app.time}</span>
                        <span className="font-label-sm text-[10px] text-on-surface-variant uppercase block font-semibold">{app.duration} min</span>
                      </div>
                      
                      <div className="min-w-0">
                        {/* Patient */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-title-sm text-title-sm font-semibold text-on-surface truncate">
                            {patient ? patient.name : 'Paciente Não Cadastrado'}
                          </p>
                          {patient?.hasMedicalAlert && (
                            <span 
                              className="text-[9px] bg-error/10 text-error border border-error/25 font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0"
                              title={patient.medicalAlertDescription}
                            >
                              Alerta Médico
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-outline font-medium">
                          <span>Dr(a). {professional ? professional.name.split(' ')[1] : 'N/A'}</span>
                          <span className="opacity-50">•</span>
                          <span>Procedimento: <strong className="text-on-surface-variant">{procedure ? procedure.name : 'Consulta Geral'}</strong></span>
                          <span className="opacity-50">•</span>
                          <span className="font-mono text-primary dark:text-primary-fixed-dim font-bold">R$ {app.value.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: CRM action & status triggers */}
                    <div className="flex flex-col items-end gap-2 shrink-0 w-full sm:w-auto">
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        {/* WhatsApp CRM Trigger */}
                        {app.status === 'pending' && (
                          <button
                            onClick={() => simulateNotification(app)}
                            disabled={alertMsg !== null}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-300/25 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 focus:outline-none"
                            title="Confirmar Presença automatizada"
                          >
                            <span className="material-symbols-outlined text-[14px]">chat</span>
                            <span>Lembrete</span>
                          </button>
                        )}

                        {/* Status Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide shrink-0 ${getStatusBadgeStyles(app.status)}`}>
                          {app.status}
                        </span>
                      </div>

                      {/* State transitions */}
                      <div className="flex gap-1.5 justify-end w-full">
                        {app.status !== 'completed' && app.status !== 'cancelled' && (
                          <>
                            {app.status === 'confirmed' && (
                              <button
                                onClick={() => handleChangeStatus(app.id, 'in_progress')}
                                className="px-2.5 py-1 border border-outline-variant hover:bg-primary hover:text-on-primary rounded text-[10px] font-semibold transition-all cursor-pointer focus:outline-none"
                              >
                                Chamar
                              </button>
                            )}
                            {app.status === 'in_progress' && (
                              <button
                                onClick={() => handleChangeStatus(app.id, 'completed')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold transition-all cursor-pointer focus:outline-none"
                              >
                                Finalizar
                              </button>
                            )}
                            {app.status !== 'in_progress' && (
                              <button
                                onClick={() => handleChangeStatus(app.id, 'confirmed')}
                                className="px-2.5 py-1 border border-outline-variant hover:bg-surface-container rounded text-[10px] font-semibold text-on-surface-variant transition-all cursor-pointer focus:outline-none"
                              >
                                Confirmar
                              </button>
                            )}
                            <button
                              onClick={() => handleChangeStatus(app.id, 'cancelled')}
                              className="px-2.5 py-1 border border-error/30 text-error hover:bg-error hover:text-on-error rounded text-[10px] font-semibold transition-all cursor-pointer focus:outline-none"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Live CRM notification overlay */}
                    {alertMsg && alertMsg.id === app.id && (
                      <div className="absolute inset-0 bg-inverse-surface/90 flex items-center justify-center text-xs text-white p-4 rounded-xl z-20 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-emerald-400 animate-bounce">notifications_active</span>
                          <span className="font-semibold">{alertMsg.text}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar details & statistics widget */}
        <div className="col-span-1 space-y-4">
          <div className="p-6 rounded-xl border border-outline-variant dark:border-outline/20 bg-surface-container-lowest dark:bg-inverse-surface space-y-4">
            <h4 className="font-label-md text-label-md text-outline uppercase tracking-wider font-semibold border-b dark:border-outline/20 pb-2">Resumo Operacional</h4>
            <div className="space-y-3.5 text-xs text-on-surface-variant font-medium">
              <div className="flex justify-between pb-1.5 border-b dark:border-outline/20">
                <span className="text-outline">Total Hoje:</span>
                <span className="font-bold text-on-surface font-mono">{appointments.length} Consultas</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b dark:border-outline/20">
                <span className="text-outline">Confirmadas:</span>
                <span className="font-bold text-primary dark:text-primary-fixed-dim font-mono">{appointments.filter(a => a.status === 'confirmed').length}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b dark:border-outline/20">
                <span className="text-outline">Finalizadas:</span>
                <span className="font-bold text-emerald-500 font-mono">{appointments.filter(a => a.status === 'completed').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Horas Clínicas Ativas:</span>
                <span className="font-bold text-purple-500 font-mono">
                  {(appointments.reduce((sum, a) => sum + (a.status !== 'cancelled' ? a.duration : 0), 0) / 60).toFixed(1)}h
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary dark:text-primary-fixed-dim space-y-1">
            <span className="font-bold inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm font-semibold">info</span>
              <span>CRM Automatizado Ativado</span>
            </span>
            <p className="text-on-surface-variant leading-relaxed">
              Os lembretes automáticos funcionam em tempo real. Dispare a funcionalidade <strong>Lembrete</strong> em qualquer consulta pendente para simular a resposta automática do paciente via WhatsApp e seu auto-ajuste de status na agenda central!
            </p>
          </div>
        </div>

      </div>

      {/* Appointment Creation Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-inverse-surface/70 dark:bg-inverse-surface/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl p-6 border border-outline-variant bg-surface-container-lowest dark:bg-inverse-surface text-on-surface dark:text-inverse-on-surface space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-title-md text-title-md text-on-surface font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">calendar_month</span>
              <span>Novo Agendamento Clínico</span>
            </h3>

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs font-semibold text-on-surface-variant">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-outline">Paciente</label>
                <select
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all outline-none"
                >
                  <option value="">Selecione o paciente...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-outline">Profissional Conduzindo</label>
                <select
                  required
                  value={professionalId}
                  onChange={(e) => setProfessionalId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all outline-none"
                >
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.specialty || 'Clínico Geral'})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-outline">Procedimento Associado</label>
                <select
                  value={procedureId}
                  onChange={(e) => setProcedureId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all outline-none"
                >
                  <option value="">Consulta Simples / Diagnóstico Avulso (R$ 0)</option>
                  {procedures.map(proc => (
                    <option key={proc.id} value={proc.id}>{proc.name} (R$ {proc.finalPrice})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-outline">Data</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-outline">Horário</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-outline">Observações Internas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instruções clínicas de apoio..."
                  rows={2}
                  className="w-full px-3 py-2 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary-container text-on-primary p-2.5 rounded-lg font-semibold text-xs cursor-pointer text-center focus:outline-none"
                >
                  Confirmar Agendamento
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-outline-variant hover:bg-surface-container rounded-lg text-xs font-semibold cursor-pointer transition-colors focus:outline-none"
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
