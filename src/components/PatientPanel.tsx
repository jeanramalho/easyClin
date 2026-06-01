/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Patient, MedicalRecordEntry, User } from '../types';
import { dbObj } from '../services/db';
import { 
  Users, UserPlus, FileHeart, History, ClipboardCheck, 
  LockKeyhole, ShieldAlert, HeartOff, Plus, FileText, Check, Unlock
} from 'lucide-react';

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
  const [profId, setProfId] = useState(dbObj.currentUser.id);

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

    // Reset Form
    setName('');
    setPhone('');
    setEmail('');
    setDocument('');
    setHasMedicalAlert(false);
    setMedicalAlertDescription('');
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
      isLocked: false // Começa desbloqueado para rascunho
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

    // Reset Record Inputs
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

    // Dynamic Auditing under LGP-D
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

  // Get active medical health records for chosen patient
  const records = selectedPatient ? dbObj.getMedicalRecords(tenantId, selectedPatient.id) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Patient Directory List */}
      <div className={`col-span-1 p-5 rounded-2xl border ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-bold flex items-center gap-1.5">
            <Users className="h-4.5 w-4.5 text-blue-500" />
            <span>Diretório de Pacientes</span>
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1 px-2 border rounded-lg text-[10px] font-bold flex items-center gap-1 bg-blue-600 border-blue-600 text-white cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Novo</span>
          </button>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {patients.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Nenhum paciente cadastrado nesta unidade.</p>
          ) : (
            patients.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPatient(p)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedPatient?.id === p.id
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-900 dark:text-blue-100'
                    : 'bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-bold text-xs truncate max-w-[150px]">{p.name}</p>
                  {p.hasMedicalAlert && (
                    <span className="p-0.5 rounded bg-rose-500/10 text-rose-500 font-bold text-[8px] uppercase tracking-wider flex items-center gap-0.5 border border-rose-500/10 shrink-0">
                      <ShieldAlert className="h-2 w-2" />
                      <span>Alerta</span>
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1.5 flex flex-col gap-0.5">
                  <span>Tel: {p.phone}</span>
                  <span>CPF: {p.document}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Patient Electronic Medical File View (Middle) */}
      <div className="col-span-1 lg:col-span-2">
        {selectedPatient ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Timeline Histórico */}
            <div className={`p-5 rounded-2xl border ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider. mb-4 flex items-center gap-1.5 border-b pb-2.5 dark:border-slate-800">
                <History className="h-4 w-4" />
                <span>Linha do Tempo Clínica</span>
              </h4>

              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                {/* Fixed Alert box */}
                {selectedPatient.hasMedicalAlert && (
                  <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex gap-2 border border-rose-500/15">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <div>
                      <span className="font-bold block">Alerta de Saúde de Emergência:</span>
                      <p className="text-[11px] mt-0.5">{selectedPatient.medicalAlertDescription}</p>
                    </div>
                  </div>
                )}

                {records.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">Prontuário vazio para este paciente. Crie uma evolução médica ao lado!</p>
                ) : (
                  records.map((rec) => {
                    const doc = professionals.find(p => p.id === rec.professionalId);
                    
                    return (
                      <div 
                        key={rec.id}
                        className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 relative ${
                          rec.isLocked 
                            ? 'bg-slate-100 border-slate-200 dark:bg-slate-950 dark:border-slate-850 opacity-90' 
                            : 'bg-blue-50/20 border-blue-200 dark:bg-slate-900 dark:border-blue-900/60'
                        }`}
                      >
                        {/* Header Lock representation */}
                        <div className="flex justify-between items-center text-[10px] border-b border-dashed dark:border-slate-800 pb-1.5">
                          <span className="text-slate-400 font-mono">{new Date(rec.date).toLocaleDateString()}</span>
                          
                          {rec.isLocked ? (
                            <span className="text-emerald-500 font-bold flex items-center gap-1">
                              <LockKeyhole className="h-3.5 w-3.5" />
                              <span>Selo LGPD Ativo</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleLockRecord(rec)}
                              className="bg-amber-600 hover:bg-amber-700 text-white rounded px-2 py-0.5 font-bold flex items-center gap-1 tracking-wide transition-colors cursor-pointer"
                              title="Selar prontuário de forma definitiva"
                            >
                              <ClipboardCheck className="h-3 w-3" />
                              <span>Assinar/Travar</span>
                            </button>
                          )}
                        </div>

                        {/* Fields */}
                        <div className="space-y-1 text-[11px]">
                          <p><strong className="text-slate-500 dark:text-slate-400">Sintoma:</strong> {rec.symptoms}</p>
                          <p><strong className="text-slate-500 dark:text-slate-400">Diagnóstico:</strong> {rec.diagnosis}</p>
                          <p><strong className="text-slate-500 dark:text-slate-400">Procedimento/Evolução:</strong> {rec.evolutionNotes}</p>
                          {rec.prescription && (
                            <p className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border font-mono text-[10px] leading-relaxed">
                              📂 <strong className="text-slate-500 dark:text-slate-400 uppercase tracking-widest">Prescrição Farmacêutica:</strong> <br />
                              {rec.prescription}
                            </p>
                          )}
                        </div>

                        {/* Footer doctor credit */}
                        <div className="text-[10px] text-slate-400 pt-1 flex justify-between">
                          <span>Dr(a). {doc ? doc.name : 'Clínico'}</span>
                          {rec.isLocked && <span className="font-mono text-slate-500 text-[8px]">REG: {rec.id}</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Nova Evolução Clínica */}
            <div className={`p-5 rounded-2xl border ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b pb-2.5 dark:border-slate-800">
                <FileHeart className="h-4 w-4 text-emerald-500" />
                <span>Evolução Prontuário</span>
              </h4>

              <form onSubmit={handleCreateRecord} className="space-y-3.5">
                <div>
                  <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Sintoma Principal / Queixa</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dor pulsante dente canal 36"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Diagnóstico Técnico</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pulpite aguda irreversível"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Notas de Evolução / Tratamento</label>
                  <textarea
                    required
                    placeholder="Anote cirurgias ou materiais aplicados..."
                    rows={3}
                    value={evolutionNotes}
                    onChange={(e) => setEvolutionNotes(e.target.value)}
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Receita / Prescrição Medicamentosa (Opcional)</label>
                  <textarea
                    placeholder="Ex: Amoxicilina 500mg - Tomar de 8 em 8hs por 7 dias."
                    rows={2}
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    className={`w-full px-2.5 py-1.5 border rounded-lg font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  <span>Cadastrar Evolução Médica</span>
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className={`p-8 rounded-2xl border border-dashed text-center flex flex-col items-center justify-center h-full ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'
          }`}>
            <ClipboardCheck className="h-10 w-10 text-slate-300 mb-2.5" />
            <p className="text-xs font-semibold">Abra a ficha médica complacente</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
              Selecione um paciente na listagem do diretório ao lado para analisar histórico de prontuários, alergias e prescrever evoluções imutáveis.
            </p>
          </div>
        )}
      </div>

      {/* Patient Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-1.5">
              <UserPlus className="h-5 w-5 text-blue-500" />
              <span>Novo Cadastro de Paciente</span>
            </h3>

            <form onSubmit={handleCreatePatient} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Henrique Albuquerque"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Telefone Celular</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-8888"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">CPF Documento</label>
                  <input
                    type="text"
                    required
                    placeholder="123.456.789-10"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">E-mail</label>
                <input
                  type="email"
                  placeholder="analuiza@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Sexo/Gênero</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-xl text-xs ${
                      darkMode ? 'bg-slate-950 border-slate-805 text-white' : 'bg-slate-50 border-slate-225'
                    }`}
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Nascimento</label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Patient Alert Markers */}
              <div className="p-3 rounded-xl border border-dashed dark:border-slate-800 font-medium">
                <label className="flex items-center gap-2 text-rose-500 text-xs font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasMedicalAlert}
                    onChange={(e) => setHasMedicalAlert(e.target.checked)}
                    className="rounded text-rose-500 focus:ring-rose-500"
                  />
                  <span>Este Paciente Possui Alerta Médico Crítico?</span>
                </label>

                {hasMedicalAlert && (
                  <input
                    type="text"
                    required
                    placeholder="Ex: Alérgico a Penicilina / Cardiopata..."
                    value={medicalAlertDescription}
                    onChange={(e) => setMedicalAlertDescription(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-rose-300 dark:border-rose-950 rounded-lg text-xs mt-2 text-rose-600 font-medium dark:text-rose-400 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer text-center"
                >
                  Confirmar Cadastro
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
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
