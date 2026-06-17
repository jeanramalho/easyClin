/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Button, Input, Card, Modal } from './ui';
import { Patient, MedicalRecordEntry, User } from '../types';
import { dbObj } from '../services/db';

interface PatientPanelProps {
  tenantId: string;
  patients: Patient[];
  professionals: User[];
  onRefresh: () => void;
  darkMode: boolean;
}

const inputClass =
  'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-surface-container-lowest border-outline-variant text-on-surface placeholder-outline';

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(part => part.charAt(0).toUpperCase()).join('');
};

const formatDate = (value?: string, options?: Intl.DateTimeFormatOptions) => {
  if (!value) return 'Sem registro';
  return new Date(value).toLocaleDateString('pt-BR', options || {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const calculateAge = (birthDate: string) => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return Number.isFinite(age) ? age : 0;
};

export default function PatientPanel({
  tenantId,
  patients,
  professionals,
  onRefresh,
}: PatientPanelProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(patients[0] || null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');

  // Patient form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [gender, setGender] = useState('Masculino');
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [hasMedicalAlert, setHasMedicalAlert] = useState(false);
  const [medicalAlertDescription, setMedicalAlertDescription] = useState('');

  // Medical Record Form states
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [evolutionNotes, setEvolutionNotes] = useState('');
  const [profId] = useState(dbObj.currentUser.id);

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newPatient: Patient = {
      id: `pat_${Math.random().toString(36).substring(2, 9)}`,
      tenantId,
      name,
      email,
      phone,
      document,
      gender,
      birthDate,
      status: 'active',
      hasMedicalAlert,
      medicalAlertDescription: hasMedicalAlert ? medicalAlertDescription : undefined,
      createdAt: new Date().toISOString(),
    };

    dbObj.savePatient(newPatient);
    dbObj.logAction(
      dbObj.currentUser.id,
      dbObj.currentUser.name,
      dbObj.currentUser.role,
      'Cadastro de Paciente',
      `Cadastrou novo paciente ${name} no banco de dados. No-allergies: ${!hasMedicalAlert}`,
      tenantId
    );

    setName('');
    setPhone('');
    setEmail('');
    setDocument('');
    setHasMedicalAlert(false);
    setMedicalAlertDescription('');
    setSelectedPatient(newPatient);
    setShowAddModal(false);
    onRefresh();
  };

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const newRecord: MedicalRecordEntry = {
      id: `rc_${Math.random().toString(36).substring(2, 9)}`,
      tenantId,
      patientId: selectedPatient.id,
      professionalId: profId,
      date: new Date().toISOString(),
      symptoms,
      diagnosis,
      prescription,
      evolutionNotes,
      isLocked: false,
    };

    dbObj.saveMedicalRecord(newRecord);
    dbObj.logAction(
      dbObj.currentUser.id,
      dbObj.currentUser.name,
      dbObj.currentUser.role,
      'Evolução Prontuário Criada',
      `Iniciou rascunho de prontuário clínico para o paciente ${selectedPatient.name}.`,
      tenantId
    );

    setSymptoms('');
    setDiagnosis('');
    setPrescription('');
    setEvolutionNotes('');
    onRefresh();
  };

  const handleLockRecord = (record: MedicalRecordEntry) => {
    if (!selectedPatient) return;

    const lockedRecord: MedicalRecordEntry = { ...record, isLocked: true };
    dbObj.saveMedicalRecord(lockedRecord);
    dbObj.logAction(
      dbObj.currentUser.id,
      dbObj.currentUser.name,
      dbObj.currentUser.role,
      'Bloqueio de Prontuário LGP-D',
      `Assinou e selou permanentemente a evolução clinica (${record.id}) de ${selectedPatient.name}. O registro agora tornou-se imutável e auditado.`,
      tenantId
    );
    onRefresh();
  };

  const records = selectedPatient ? dbObj.getMedicalRecords(tenantId, selectedPatient.id) : [];
  const latestRecord = records[0];
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.document?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const activePatients = patients.filter(patient => patient.status === 'active').length;
  const alertPatients = patients.filter(patient => patient.hasMedicalAlert).length;
  const newThisMonth = patients.filter(patient => {
    const createdAt = new Date(patient.createdAt);
    const today = new Date();
    return createdAt.getMonth() === today.getMonth() && createdAt.getFullYear() === today.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">Fichas e Prontuários</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Gestão de pacientes, alertas clínicos, evoluções e assinatura LGPD.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm font-semibold text-secondary transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filtros
          </button>
          <Button type="button" variant="primary" className="h-10 gap-2 rounded-lg" onClick={() => setShowAddModal(true)}>
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Novo Paciente
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon="groups" label="Total Pacientes" value={patients.length} helper="Base clínica atual" tone="primary" />
        <MetricCard icon="person_check" label="Ativos Agora" value={activePatients} helper={`${Math.round((activePatients / (patients.length || 1)) * 100)}% da base`} tone="success" />
        <MetricCard icon="emergency" label="Alertas Médicos" value={alertPatients} helper="Requerem atenção no atendimento" tone="error" />
        <MetricCard icon="add_reaction" label="Novos no Mês" value={newThisMonth} helper="Cadastros recentes" tone="tertiary" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card className="min-w-0">
          <div className="border-b border-outline-variant px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-on-surface">Listagem de Pacientes</h3>
                <p className="mt-0.5 text-xs text-outline">Selecione um paciente para abrir o prontuário.</p>
              </div>
              <span className="w-fit rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                {filteredPatients.length} exibidos
              </span>
            </div>
            <div className="relative mt-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">search</span>
              <Input
                placeholder="Buscar por nome, CPF, telefone ou e-mail..."
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/70">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-outline">Paciente</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-outline">CPF</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-outline">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filteredPatients.map(patient => (
                  <tr
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`group cursor-pointer transition-colors hover:bg-surface-container-low ${
                      selectedPatient?.id === patient.id ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="px-5 py-4">
                      <PatientIdentity patient={patient} selected={selectedPatient?.id === patient.id} />
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-secondary">{patient.document || 'Sem CPF'}</td>
                    <td className="px-5 py-4">
                      <PatientStatusBadge patient={patient} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 p-3 lg:hidden">
            {filteredPatients.map(patient => (
              <button
                key={patient.id}
                type="button"
                onClick={() => setSelectedPatient(patient)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedPatient?.id === patient.id
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <PatientIdentity patient={patient} selected={selectedPatient?.id === patient.id} />
                  <PatientStatusBadge patient={patient} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-outline">
                  <span className="font-mono">{patient.document || 'Sem CPF'}</span>
                  <span className="text-right">{patient.phone}</span>
                </div>
              </button>
            ))}
          </div>

          {filteredPatients.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <span className="material-symbols-outlined mb-3 text-5xl text-outline">group_off</span>
              <h4 className="text-sm font-bold text-on-surface">Nenhum paciente encontrado</h4>
              <p className="mt-1 max-w-72 text-xs leading-relaxed text-outline">
                Ajuste a busca ou cadastre um novo paciente para iniciar a ficha clínica.
              </p>
            </div>
          )}
        </Card>

        <div className="min-w-0 space-y-6">
          {selectedPatient ? (
            <>
              <PatientSummaryCard patient={selectedPatient} recordsCount={records.length} latestRecordDate={latestRecord?.date} />

              <nav className="flex gap-6 overflow-x-auto border-b border-outline-variant">
                {['Evolução', 'Prescrições', 'Anexos/Exames', 'Histórico', 'Faturamento'].map((tab, index) => (
                  <button
                    key={tab}
                    type="button"
                    className={`shrink-0 border-b-2 px-1 pb-3 text-sm transition-colors ${
                      index === 0
                        ? 'border-primary font-bold text-primary'
                        : 'border-transparent font-semibold text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <ClinicalTimeline
                  records={records}
                  professionals={professionals}
                  onLockRecord={handleLockRecord}
                />

                <NewRecordForm
                  patient={selectedPatient}
                  symptoms={symptoms}
                  diagnosis={diagnosis}
                  prescription={prescription}
                  evolutionNotes={evolutionNotes}
                  onSymptomsChange={setSymptoms}
                  onDiagnosisChange={setDiagnosis}
                  onPrescriptionChange={setPrescription}
                  onEvolutionNotesChange={setEvolutionNotes}
                  onSubmit={handleCreateRecord}
                />
              </div>
            </>
          ) : (
            <div className="flex min-h-100 flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container/30 p-8 text-center">
              <span className="material-symbols-outlined mb-3 text-5xl text-outline">person_search</span>
              <h4 className="text-sm font-semibold text-on-surface-variant">Selecione um paciente</h4>
              <p className="mt-1.5 max-w-64 text-[11px] leading-relaxed text-outline">
                Escolha um paciente na listagem para acessar o prontuário, histórico clínico e prescrições.
              </p>
            </div>
          )}
        </div>
      </section>

      {showAddModal && (
        <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Cadastro de Novo Paciente">
          <form onSubmit={handleCreatePatient} className="space-y-6">
            <FormSection icon="person" title="Dados Pessoais">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-on-surface-variant">Nome Completo *</label>
                  <Input
                    type="text"
                    required
                    placeholder="Ex: Carlos Henrique Albuquerque"
                    value={name}
                    onChange={event => setName(event.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-on-surface-variant">CPF *</label>
                  <Input
                    type="text"
                    required
                    placeholder="123.456.789-10"
                    value={document}
                    onChange={event => setDocument(event.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-on-surface-variant">Data de Nascimento *</label>
                  <Input
                    type="date"
                    required
                    value={birthDate}
                    onChange={event => setBirthDate(event.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection icon="call" title="Contato">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-on-surface-variant">WhatsApp / Telefone *</label>
                  <Input
                    type="text"
                    required
                    placeholder="(11) 99999-8888"
                    value={phone}
                    onChange={event => setPhone(event.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-on-surface-variant">E-mail</label>
                  <Input
                    type="email"
                    placeholder="paciente@email.com"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection icon="health_and_safety" title="Ficha Clínica">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-on-surface-variant">Sexo/Gênero</label>
                  <select value={gender} onChange={event => setGender(event.target.value)} className={inputClass}>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className={`rounded-lg border p-3 ${hasMedicalAlert ? 'border-error/30 bg-error/5' : 'border-outline-variant bg-surface-container-lowest'}`}>
                  <button
                    type="button"
                    onClick={() => setHasMedicalAlert(!hasMedicalAlert)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <span className={`text-xs font-bold ${hasMedicalAlert ? 'text-error' : 'text-on-surface-variant'}`}>
                      Alerta médico crítico
                    </span>
                    <span className={`relative h-5 w-10 rounded-full transition-colors ${hasMedicalAlert ? 'bg-error' : 'bg-outline/40'}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface-container-lowest transition-all ${hasMedicalAlert ? 'left-5' : 'left-0.5'}`} />
                    </span>
                  </button>
                </div>
              </div>
              {hasMedicalAlert && (
                <Input
                  type="text"
                  required
                  placeholder="Ex: Alérgico a Penicilina / Cardiopata / Diabético..."
                  value={medicalAlertDescription}
                  onChange={event => setMedicalAlertDescription(event.target.value)}
                  className={`${inputClass} mt-4 border-error/40 focus:ring-error/20`}
                />
              )}
            </FormSection>

            <div className="flex flex-col-reverse gap-3 border-t border-outline-variant pt-4 sm:flex-row sm:justify-end">
              <Button type="button" onClick={() => setShowAddModal(false)} variant="secondary" className="rounded-lg">
                Cancelar
              </Button>
              <Button type="submit" variant="primary" className="rounded-lg px-6">
                Salvar Cadastro
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: string;
  label: string;
  value: number;
  helper: string;
  tone: 'primary' | 'success' | 'error' | 'tertiary';
}) {
  const toneClass = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-600',
    error: 'bg-error/10 text-error',
    tertiary: 'bg-tertiary-fixed text-tertiary',
  }[tone];

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-outline">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
      </div>
      <div className="text-2xl font-bold text-on-surface">{value.toLocaleString('pt-BR')}</div>
      <p className="mt-1 text-xs font-medium text-on-surface-variant">{helper}</p>
    </div>
  );
}

function PatientIdentity({ patient, selected }: { patient: Patient; selected: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${
        selected ? 'bg-primary text-on-primary' : 'bg-primary-container/15 text-primary'
      }`}>
        {getInitials(patient.name)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-on-surface">{patient.name}</p>
        <p className="truncate text-xs text-outline">{patient.email || patient.phone}</p>
      </div>
    </div>
  );
}

function PatientStatusBadge({ patient }: { patient: Patient }) {
  if (patient.hasMedicalAlert) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-error">
        <span className="material-symbols-outlined text-[13px]">warning</span>
        Alerta
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
      Ativo
    </span>
  );
}

function PatientSummaryCard({
  patient,
  recordsCount,
  latestRecordDate,
}: {
  patient: Patient;
  recordsCount: number;
  latestRecordDate?: string;
}) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="relative w-fit">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-on-primary">
            {getInitials(patient.name)}
          </div>
          <span className="absolute -bottom-2 -right-2 rounded bg-primary-container px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-primary">
            Paciente
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-bold leading-tight text-on-surface">{patient.name}</h3>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">ATIVO</span>
            {patient.hasMedicalAlert && (
              <span className="rounded-full bg-error/10 px-3 py-1 text-xs font-bold text-error">ALERTA MEDICO</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <SummaryFact label="Idade" value={`${calculateAge(patient.birthDate)} anos`} detail={formatDate(patient.birthDate)} />
            <SummaryFact label="Telefone" value={patient.phone} detail="WhatsApp principal" />
            <SummaryFact label="Prontuário" value={`${recordsCount} registros`} detail="Evoluções clínicas" />
            <SummaryFact label="Última evolução" value={formatDate(latestRecordDate, { day: '2-digit', month: 'short' })} detail={latestRecordDate ? 'Registrada no histórico' : 'Sem lançamentos'} />
          </div>
        </div>
      </div>

      {patient.hasMedicalAlert && (
        <div className="mt-5 flex gap-3 rounded-xl border border-error/20 bg-error/10 p-3">
          <span className="material-symbols-outlined shrink-0 text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
            emergency
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-error">Alerta Médico Crítico</p>
            <p className="mt-1 text-sm leading-relaxed text-error/80">{patient.medicalAlertDescription}</p>
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryFact({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-outline">{label}</span>
      <span className="mt-1 block truncate text-sm font-bold text-on-surface">{value}</span>
      <span className="mt-0.5 block truncate text-[10px] text-on-surface-variant">{detail}</span>
    </div>
  );
}

function ClinicalTimeline({
  records,
  professionals,
  onLockRecord,
}: {
  records: MedicalRecordEntry[];
  professionals: User[];
  onLockRecord: (record: MedicalRecordEntry) => void;
}) {
  return (
    <section className="relative min-w-0">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-on-surface">Linha do Tempo Clínica</h3>
          <p className="text-xs text-outline">{records.length} registros no prontuário.</p>
        </div>
        <span className="w-fit rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
          Evolução
        </span>
      </div>

      {records.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container/30 p-8 text-center">
          <span className="material-symbols-outlined mb-3 text-5xl text-outline">medical_information</span>
          <h4 className="text-sm font-bold text-on-surface">Prontuário vazio</h4>
          <p className="mt-1 max-w-72 text-xs leading-relaxed text-outline">
            Crie uma evolução clínica para iniciar o histórico deste paciente.
          </p>
        </div>
      ) : (
        <div className="relative space-y-5 before:absolute before:left-5 before:top-4 before:bottom-0 before:w-px before:bg-surface-container-high">
          {records.map(record => {
            const professional = professionals.find(item => item.id === record.professionalId);
            return (
              <article key={record.id} className="relative pl-12">
                <div className={`absolute left-[15px] top-2 h-3 w-3 rounded-full ring-4 ${
                  record.isLocked ? 'bg-emerald-500 ring-emerald-500/15' : 'bg-primary ring-primary/15'
                }`} />
                <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm transition-colors hover:border-primary/40">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        record.isLocked ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-700'
                      }`}>
                        <span className="material-symbols-outlined text-[13px]">{record.isLocked ? 'verified' : 'edit_note'}</span>
                        {record.isLocked ? 'Assinado LGPD' : 'Rascunho Clínico'}
                      </span>
                      <h4 className="mt-2 text-base font-bold text-on-surface">{record.diagnosis || 'Evolução clínica'}</h4>
                    </div>
                    <time className="text-xs font-medium text-outline">{formatDate(record.date)} às {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                  </div>

                  <div className="space-y-3 text-sm leading-relaxed text-on-surface-variant">
                    {record.symptoms && (
                      <ClinicalField label="Queixa principal" value={record.symptoms} />
                    )}
                    {record.evolutionNotes && (
                      <ClinicalField label="Evolução / Conduta" value={record.evolutionNotes} />
                    )}
                    {record.prescription && (
                      <div className="rounded-lg bg-surface-container p-3 font-mono text-xs text-on-surface-variant">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-outline">Prescrição</span>
                        {record.prescription}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-3 border-t border-surface-container pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-medium text-on-surface">
                      Dr(a). {professional ? professional.name : 'Clínico Geral'}
                    </span>
                    {record.isLocked ? (
                      <span className="font-mono text-[10px] text-outline">#{record.id}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onLockRecord(record)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary transition-colors hover:bg-primary-container"
                      >
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        Assinar/Travar
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ClinicalField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[10px] font-bold uppercase tracking-wider text-outline">{label}</span>
      <p className="mt-1">{value}</p>
    </div>
  );
}

function NewRecordForm({
  patient,
  symptoms,
  diagnosis,
  prescription,
  evolutionNotes,
  onSymptomsChange,
  onDiagnosisChange,
  onPrescriptionChange,
  onEvolutionNotesChange,
  onSubmit,
}: {
  patient: Patient;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  evolutionNotes: string;
  onSymptomsChange: (value: string) => void;
  onDiagnosisChange: (value: string) => void;
  onPrescriptionChange: (value: string) => void;
  onEvolutionNotesChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <aside className="min-w-0 space-y-4">
      <form onSubmit={onSubmit} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
        <div className="mb-5">
          <h3 className="flex items-center gap-2 text-base font-bold text-on-surface">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
            Nova Evolução
          </h3>
          <p className="mt-1 text-xs text-outline">Para: {patient.name}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Sintoma Principal / Queixa *</label>
            <input
              type="text"
              required
              placeholder="Ex: Dor pulsante dente canal 36"
              value={symptoms}
              onChange={event => onSymptomsChange(event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Diagnóstico Técnico *</label>
            <input
              type="text"
              required
              placeholder="Ex: Pulpite aguda irreversível"
              value={diagnosis}
              onChange={event => onDiagnosisChange(event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Notas de Evolução / Tratamento *</label>
            <textarea
              required
              placeholder="Anote cirurgias, materiais aplicados, procedimentos realizados..."
              rows={4}
              value={evolutionNotes}
              onChange={event => onEvolutionNotesChange(event.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">Receita / Prescrição</label>
            <textarea
              placeholder="Ex: Amoxicilina 500mg - Tomar de 8 em 8h por 7 dias."
              rows={3}
              value={prescription}
              onChange={event => onPrescriptionChange(event.target.value)}
              className={`${inputClass} resize-none font-mono text-xs`}
            />
          </div>

          <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-[11px] leading-relaxed text-on-surface-variant">
            <span className="material-symbols-outlined mr-1 align-middle text-sm text-primary">shield</span>
            A evolução pode ser assinada e travada após criação, preservando a trilha de auditoria LGPD.
          </div>

          <Button type="submit" variant="primary" className="w-full gap-2 rounded-lg">
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Registrar Evolução
          </Button>
        </div>
      </form>

      <div className="rounded-xl border border-primary/20 bg-primary/10 p-5">
        <h4 className="text-sm font-bold text-primary">Contatos do Paciente</h4>
        <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
          <p className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">call</span>
            {patient.phone}
          </p>
          <p className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">mail</span>
            {patient.email || 'E-mail não informado'}
          </p>
        </div>
      </div>
    </aside>
  );
}

function FormSection({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
        <span className="material-symbols-outlined text-base">{icon}</span>
        {title}
      </h4>
      {children}
    </section>
  );
}
