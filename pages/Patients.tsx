
import React, { useState, useContext } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Phone, 
  Mail, 
  Trash2, 
  Eye, 
  X, 
  Calendar as CalendarIcon, 
  UserPlus, 
  Clipboard, 
  History as HistoryIcon,
  Brain,
  Users,
  CalendarPlus
} from 'lucide-react';
import { DataContext } from '../App';
import { MOCK_SESSIONS, MOCK_TESTS } from '../constants';
import { Patient, PatientStatus, SessionType, Session } from '../types';

const Patients: React.FC = () => {
  const { patients, addPatient, deletePatient, testResults, addSession } = useContext(DataContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);
  const [schedulingPatient, setSchedulingPatient] = useState<Patient | null>(null);

  // Scheduling Form State
  const [newSession, setNewSession] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: SessionType.EVALUATION,
    duration: 60,
    notes: ''
  });

  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    referralSource: '',
    anamnesis: ''
  });

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    const patient: Patient = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      ...newPatient,
      status: PatientStatus.ACTIVE,
      createdAt: new Date().toISOString().split('T')[0]
    };
    addPatient(patient);
    setIsAddModalOpen(false);
    setNewPatient({ name: '', email: '', phone: '', birthDate: '', referralSource: '', anamnesis: '' });
  };

  const handleQuickSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingPatient) return;

    const session: Session = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: schedulingPatient.id,
      professionalId: 'p1',
      dateTime: `${newSession.date}T${newSession.time}:00`,
      type: newSession.type as SessionType,
      durationMinutes: newSession.duration,
      notes: newSession.notes,
      status: 'scheduled'
    };

    addSession(session);
    setIsSchedulingOpen(false);
    setSchedulingPatient(null);
  };

  const handleDeletePatient = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(`Tem certeza que deseja excluir o prontuário de ${name}?\nTodos os dados e resultados vinculados serão apagados permanentemente.`)) {
      deletePatient(id);
    }
  };

  const openProfile = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsProfileOpen(true);
  };

  const openQuickSchedule = (patient: Patient) => {
    setSchedulingPatient(patient);
    setIsSchedulingOpen(true);
  };

  const getPatientHistory = (patientId: string) => {
    const sessions = MOCK_SESSIONS.filter(s => s.patientId === patientId);
    const results = testResults.filter(r => r.patientId === patientId);
    return { sessions, results };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Pacientes</h2>
          <p className="text-slate-500 font-medium">Gestão de prontuários e histórico clínico.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-teal-600/20 self-start active:scale-95"
        >
          <UserPlus size={20} />
          <span>Novo Paciente</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome, e-mail ou prontuário..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors font-bold">
          <Filter size={20} />
          <span>Filtros</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPatients.map(patient => (
          <div key={patient.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-100 transition-all group relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center text-2xl font-bold group-hover:bg-teal-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div className="flex gap-1">
                <button 
                  type="button"
                  onClick={(e) => openQuickSchedule(patient)}
                  className="p-2.5 text-slate-300 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all shadow-sm"
                  title="Agendar Sessão"
                >
                  <CalendarPlus size={18} />
                </button>
                <button 
                  type="button"
                  onClick={(e) => handleDeletePatient(e, patient.id, patient.name)}
                  className="p-2.5 text-slate-300 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm hover:shadow-red-200"
                  title="Excluir Prontuário"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-teal-700 transition-colors leading-tight mb-1">{patient.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 uppercase tracking-tighter">ID: {patient.id}</span>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg uppercase tracking-wider ${
                  patient.status === PatientStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' :
                  patient.status === PatientStatus.WAITING ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {patient.status}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 mb-8 flex-1">
              <div className="flex items-center gap-3 text-slate-600 text-sm">
                <div className="bg-slate-50 p-2 rounded-lg"><Phone size={14} className="text-slate-400" /></div>
                <span className="font-medium">{patient.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 text-sm">
                <div className="bg-slate-50 p-2 rounded-lg"><Mail size={14} className="text-slate-400" /></div>
                <span className="truncate font-medium">{patient.email}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => openProfile(patient)}
                className="flex-1 py-3 bg-teal-50 text-teal-700 text-xs font-bold rounded-xl hover:bg-teal-100 transition-colors flex items-center justify-center gap-2"
              >
                <Eye size={14} />
                Histórico
              </button>
              <button 
                onClick={() => openProfile(patient)}
                className="flex-1 py-3 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/10 active:scale-95"
              >
                Ver Perfil
              </button>
            </div>
          </div>
        ))}
        
        {filteredPatients.length === 0 && (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-white/50">
            <div className="bg-white p-6 rounded-full w-fit mx-auto shadow-sm mb-4">
              <Users size={48} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold">Nenhum paciente encontrado.</p>
            <p className="text-slate-300 text-sm">Tente ajustar seus filtros ou buscar por outro nome.</p>
          </div>
        )}
      </div>

      {/* Quick Schedule Modal */}
      {isSchedulingOpen && schedulingPatient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-teal-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl"><CalendarPlus size={24} /></div>
                <div>
                  <h3 className="text-2xl font-bold">Agendar Sessão</h3>
                  <p className="text-teal-100 text-sm">Paciente: {schedulingPatient.name}</p>
                </div>
              </div>
              <button onClick={() => setIsSchedulingOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleQuickSchedule} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data</label>
                  <input required type="date" value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-slate-900" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Horário</label>
                  <input required type="time" value={newSession.time} onChange={e => setNewSession({...newSession, time: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-slate-900" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo</label>
                  <select 
                    required
                    value={newSession.type}
                    onChange={e => setNewSession({...newSession, type: e.target.value as SessionType})}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-slate-900"
                  >
                    {Object.values(SessionType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duração (min)</label>
                  <input required type="number" step="15" value={newSession.duration} onChange={e => setNewSession({...newSession, duration: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-slate-900" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notas Clínicas</label>
                <textarea rows={2} value={newSession.notes} onChange={e => setNewSession({...newSession, notes: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-sm text-slate-900" placeholder="Opcional: Preparação específica para o atendimento..." />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsSchedulingOpen(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 shadow-xl shadow-teal-600/20 transition-all active:scale-95">Salvar na Agenda</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-teal-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl"><UserPlus size={24} /></div>
                <div>
                  <h3 className="text-2xl font-bold">Novo Prontuário</h3>
                  <p className="text-teal-100 text-sm">Cadastre o paciente para iniciar avaliações.</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddPatient} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome Completo</label>
                  <input required value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-slate-900" placeholder="Ex: Maria das Dores" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data de Nascimento</label>
                  <input required type="date" value={newPatient.birthDate} onChange={e => setNewPatient({...newPatient, birthDate: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-slate-900" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">E-mail</label>
                  <input required type="email" value={newPatient.email} onChange={e => setNewPatient({...newPatient, email: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-slate-900" placeholder="email@exemplo.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Telefone</label>
                  <input required value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-slate-900" placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Encaminhamento / Origem</label>
                <input value={newPatient.referralSource} onChange={e => setNewPatient({...newPatient, referralSource: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-slate-900" placeholder="Ex: Escola X, Dr. Y..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Anamnese / Queixa Principal</label>
                <textarea rows={4} value={newPatient.anamnesis} onChange={e => setNewPatient({...newPatient, anamnesis: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium leading-relaxed text-slate-900" placeholder="Descreva brevemente o motivo da avaliação..." />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 shadow-xl shadow-teal-600/20 transition-all active:scale-95">Criar Prontuário</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Profile / History Modal */}
      {isProfileOpen && selectedPatient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right-full duration-500">
            <div className="p-8 sticky top-0 bg-white border-b border-slate-100 flex justify-between items-center z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-teal-600/20">
                  {selectedPatient.name[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedPatient.name}</h3>
                  <p className="text-xs text-slate-500 font-medium italic font-mono">Prontuário #{selectedPatient.id}</p>
                </div>
              </div>
              <button onClick={() => setIsProfileOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Nascimento</p>
                  <p className="text-sm font-bold text-slate-700">{selectedPatient.birthDate}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Encaminhamento</p>
                  <p className="text-sm font-bold text-slate-700">{selectedPatient.referralSource || 'Particular'}</p>
                </div>
              </div>

              <section className="space-y-4">
                <h4 className="flex items-center gap-2 text-slate-800 font-bold">
                  <Clipboard size={18} className="text-teal-600" />
                  Queixa e Anamnese Inicial
                </h4>
                <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-[2rem] text-sm text-slate-700 leading-relaxed italic">
                  "{selectedPatient.anamnesis}"
                </div>
              </section>

              <section className="space-y-6">
                <h4 className="flex items-center gap-2 text-slate-800 font-bold">
                  <HistoryIcon size={18} className="text-teal-600" />
                  Histórico de Sessões
                </h4>
                <div className="space-y-3">
                  {getPatientHistory(selectedPatient.id).sessions.length > 0 ? (
                    getPatientHistory(selectedPatient.id).sessions.map(s => (
                      <div key={s.id} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-50 text-slate-400 rounded-lg"><CalendarIcon size={16} /></div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">{s.type}</p>
                            <p className="text-[10px] text-slate-400">{new Date(s.dateTime).toLocaleDateString()} • {s.durationMinutes}min</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase">Concluída</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic bg-slate-50 p-6 rounded-2xl text-center">Nenhuma sessão registrada ainda.</p>
                  )}
                </div>
              </section>

              <section className="space-y-6 pb-12">
                <h4 className="flex items-center gap-2 text-slate-800 font-bold">
                  <Brain size={18} className="text-teal-600" />
                  Resultados de Testes
                </h4>
                <div className="space-y-4">
                  {getPatientHistory(selectedPatient.id).results.length > 0 ? (
                    getPatientHistory(selectedPatient.id).results.map(r => {
                      const test = MOCK_TESTS.find(t => t.id === r.testId);
                      return (
                        <div key={r.id} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-teal-200 transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-bold text-slate-800">{test?.name}</h5>
                            <span className="text-[10px] text-slate-400 font-medium">{new Date(r.date).toLocaleDateString()}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                             <div className="text-center p-2 bg-slate-50 rounded-xl">
                               <p className="text-[8px] font-bold text-slate-400 uppercase">Bruto</p>
                               <p className="text-xs font-bold text-slate-700">{r.rawScore}</p>
                             </div>
                             <div className="text-center p-2 bg-slate-50 rounded-xl">
                               <p className="text-[8px] font-bold text-slate-400 uppercase">Padrão</p>
                               <p className="text-xs font-bold text-teal-600">{r.standardScore}</p>
                             </div>
                             <div className="text-center p-2 bg-slate-50 rounded-xl">
                               <p className="text-[8px] font-bold text-slate-400 uppercase">Percentil</p>
                               <p className="text-xs font-bold text-amber-600">{r.percentile}%</p>
                             </div>
                          </div>
                          {r.observations && (
                            <p className="mt-3 text-[10px] text-slate-500 italic">Obs: {r.observations}</p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-400 italic bg-slate-50 p-6 rounded-2xl text-center">Nenhum teste aplicado.</p>
                  )}
                </div>
              </section>

              <div className="pt-8 border-t border-slate-100">
                 <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                 >
                   Fechar Prontuário
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
