
import React, { useState, useContext } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  X, 
  CheckCircle2,
  Trash2,
  CalendarDays,
  MoreVertical,
  BrainCircuit,
  AlertCircle
} from 'lucide-react';
import { DataContext } from '../App';
import { Session, SessionType } from '../types';

const Calendar: React.FC = () => {
  const { patients, sessions, addSession, deleteSession } = useContext(DataContext);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: SessionType.EVALUATION,
    duration: 60,
    notes: ''
  });

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.patientId) return;

    const session: Session = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: newSession.patientId,
      professionalId: 'p1',
      dateTime: `${newSession.date}T${newSession.time}:00`,
      type: newSession.type as SessionType,
      durationMinutes: newSession.duration,
      notes: newSession.notes,
      status: 'scheduled'
    };

    addSession(session);
    setIsAddModalOpen(false);
    setNewSession({
      patientId: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      type: SessionType.EVALUATION,
      duration: 60,
      notes: ''
    });
  };

  const getPatientName = (id: string) => {
    return patients.find(p => p.id === id)?.name || 'Paciente Excluído';
  };

  // Group sessions by date
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  const futureSessions = sortedSessions.filter(s => new Date(s.dateTime) >= new Date(new Date().setHours(0,0,0,0)));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Agenda Clínica</h2>
          <p className="text-slate-500 font-medium">Gestão de horários e sessões de avaliação.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-teal-600/20 active:scale-95"
        >
          <Plus size={20} />
          <span>Novo Agendamento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm text-teal-600">
                  <CalendarDays size={20} />
                </div>
                <h3 className="font-bold text-slate-800">Próximas Atividades</h3>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-100"><ChevronLeft size={18} /></button>
                <button className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-100"><ChevronRight size={18} /></button>
              </div>
            </div>

            <div className="p-4 md:p-8 space-y-8">
              {futureSessions.length > 0 ? (
                futureSessions.map((session, index) => {
                  const dateObj = new Date(session.dateTime);
                  const isToday = dateObj.toDateString() === new Date().toDateString();
                  
                  return (
                    <div key={session.id} className="relative pl-12 group">
                      {/* Timeline line */}
                      {index !== futureSessions.length - 1 && (
                        <div className="absolute left-[23px] top-10 bottom-[-40px] w-0.5 bg-slate-100" />
                      )}
                      
                      {/* Timeline dot */}
                      <div className={`absolute left-4 top-2 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 ${isToday ? 'bg-teal-500 ring-4 ring-teal-50' : 'bg-slate-300'}`} />
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-50 bg-white hover:border-teal-100 hover:shadow-xl hover:shadow-teal-900/5 transition-all">
                        <div className="flex items-start gap-5">
                          <div className="text-center min-w-[60px]">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dateObj.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                            <p className="text-2xl font-black text-slate-800 leading-none">{dateObj.getDate()}</p>
                            <p className="text-[10px] font-bold text-teal-600 uppercase mt-1">{dateObj.toLocaleDateString('pt-BR', { month: 'short' })}</p>
                          </div>
                          
                          <div className="h-12 w-px bg-slate-100 self-center hidden md:block" />
                          
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-slate-800">{getPatientName(session.patientId)}</span>
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg uppercase tracking-wider ${
                                session.type === SessionType.EVALUATION ? 'bg-blue-50 text-blue-600' :
                                session.type === SessionType.FEEDBACK ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-600'
                              }`}>
                                {session.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                              <span className="flex items-center gap-1"><Clock size={12} /> {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>{session.durationMinutes} min</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => deleteSession(session.id)}
                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Remover Agendamento"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button className="px-5 py-2.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all">
                            Check-in
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-slate-200">
                    <CalendarIcon size={40} />
                  </div>
                  <p className="text-slate-400 font-bold">Nenhuma sessão agendada.</p>
                  <button onClick={() => setIsAddModalOpen(true)} className="text-teal-600 font-bold hover:underline">Agendar primeiro paciente</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="bg-teal-600/30 p-3 rounded-2xl w-fit mb-6">
                <BrainCircuit size={24} className="text-teal-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Preparação Inteligente</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">O Gestor T pode preparar resumos de prontuário e sugestões de testes para suas próximas sessões automaticamente.</p>
              <button className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-teal-900/50">
                Ativar Assistente de Agenda
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
               <CalendarIcon size={250} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
               <AlertCircle size={18} className="text-amber-500" />
               Lembretes
             </h4>
             <div className="space-y-4">
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                   <p className="text-xs font-bold text-amber-800 mb-1">Feedback Pendente</p>
                   <p className="text-[10px] text-amber-600 leading-relaxed">Você tem 2 sessões concluídas aguardando notas clínicas e envio de relatório.</p>
                </div>
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                   <p className="text-xs font-bold text-blue-800 mb-1">Confirmar Devolutiva</p>
                   <p className="text-[10px] text-blue-600 leading-relaxed">João Silva tem uma sessão de devolutiva para amanhã. Confirmar via WhatsApp?</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* New Session Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-teal-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl"><Plus size={24} /></div>
                <div>
                  <h3 className="text-2xl font-bold">Novo Agendamento</h3>
                  <p className="text-teal-100 text-sm">Organize seu fluxo de atendimentos.</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddSession} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Paciente</label>
                <select 
                  required
                  value={newSession.patientId}
                  onChange={e => setNewSession({...newSession, patientId: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-bold text-slate-700"
                >
                  <option value="">Selecione um paciente...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {patients.length === 0 && <p className="text-[10px] text-amber-600 mt-1 font-bold">Nenhum paciente cadastrado. Cadastre-o primeiro.</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data</label>
                  <input required type="date" value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Horário</label>
                  <input required type="time" value={newSession.time} onChange={e => setNewSession({...newSession, time: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo de Sessão</label>
                  <select 
                    required
                    value={newSession.type}
                    onChange={e => setNewSession({...newSession, type: e.target.value as SessionType})}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                  >
                    {Object.values(SessionType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duração (min)</label>
                  <input required type="number" step="15" value={newSession.duration} onChange={e => setNewSession({...newSession, duration: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Observações de Agendamento</label>
                <textarea rows={2} value={newSession.notes} onChange={e => setNewSession({...newSession, notes: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-sm" placeholder="Opcional: Detalhes sobre a sala ou preparação..." />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 shadow-xl shadow-teal-600/20 transition-all active:scale-95">Confirmar Horário</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
