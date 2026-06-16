/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Appointment, AppointmentStatus, Patient, Procedure, User } from '../types';
import { Button, Input, Modal } from './ui';
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

interface StatusStyle {
  accent: string;
  block: string;
  text: string;
  badge: string;
  label: string;
}

const START_HOUR = 8;
const END_HOUR = 18;
const HOUR_HEIGHT = 80;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);
const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const statusStyles: Record<AppointmentStatus, StatusStyle> = {
  completed: {
    accent: 'border-l-emerald-500',
    block: 'bg-emerald-100',
    text: 'text-emerald-700',
    badge: 'bg-emerald-500/10 text-emerald-700',
    label: 'Finalizado',
  },
  confirmed: {
    accent: 'border-l-blue-500',
    block: 'bg-blue-100',
    text: 'text-blue-700',
    badge: 'bg-primary/10 text-primary',
    label: 'Confirmado',
  },
  in_progress: {
    accent: 'border-l-violet-500',
    block: 'bg-violet-100',
    text: 'text-violet-700',
    badge: 'bg-violet-500/10 text-violet-700',
    label: 'Em atendimento',
  },
  pending: {
    accent: 'border-l-orange-500',
    block: 'bg-orange-100',
    text: 'text-orange-700',
    badge: 'bg-amber-500/10 text-amber-700',
    label: 'Pendente',
  },
  cancelled: {
    accent: 'border-l-error',
    block: 'bg-error-container',
    text: 'text-error',
    badge: 'bg-error/10 text-error',
    label: 'Cancelado',
  },
};

