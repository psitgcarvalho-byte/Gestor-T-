
import React, { useContext, useEffect, useState } from 'react';
import { 
  Users, 
  Calendar as CalendarIcon, 
  FileCheck, 
  TrendingUp,
  ArrowUpRight,
  Clock,
  Sparkles,
  Globe,
  RefreshCcw,
  Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { DataContext, LanguageContext } from '../App';
import { useTranslation } from '../services/i18n';
import { performClinicalResearch } from '../services/geminiService';

const data = [
  { month: 'Jan', patients: 12 },
  { month: 'Feb', patients: 15 },
  { month: 'Mar', patients: 18 },
  { month: 'Apr', patients: 14 },
  { month: 'May', patients: 22 },
  { month: 'Jun', patients: 25 },
];

const Dashboard: React.FC = () => {
  const { lang } = useContext(LanguageContext);
  const { patients, sessions } = useContext(DataContext);
  const t = useTranslation(lang);
  const [trends, setTrends] = useState<{text: string, sources: any[]}>({text: '', sources: []});
  const [loadingTrends, setLoadingTrends] = useState(false);

  const fetchTrends = async () => {
    setLoadingTrends(true);
    try {
      const res = await performClinicalResearch("latest neuropsychology trends and diagnostic standards 2025");
      setTrends(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrends(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const getPatientName = (id: string) => {
    return patients.find(p => p.id === id)?.name || 'Paciente';
  };

  // Get next 3 upcoming sessions
  const upcoming = sessions
    .filter(s => new Date(s.dateTime) >= new Date())
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">{t('welcome')}</h2>
          <p className="text-slate-500">Gestor T - Inteligência em Neuropsicologia.</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-100 shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Sistema Online & Protegido
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-500 p-3 rounded-xl text-white shadow-lg shadow-blue-500/20"><Users size={24} /></div>
            <div className="text-emerald-600 text-sm font-medium flex items-center">+12% <ArrowUpRight size={16} /></div>
          </div>
          <p className="text-slate-500 text-sm mb-1">{t('totalPatients')}</p>
          <h3 className="text-2xl font-bold text-slate-800">{patients.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-purple-500 p-3 rounded-xl text-white shadow-lg shadow-purple-500/20"><CalendarIcon size={24} /></div>
            <div className="text-emerald-600 text-sm font-medium flex items-center">+5% <ArrowUpRight size={16} /></div>
          </div>
          <p className="text-slate-500 text-sm mb-1">{t('sessionsMonth')}</p>
          <h3 className="text-2xl font-bold text-slate-800">{sessions.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-amber-500 p-3 rounded-xl text-white shadow-lg shadow-amber-500/20"><FileCheck size={24} /></div>
            <div className="text-red-500 text-sm font-medium flex items-center">-2%</div>
          </div>
          <p className="text-slate-500 text-sm mb-1">{t('pendingReports')}</p>
          <h3 className="text-2xl font-bold text-slate-800">7</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-500 p-3 rounded-xl text-white shadow-lg shadow-emerald-500/20"><TrendingUp size={24} /></div>
            <div className="text-emerald-600 text-sm font-medium flex items-center">+18% <ArrowUpRight size={16} /></div>
          </div>
          <p className="text-slate-500 text-sm mb-1">{t('revenue')}</p>
          <h3 className="text-2xl font-bold text-slate-800">R$ 12.400</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Crescimento da Clínica</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="patients" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorPatients)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-teal-600/30 p-2 rounded-lg text-teal-400">
                  <Globe size={20} />
                </div>
                <button 
                  onClick={fetchTrends} 
                  disabled={loadingTrends}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loadingTrends ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                </button>
              </div>
              <h3 className="text-lg font-bold mb-2">Clinical Insights (Search)</h3>
              <p className="text-slate-400 text-xs mb-4">Tendências científicas em tempo real.</p>
              
              {loadingTrends ? (
                <div className="py-8 text-center text-slate-500 text-xs italic">Consultando literatura médica...</div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-6 italic">
                    {trends.text || "Carregando atualizações sobre diagnóstico diferencial e novos manuais..."}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {trends.sources.slice(0, 3).map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white/5 rounded-full text-[8px] text-teal-400 border border-white/10 truncate max-w-[100px]">
                        {s.web?.title || 'Journal Ref'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="absolute -bottom-4 -right-4 text-white/5 rotate-12 group-hover:rotate-0 transition-transform">
              <Sparkles size={120} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Sessões Próximas</h3>
            <div className="space-y-3">
              {upcoming.length > 0 ? upcoming.map((session) => (
                <div key={session.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="bg-teal-50 w-10 h-10 rounded-xl flex items-center justify-center text-teal-600 text-xs font-bold shadow-sm">
                    {getPatientName(session.patientId).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{getPatientName(session.patientId)}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">{session.type}</p>
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 flex items-center gap-1">
                    <Clock size={10} /> {new Date(session.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-400 text-center py-4 italic">Nenhum agendamento futuro.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
