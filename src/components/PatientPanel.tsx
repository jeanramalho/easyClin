/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Patient, MedicalRecordEntry, User } from '../types';
import { dbObj } from '../services/db';

interface PatientPanelProps {
  tenantId: string;
  patients: Patient[];
  professionals: User[];
  onRefresh: () => void;
  darkMode: boolean;
}

export default function PatientPanel({ 
  tenantId, patients, professionals, onRefresh, darkMode 
}: PatientPanelProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
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
      createdAt: new Date().toISOString()
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

    setName(''); setPhone(''); setEmail(''); setDocument('');
    setHasMedicalAlert(false); setMedicalAlertDescription('');
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
      isLocked: false
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

    setSymptoms(''); setDiagnosis(''); setPrescription(''); setEvolutionNotes('');
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
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.document?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.toLowerCase().includes(search.toLowerCase())
  );

  const inputClass = `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
    darkMode ? 'bg-inverse-surface border-outline/30 text-white placeholder-outline' : 'bg-surface-container-lowest border-outline-variant text-on-surface placeholder-outline'
  }`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* ── 1. Patient Directory (Left Panel) ── */}
      <div className={`col-span-1 rounded-xl border overflow-hidden flex flex-col shadow-sm ${
        darkMode ? 'bg-slate-900 border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
      }`}>
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          darkMode ? 'border-outline/20' : 'border-outline-variant'
        }`}>
          <div>
            <h3 className="font-semibold text-on-surface text-sm">Diretório de Pacientes</h3>
            <p className="text-outline text-xs mt-0.5">{patients.length} cadastrados</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span>Novo</span>
          </button>
        </div>

        {/* Search */}
        <div className={`px-4 py-3 border-b ${darkMode ? 'border-outline/20' : 'border-outline-variant'}`}>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-primary transition-all ${
                darkMode ? 'bg-inverse-surface border-outline/30 text-white placeholder-outline' : 'bg-surface-container border-outline-variant text-on-surface placeholder-outline'
              }`}
            />
          </div>
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">group_off</span>
              <p className="text-xs text-outline">Nenhum paciente encontrado.</p>
            </div>
          ) : (
            filteredPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPatient(p)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedPatient?.id === p.id
                    ? 'bg-primary/10 border-primary/40'
                    : darkMode
                    ? 'bg-inverse-surface/40 border-outline/20 hover:border-outline/40'
                    : 'bg-surface-container border-outline-variant/50 hover:border-primary/30 hover:bg-primary/5'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      selectedPatient?.id === p.id ? 'bg-primary text-on-primary' : 'bg-primary/10 text-primary'
                    }`}>
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-on-surface truncate">{p.name}</p>
                      <p className="text-[10px] text-outline font-mono mt-0.5">{p.phone}</p>
                    </div>
                  </div>
                  {p.hasMedicalAlert && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-error/10 text-error text-[9px] font-bold uppercase tracking-wider border border-error/20 shrink-0">
                      <span className="material-symbols-outlined text-[12px]">warning</span>
                      Alerta
                    </span>
                  )}
                </div>
                {p.document && (
                  <p className="text-[10px] text-outline font-mono mt-1.5 pl-10">CPF: {p.document}</p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── 2. Clinical Record Workspace (Right Panel – 2 cols) ── */}
      <div className="col-span-1 lg:col-span-2">
        {selectedPatient ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ── 2a. Clinical Timeline ── */}
            <div className={`rounded-xl border overflow-hidden flex flex-col shadow-sm ${
              darkMode ? 'bg-slate-900 border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
            }`}>
              {/* Patient Header */}
              <div className={`px-5 py-4 border-b ${darkMode ? 'border-outline/20' : 'border-outline-variant'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-lg shrink-0">
                    {selectedPatient.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">{selectedPatient.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-outline">{selectedPatient.gender}</span>
                      <span className="text-outline opacity-50">·</span>
                      <span className="text-[10px] text-outline font-mono">{selectedPatient.birthDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Alert Banner */}
              {selectedPatient.hasMedicalAlert && (
                <div className="mx-4 mt-4 p-3 rounded-xl bg-error/10 border border-error/20 flex gap-2">
                  <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                    emergency
                  </span>
                  <div>
                    <p className="text-xs font-bold text-error">Alerta Médico Crítico</p>
                    <p className="text-[11px] text-error/80 mt-0.5 leading-relaxed">{selectedPatient.medicalAlertDescription}</p>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className={`px-4 py-3 border-b ${darkMode ? 'border-outline/20' : 'border-outline-variant'}`}>
                <h5 className="text-[10px] font-bold text-outline uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">history</span>
                  Linha do Tempo Clínica · {records.length} registros
                </h5>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {records.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <span className="material-symbols-outlined text-4xl text-outline mb-2">medical_information</span>
                    <p className="text-xs text-outline">Prontuário vazio. Crie uma evolução ao lado.</p>
                  </div>
                ) : (
                  records.map((rec) => {
                    const doc = professionals.find(p => p.id === rec.professionalId);
                    return (
                      <div
                        key={rec.id}
                        className={`rounded-xl border text-xs leading-relaxed overflow-hidden ${
                          rec.isLocked
                            ? darkMode ? 'bg-inverse-surface/30 border-outline/20' : 'bg-surface-container border-outline-variant'
                            : darkMode ? 'bg-primary/5 border-primary/30' : 'bg-primary/5 border-primary/20'
                        }`}
                      >
                        {/* Record Header */}
                        <div className={`px-3 py-2 flex justify-between items-center border-b ${
                          darkMode ? 'border-outline/20' : 'border-outline-variant/50'
                        }`}>
                          <span className="text-[10px] text-outline font-mono">
                            {new Date(rec.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          {rec.isLocked ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                              Selo LGPD Ativo
                            </span>
                          ) : (
                            <button
                              onClick={() => handleLockRecord(rec)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[12px]">lock</span>
                              Assinar/Travar
                            </button>
                          )}
                        </div>

                        {/* Record Body */}
                        <div className="p-3 space-y-2">
                          {rec.symptoms && (
                            <div>
                              <span className="text-[9px] font-bold text-outline uppercase tracking-wider">Queixa</span>
                              <p className="text-on-surface-variant mt-0.5">{rec.symptoms}</p>
                            </div>
                          )}
                          {rec.diagnosis && (
                            <div>
                              <span className="text-[9px] font-bold text-outline uppercase tracking-wider">Diagnóstico</span>
                              <p className="text-on-surface-variant mt-0.5">{rec.diagnosis}</p>
                            </div>
                          )}
                          {rec.evolutionNotes && (
                            <div>
                              <span className="text-[9px] font-bold text-outline uppercase tracking-wider">Evolução</span>
                              <p className="text-on-surface-variant mt-0.5">{rec.evolutionNotes}</p>
                            </div>
                          )}
                          {rec.prescription && (
                            <div className={`p-2 rounded-lg font-mono text-[10px] leading-relaxed mt-1 ${
                              darkMode ? 'bg-inverse-surface/50 text-secondary-fixed-dim' : 'bg-surface-container text-on-surface-variant'
                            }`}>
                              <span className="font-bold block mb-1 text-outline uppercase tracking-widest text-[9px]">📋 Prescrição</span>
                              {rec.prescription}
                            </div>
                          )}
                        </div>

                        {/* Record Footer */}
                        <div className={`px-3 py-2 border-t flex justify-between items-center ${
                          darkMode ? 'border-outline/20' : 'border-outline-variant/50'
                        }`}>
                          <span className="text-[10px] text-outline">Dr(a). {doc ? doc.name : 'Clínico Geral'}</span>
                          {rec.isLocked && (
                            <span className="text-[9px] font-mono text-outline">#{rec.id}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── 2b. New Evolution Form ── */}
            <div className={`rounded-xl border overflow-hidden flex flex-col shadow-sm ${
              darkMode ? 'bg-slate-900 border-outline/20' : 'bg-surface-container-lowest border-outline-variant'
            }`}>
              <div className={`px-5 py-4 border-b ${darkMode ? 'border-outline/20' : 'border-outline-variant'}`}>
                <h4 className="font-semibold text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
                  Nova Evolução Clínica
                </h4>
                <p className="text-[11px] text-outline mt-0.5">Para: {selectedPatient.name}</p>
              </div>

              <form onSubmit={handleCreateRecord} className="flex-1 p-5 space-y-4 overflow-y-auto">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-outline uppercase tracking-wider">Sintoma Principal / Queixa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dor pulsante dente canal 36"
                    value={symptoms}
                    onChange={e => setSymptoms(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-outline uppercase tracking-wider">Diagnóstico Técnico *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pulpite aguda irreversível"
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-outline uppercase tracking-wider">Notas de Evolução / Tratamento *</label>
                  <textarea
                    required
                    placeholder="Anote cirurgias, materiais aplicados, procedimentos realizados..."
                    rows={3}
                    value={evolutionNotes}
                    onChange={e => setEvolutionNotes(e.target.value)}
                    className={inputClass + ' resize-none'}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-outline uppercase tracking-wider">Receita / Prescrição (Opcional)</label>
                  <textarea
                    placeholder="Ex: Amoxicilina 500mg - Tomar de 8 em 8hs por 7 dias."
                    rows={2}
                    value={prescription}
                    onChange={e => setPrescription(e.target.value)}
                    className={`${inputClass} resize-none font-mono`}
                  />
                </div>

                {/* LGPD Notice */}
                <div className={`p-3 rounded-xl text-[10px] leading-relaxed border ${
                  darkMode ? 'bg-primary/5 border-primary/20 text-secondary-fixed-dim' : 'bg-primary/5 border-primary/15 text-on-surface-variant'
                }`}>
                  <span className="material-symbols-outlined text-primary text-sm align-middle mr-1">shield</span>
                  O prontuário pode ser <strong>assinado digitalmente</strong> após criação, tornando-o imutável conforme a LGPD.
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  Registrar Evolução Médica
                </button>
              </form>
            </div>

          </div>
        ) : (
          /* Empty state */
          <div className={`rounded-xl border border-dashed flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 ${
            darkMode ? 'bg-slate-900/50 border-outline/20' : 'bg-surface-container/30 border-outline-variant'
          }`}>
            <span className="material-symbols-outlined text-5xl text-outline mb-3">person_search</span>
            <h4 className="font-semibold text-on-surface-variant text-sm">Selecione um paciente</h4>
            <p className="text-[11px] text-outline mt-1.5 max-w-[240px] leading-relaxed">
              Escolha um paciente no diretório ao lado para acessar os prontuários, histórico clínico e prescrições.
            </p>
          </div>
        )}
      </div>

      {/* ── Patient Creation Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl ${
            darkMode ? 'bg-slate-900 border-outline/20 text-white' : 'bg-surface-container-lowest border-outline-variant text-on-surface'
          }`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-outline/20' : 'border-outline-variant'}`}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                <h3 className="font-bold text-base">Novo Cadastro de Paciente</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-surface-container transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-outline">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreatePatient} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-outline uppercase tracking-wider">Nome Completo *</label>
                <input type="text" required placeholder="Ex: Carlos Henrique Albuquerque" value={name}
                  onChange={e => setName(e.target.value)} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-outline uppercase tracking-wider">Telefone *</label>
                  <input type="text" required placeholder="(11) 99999-8888" value={phone}
                    onChange={e => setPhone(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-outline uppercase tracking-wider">CPF</label>
                  <input type="text" required placeholder="123.456.789-10" value={document}
                    onChange={e => setDocument(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-outline uppercase tracking-wider">E-mail</label>
                <input type="email" placeholder="paciente@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-outline uppercase tracking-wider">Sexo/Gênero</label>
                  <select value={gender} onChange={e => setGender(e.target.value)} className={inputClass}>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-outline uppercase tracking-wider">Data de Nascimento</label>
                  <input type="date" required value={birthDate} onChange={e => setBirthDate(e.target.value)} className={inputClass} />
                </div>
              </div>

              {/* Medical Alert Toggle */}
              <div className={`p-4 rounded-xl border ${
                hasMedicalAlert ? 'bg-error/5 border-error/30' : darkMode ? 'border-outline/20' : 'border-outline-variant/60'
              }`}>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => setHasMedicalAlert(!hasMedicalAlert)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${hasMedicalAlert ? 'bg-error' : 'bg-outline/40'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${hasMedicalAlert ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <span className={`text-sm font-semibold ${hasMedicalAlert ? 'text-error' : 'text-on-surface-variant'}`}>
                    Paciente possui alerta médico crítico
                  </span>
                </label>
                {hasMedicalAlert && (
                  <input
                    type="text"
                    required
                    placeholder="Ex: Alérgico a Penicilina / Cardiopata / Diabético..."
                    value={medicalAlertDescription}
                    onChange={e => setMedicalAlertDescription(e.target.value)}
                    className={`${inputClass} mt-3 border-error/40 focus:ring-error/40`}
                  />
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit"
                  className="flex-1 bg-primary hover:bg-primary-container text-on-primary font-bold py-2.5 rounded-xl text-sm cursor-pointer transition-colors">
                  Confirmar Cadastro
                </button>
                <button type="button" onClick={() => setShowAddModal(false)}
                  className={`px-5 py-2.5 border rounded-xl text-sm font-semibold cursor-pointer transition-colors ${
                    darkMode ? 'border-outline/30 hover:bg-inverse-surface' : 'border-outline-variant hover:bg-surface-container'
                  }`}>
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