const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekStart = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const distanceFromMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + distanceFromMonday);
  start.setHours(0, 0, 0, 0);
  return start;
};

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const formatRange = (weekDays: Date[]) => {
  const first = weekDays[0];
  const last = weekDays[6];
  const sameMonth = first.getMonth() === last.getMonth();
  const firstLabel = first.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const lastLabel = last.toLocaleDateString('en-US', {
    month: sameMonth ? undefined : 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${firstLabel} - ${lastLabel}`;
};

const getTimeRange = (appointment: Appointment) => {
  const [hour, minute] = appointment.time.split(':').map(Number);
  const start = new Date();
  start.setHours(hour, minute, 0, 0);
  const end = new Date(start.getTime() + appointment.duration * 60 * 1000);
  const fmt = (date: Date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${fmt(start)} - ${fmt(end)}`;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function AgendaPanel({
  tenantId,
  appointments,
  patients,
  procedures,
  professionals,
  onRefresh,
}: AgendaPanelProps) {
  const initialDate = appointments[0]?.date || toDateKey(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [professionalFilter, setProfessionalFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('room_102');
  const [patientId, setPatientId] = useState('');
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id || '');
  const [procedureId, setProcedureId] = useState('');
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [alertMsg, setAlertMsg] = useState<{ id: string; text: string } | null>(null);

  const weekDays = useMemo(() => {
    const weekStart = getWeekStart(parseLocalDate(selectedDate));
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  }, [selectedDate]);

  const selectedAppointment = useMemo(
    () => appointments.find(appointment => appointment.id === selectedAppointmentId) || null,
    [appointments, selectedAppointmentId]
  );

  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      if (professionalFilter !== 'all' && appointment.professionalId !== professionalFilter) {
        return false;
      }

      return weekDays.some(day => toDateKey(day) === appointment.date);
    });
  }, [appointments, professionalFilter, weekDays]);

  const appointmentsByDate = useMemo(() => {
    return filteredAppointments.reduce<Record<string, Appointment[]>>((acc, appointment) => {
      acc[appointment.date] = [...(acc[appointment.date] || []), appointment];
      return acc;
    }, {});
  }, [filteredAppointments]);

  const weekMetrics = useMemo(() => {
    const activeAppointments = filteredAppointments.filter(appointment => appointment.status !== 'cancelled');
    return {
      total: filteredAppointments.length,
      confirmed: filteredAppointments.filter(appointment => appointment.status === 'confirmed').length,
      pending: filteredAppointments.filter(appointment => appointment.status === 'pending').length,
      hours: activeAppointments.reduce((sum, appointment) => sum + appointment.duration, 0) / 60,
    };
  }, [filteredAppointments]);

  const findPatient = (id: string) => patients.find(patient => patient.id === id);
  const findProfessional = (id: string) => professionals.find(professional => professional.id === id);
  const findProcedure = (id?: string) => procedures.find(procedure => procedure.id === id);

  const handleCreateAppointment = (event: React.FormEvent) => {
    event.preventDefault();
    if (!patientId || !professionalId) return;

    const procedure = findProcedure(procedureId);
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
      value: procedure ? procedure.finalPrice : 0,
    };

    dbObj.saveAppointment(newAppointment);

    const patientName = findPatient(patientId)?.name || 'Paciente';
    dbObj.logAction(
      dbObj.currentUser.id,
      dbObj.currentUser.name,
      dbObj.currentUser.role,
      'Agendamento Consulta',
      `Criou consulta para ${patientName} no dia ${date} às ${time}.`,
      tenantId
    );

    setPatientId('');
    setProcedureId('');
    setNotes('');
    setSelectedDate(date);
    setShowAddModal(false);
    onRefresh();
  };

  const handleChangeStatus = (appointmentId: string, newStatus: AppointmentStatus) => {
    const appointment = appointments.find(item => item.id === appointmentId);
    if (!appointment) return;

    const updated = { ...appointment, status: newStatus };
    dbObj.saveAppointment(updated);

    const patient = findPatient(appointment.patientId);
    dbObj.logAction(
      dbObj.currentUser.id,
      dbObj.currentUser.name,
      dbObj.currentUser.role,
      'Status de Consulta Alterado',
      `Alterou o status da consulta do paciente "${patient?.name || 'N/A'}" de "${appointment.status}" para "${newStatus}".`,
      tenantId
    );

    onRefresh();
  };

  const simulateNotification = (appointment: Appointment) => {
    const patient = findPatient(appointment.patientId);
    if (!patient) return;

    setAlertMsg({
      id: appointment.id,
      text: `Disparando CRM automatizado para ${patient.name} (${patient.phone})...`,
    });

    window.setTimeout(() => {
      setAlertMsg({
        id: appointment.id,
        text: `Paciente confirmou presença. Status alterado para confirmado.`,
      });

      dbObj.saveAppointment({ ...appointment, status: 'confirmed' });
      dbObj.logAction(
        'automated_crm',
        'CRM EasyClin Bot',
        'receptionist',
        'Confirmação CRM Automática',
        `Disparou aviso de WhatsApp para ${patient.name}. Recebeu resposta afirmativa. Status da consulta id: ${appointment.id} modificado para Confirmado.`,
        tenantId
      );

      onRefresh();
      window.setTimeout(() => setAlertMsg(null), 4000);
    }, 1800);
  };

  const moveWeek = (direction: -1 | 1) => {
    const nextDate = addDays(parseLocalDate(selectedDate), direction * 7);
    setSelectedDate(toDateKey(nextDate));
    setDate(toDateKey(nextDate));
    setSelectedAppointmentId(null);
  };

  const openCreationModal = () => {
    setDate(selectedDate);
    setShowAddModal(true);
  };

  const getAppointmentPosition = (appointment: Appointment) => {
    const [hour, minute] = appointment.time.split(':').map(Number);
    const startMinutes = hour * 60 + minute - START_HOUR * 60;
    const visibleMinutes = (END_HOUR - START_HOUR + 1) * 60;
    const top = Math.min(Math.max(startMinutes, 0), visibleMinutes) * (HOUR_HEIGHT / 60);
    const height = Math.max(54, Math.min(appointment.duration * (HOUR_HEIGHT / 60), HOUR_HEIGHT * 2.4));
    return { top, height };
  };

  const todayKey = toDateKey(new Date());
  const selectedDayKey = selectedAppointment?.date || selectedDate;
  const currentTimeTop = (() => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes() - START_HOUR * 60;
    if (!weekDays.some(day => toDateKey(day) === todayKey) || minutes < 0 || minutes > (END_HOUR - START_HOUR + 1) * 60) {
      return null;
    }
    return minutes * (HOUR_HEIGHT / 60);
  })();

  const formInput = 'w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-all';

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div>
              <h2 className="text-xl font-semibold leading-7 text-on-surface">Medical Agenda</h2>
              <p className="mt-1 text-xs font-medium text-outline">
                {weekMetrics.total} consultas na semana · {weekMetrics.hours.toFixed(1)}h clínicas ativas
              </p>
            </div>

            <div className="inline-flex w-fit items-center rounded-xl bg-surface-container p-1">
              {['Day', 'Week', 'Month'].map(view => (
                <button
                  key={view}
                  type="button"
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    view === 'Week'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
                person
              </span>
              <select
                value={professionalFilter}
                onChange={event => setProfessionalFilter(event.target.value)}
                className="h-11 w-full min-w-0 appearance-none rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-9 text-sm font-medium text-on-surface outline-none transition-all hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-56"
              >
                <option value="all">Todos profissionais</option>
                {professionals.map(professional => (
                  <option key={professional.id} value={professional.id}>
                    {professional.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[20px] text-outline">
                expand_more
              </span>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
                meeting_room
              </span>
              <select
                value={roomFilter}
                onChange={event => setRoomFilter(event.target.value)}
                className="h-11 w-full min-w-0 appearance-none rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-9 text-sm font-medium text-on-surface outline-none transition-all hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-44"
              >
                <option value="room_102">Room 102</option>
                <option value="room_101">Room 101</option>
                <option value="room_201">Room 201</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[20px] text-outline">
                expand_more
              </span>
            </div>

            <div className="col-span-2 flex items-center justify-center gap-3 border-outline-variant sm:border-l sm:pl-4">
              <button
                type="button"
                onClick={() => moveWeek(-1)}
                className="rounded-full p-2 text-secondary transition-all hover:bg-surface-container hover:text-primary active:scale-95"
                aria-label="Semana anterior"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="min-w-40 text-center text-base font-bold text-on-surface">{formatRange(weekDays)}</span>
              <button
                type="button"
                onClick={() => moveWeek(1)}
                className="rounded-full p-2 text-secondary transition-all hover:bg-surface-container hover:text-primary active:scale-95"
                aria-label="Próxima semana"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>

            <Button type="button" variant="primary" className="col-span-2 h-11 gap-2 rounded-full shadow-lg shadow-primary/20 sm:hidden" onClick={openCreationModal}>
              <span className="material-symbols-outlined text-[18px]">add_task</span>
              Novo Agendamento
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricPill label="Confirmadas" value={weekMetrics.confirmed} tone="text-primary" />
          <MetricPill label="Pendentes" value={weekMetrics.pending} tone="text-amber-700" />
          <MetricPill label="CRM ativo" value={alertMsg ? 'Em execução' : 'Pronto'} tone="text-emerald-700" />
        </div>
      </section>

      {alertMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
          <span className="material-symbols-outlined text-[20px]">forum</span>
          <span>{alertMsg.text}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[80px_repeat(7,minmax(120px,1fr))] border-b border-outline-variant bg-surface-container-low/50">
              <div className="flex items-center justify-center border-r border-outline-variant p-4">
                <span className="material-symbols-outlined text-outline">schedule</span>
              </div>
              {weekDays.map((day, index) => {
                const dateKey = toDateKey(day);
                const active = dateKey === selectedDayKey || dateKey === todayKey;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateKey);
                      setDate(dateKey);
                      setSelectedAppointmentId(null);
                    }}
                    className={`border-r border-outline-variant p-4 text-center transition-colors last:border-r-0 ${
                      active ? 'bg-primary-container/5' : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <div className={`text-xs font-semibold uppercase tracking-wider ${active ? 'text-primary' : 'text-outline'}`}>
                      {WEEKDAY_LABELS[index]}
                    </div>
                    <div className={`mt-1 text-xl font-bold leading-6 ${active ? 'text-primary' : 'text-on-surface'}`}>
                      {day.getDate()}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="relative max-h-[700px] overflow-y-auto">
              <div className="grid grid-cols-[80px_repeat(7,minmax(120px,1fr))]">
                <div className="border-r border-outline-variant">
                  {HOURS.map(hour => (
                    <div
                      key={hour}
                      style={{ height: HOUR_HEIGHT }}
                      className="border-b border-outline-variant/30 p-2 text-right text-sm font-medium text-outline"
                    >
                      {String(hour).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {weekDays.map(day => {
                  const dateKey = toDateKey(day);
                  const isToday = dateKey === todayKey;

                  return (
                    <div
                      key={dateKey}
                      className={`relative border-r border-outline-variant/30 last:border-r-0 ${
                        isToday ? 'bg-primary-container/[0.02]' : ''
                      }`}
                      style={{ height: HOURS.length * HOUR_HEIGHT }}
                    >
                      {HOURS.map(hour => (
                        <button
                          key={hour}
                          type="button"
                          onClick={() => {
                            setDate(dateKey);
                            setTime(`${String(hour).padStart(2, '0')}:00`);
                            setShowAddModal(true);
                          }}
                          style={{ height: HOUR_HEIGHT }}
                          className="block w-full border-b border-outline-variant/10 text-left transition-colors hover:bg-primary/5"
                          aria-label={`Criar agendamento em ${dateKey} às ${hour}:00`}
                        />
                      ))}

                      {(appointmentsByDate[dateKey] || []).map(appointment => {
                        const patient = findPatient(appointment.patientId);
                        const procedure = findProcedure(appointment.procedureId);
                        const professional = findProfessional(appointment.professionalId);
                        const style = statusStyles[appointment.status];
                        const position = getAppointmentPosition(appointment);

                        return (
                          <button
                            key={appointment.id}
                            type="button"
                            onClick={event => {
                              event.stopPropagation();
                              setSelectedAppointmentId(appointment.id);
                              setSelectedDate(appointment.date);
                            }}
                            style={{ top: position.top + 5, height: position.height - 10 }}
                            className={`absolute left-1 right-1 z-10 rounded-lg border-l-4 p-2 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${style.block} ${style.accent}`}
                          >
                            <span className={`block truncate text-[11px] font-bold ${style.text}`}>
                              {procedure?.category || style.label}
                            </span>
                            <span className="mt-1 block truncate text-sm font-bold leading-5 text-on-surface">
                              {patient?.name || 'Paciente'}
                            </span>
                            <span className={`mt-0.5 block truncate text-[11px] font-medium ${style.text}`}>
                              {getTimeRange(appointment)}
                            </span>
                            {professional && (
                              <span className="mt-1 hidden truncate text-[10px] font-medium text-on-surface-variant xl:block">
                                {professional.name}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {currentTimeTop !== null && (
                <div
                  style={{ top: currentTimeTop }}
                  className="pointer-events-none absolute left-20 right-0 z-30 flex items-center"
                >
                  <div className="-ml-1.5 h-3 w-3 rounded-full bg-error" />
                  <div className="h-0.5 flex-1 bg-error" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {selectedAppointment && (
        <AppointmentDetails
          appointment={selectedAppointment}
          patient={findPatient(selectedAppointment.patientId)}
          professional={findProfessional(selectedAppointment.professionalId)}
          procedure={findProcedure(selectedAppointment.procedureId)}
          onClose={() => setSelectedAppointmentId(null)}
          onNotify={() => simulateNotification(selectedAppointment)}
          onStatusChange={status => handleChangeStatus(selectedAppointment.id, status)}
        />
      )}

      {showAddModal && (
        <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Novo Agendamento Clínico">
          <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs font-semibold text-on-surface-variant">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Paciente</label>
              <select required value={patientId} onChange={event => setPatientId(event.target.value)} className={formInput}>
                <option value="">Selecione o paciente...</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} ({patient.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Profissional</label>
              <select required value={professionalId} onChange={event => setProfessionalId(event.target.value)} className={formInput}>
                {professionals.map(professional => (
                  <option key={professional.id} value={professional.id}>
                    {professional.name} ({professional.specialty || 'Clínico Geral'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Procedimento</label>
              <select value={procedureId} onChange={event => setProcedureId(event.target.value)} className={formInput}>
                <option value="">Consulta simples / diagnóstico avulso</option>
                {procedures.map(procedure => (
                  <option key={procedure.id} value={procedure.id}>
                    {procedure.name} ({formatCurrency(procedure.finalPrice)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Data</label>
                <Input type="date" required value={date} onChange={event => setDate(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Horário</label>
                <Input type="time" required value={time} onChange={event => setTime(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Duração</label>
                <Input
                  type="number"
                  min={15}
                  step={15}
                  required
                  value={duration}
                  onChange={event => setDuration(Number(event.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Observações Internas</label>
              <textarea
                value={notes}
                onChange={event => setNotes(event.target.value)}
                placeholder="Instruções clínicas de apoio..."
                rows={3}
                className={formInput}
              />
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Button type="submit" className="flex-1 rounded-lg" variant="primary">
                Confirmar Agendamento
              </Button>
              <Button type="button" onClick={() => setShowAddModal(false)} variant="secondary" className="rounded-lg">
                Cancelar
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function MetricPill({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-wider text-outline">{label}</span>
      <span className={`text-sm font-bold tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}

function AppointmentDetails({
  appointment,
  patient,
  professional,
  procedure,
  onClose,
  onNotify,
  onStatusChange,
}: {
  appointment: Appointment;
  patient?: Patient;
  professional?: User;
  procedure?: Procedure;
  onClose: () => void;
  onNotify: () => void;
  onStatusChange: (status: AppointmentStatus) => void;
}) {
  const style = statusStyles[appointment.status];

  return (
    <aside className="fixed bottom-6 right-6 z-40 w-[calc(100vw-3rem)] max-w-sm rounded-xl border border-outline-variant bg-surface-container-lowest/95 p-5 text-on-surface shadow-2xl backdrop-blur">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary-container bg-primary/10 text-base font-bold text-primary">
            {(patient?.name || 'P').charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold">{patient?.name || 'Paciente'}</h3>
            <p className="truncate text-xs font-medium text-outline">{professional?.name || 'Profissional nao definido'}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-secondary transition-colors hover:bg-surface-container">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="mb-5 space-y-3 text-sm">
        <DetailRow icon="event" text={parseLocalDate(appointment.date).toLocaleDateString('pt-BR')} />
        <DetailRow icon="schedule" text={`${getTimeRange(appointment)} (${appointment.duration} min)`} />
        <DetailRow
          icon="medical_information"
          text={procedure?.name || 'Consulta simples'}
          badgeClass={`${style.badge} rounded px-2 py-0.5 text-xs font-bold`}
        />
        <DetailRow icon="payments" text={formatCurrency(appointment.value)} />
        {appointment.notes && <p className="rounded-lg bg-surface-container p-3 text-xs leading-relaxed text-on-surface-variant">{appointment.notes}</p>}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as AppointmentStatus[]).map(status => (
          <button
            key={status}
            type="button"
            onClick={() => onStatusChange(status)}
            className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
              appointment.status === status ? statusStyles[status].badge : 'bg-surface-container text-secondary hover:bg-surface-container-high'
            }`}
          >
            {statusStyles[status].label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onNotify}
          className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-on-primary transition-all hover:brightness-110 active:scale-95"
        >
          Lembrete CRM
        </button>
        <button
          type="button"
          onClick={() => onStatusChange('in_progress')}
          className="flex-1 rounded-lg border border-outline-variant py-2 text-sm font-bold text-secondary transition-colors hover:bg-surface-container"
        >
          Check-in
        </button>
      </div>
    </aside>
  );
}

function DetailRow({ icon, text, badgeClass }: { icon: string; text: string; badgeClass?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
      {badgeClass ? <span className={badgeClass}>{text}</span> : <span className="font-medium text-on-surface">{text}</span>}
    </div>
  );
}
