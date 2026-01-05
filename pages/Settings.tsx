
import React, { useState, useContext } from 'react';
import { 
  User, 
  Stethoscope, 
  Shield, 
  Database, 
  Save, 
  CheckCircle, 
  Cloud, 
  Download, 
  Trash2, 
  Bell,
  Cpu,
  Globe,
  Loader2,
  Camera
} from 'lucide-react';
import { LanguageContext, DataContext } from '../App';
import { UserConfig } from '../types';

const Settings: React.FC = () => {
  const { lang, setLang } = useContext(LanguageContext);
  const { patients, sessions, testResults } = useContext(DataContext);
  const [activeTab, setActiveTab] = useState<'profile' | 'clinical' | 'system' | 'data'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const [config, setConfig] = useState<UserConfig>({
    professionalName: 'Dr. Silva',
    professionalReg: 'CRP 06/123456',
    specialties: ['Neuropsicologia Clínica', 'TDAH Adulto', 'Geriatria'],
    defaultSessionDuration: 60,
    enableAiAssistant: true,
    theme: 'light'
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    }, 1000);
  };

  const exportData = () => {
    const fullBackup = {
      patients,
      sessions,
      testResults,
      config,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GestorT_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Configurações</h2>
          <p className="text-slate-500 font-medium">Personalize seu consultório digital e gerencie seus dados.</p>
        </div>
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 text-xs font-bold">
          <Cloud size={14} />
          Serviços de IA Ativos
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'profile' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}
          >
            <User size={18} />
            Perfil Profissional
          </button>
          <button 
            onClick={() => setActiveTab('clinical')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'clinical' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}
          >
            <Stethoscope size={18} />
            Preferências Clínicas
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'system' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}
          >
            <Cpu size={18} />
            Sistema & IA
          </button>
          <button 
            onClick={() => setActiveTab('data')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'data' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}
          >
            <Database size={18} />
            Dados & Backup
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[500px]">
            {activeTab === 'profile' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-8 pb-8 border-b border-slate-50">
                   <div className="relative group">
                     <div className="w-24 h-24 bg-teal-50 rounded-[2rem] flex items-center justify-center text-teal-600 border-2 border-dashed border-teal-200 group-hover:bg-teal-100 transition-colors cursor-pointer">
                        <Camera size={32} />
                     </div>
                     <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-xl shadow-md border border-slate-100 text-teal-600">
                        <Save size={14} />
                     </div>
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-slate-800">Foto de Identificação</h3>
                      <p className="text-xs text-slate-400 font-medium">Aparecerá nos cabeçalhos dos laudos e área do paciente.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome Completo</label>
                      <input 
                        type="text" 
                        value={config.professionalName} 
                        onChange={e => setConfig({...config, professionalName: e.target.value})}
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-bold text-slate-700"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Registro Profissional (CRP)</label>
                      <input 
                        type="text" 
                        value={config.professionalReg} 
                        onChange={e => setConfig({...config, professionalReg: e.target.value})}
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-bold text-slate-700"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Especialidades</label>
                   <div className="flex flex-wrap gap-2 mb-2">
                      {config.specialties.map((s, i) => (
                        <span key={i} className="px-4 py-2 bg-teal-50 text-teal-700 rounded-xl text-xs font-bold border border-teal-100 flex items-center gap-2">
                           {s}
                           <button onClick={() => setConfig({...config, specialties: config.specialties.filter((_, idx) => idx !== i)})} className="hover:text-red-500"><Save size={12} /></button>
                        </span>
                      ))}
                   </div>
                   <input 
                    placeholder="Adicionar especialidade e pressione Enter..." 
                    onKeyDown={(e) => {
                      if(e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value;
                        if(val) {
                          setConfig({...config, specialties: [...config.specialties, val]});
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                   />
                </div>
              </div>
            )}

            {activeTab === 'clinical' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-slate-800">Fluxo de Trabalho</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                      <div className="flex items-center gap-3 text-slate-800 font-bold">
                        <Bell size={20} className="text-teal-600" />
                        Notificações de Agenda
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">Enviar lembrete automático via WhatsApp 24h antes da sessão?</p>
                      <button className="w-12 h-6 bg-teal-600 rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </button>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                      <div className="flex items-center gap-3 text-slate-800 font-bold">
                        <CheckCircle size={20} className="text-teal-600" />
                        Confirmação de Devolutiva
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">Bloquear novos agendamentos se houver laudo pendente há mais de 15 dias?</p>
                      <button className="w-12 h-6 bg-slate-300 rounded-full relative">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </button>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duração Padrão da Sessão (minutos)</label>
                   <input 
                    type="number" 
                    step="15"
                    value={config.defaultSessionDuration}
                    onChange={e => setConfig({...config, defaultSessionDuration: parseInt(e.target.value)})}
                    className="w-full max-w-xs p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-bold"
                   />
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="p-8 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden">
                   <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="space-y-2">
                         <div className="flex items-center gap-2 text-teal-400 font-bold">
                            <Cpu size={20} />
                            Motor de IA: Gemini 3.0 Pro
                         </div>
                         <p className="text-sm text-slate-400">O assistente de redação e análise profunda está ativo.</p>
                      </div>
                      <button className="px-6 py-3 bg-teal-600 rounded-xl text-sm font-bold shadow-lg shadow-teal-900/50">Testar Conexão</button>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center justify-between p-6 border border-slate-100 rounded-[2rem]">
                      <div className="flex items-center gap-4">
                        <Globe size={24} className="text-slate-400" />
                        <div>
                           <p className="font-bold text-slate-800">Idioma do Sistema</p>
                           <p className="text-xs text-slate-400">Define a interface e o idioma dos laudos gerados.</p>
                        </div>
                      </div>
                      <select 
                        className="bg-slate-50 p-3 rounded-xl font-bold text-sm outline-none"
                        value={lang}
                        onChange={e => setLang(e.target.value as any)}
                      >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (US)</option>
                      </select>
                   </div>
                   
                   <div className="flex items-center justify-between p-6 border border-slate-100 rounded-[2rem]">
                      <div className="flex items-center gap-4">
                        <Shield size={24} className="text-slate-400" />
                        <div>
                           <p className="font-bold text-slate-800">Criptografia de Ponta-a-Ponta</p>
                           <p className="text-xs text-slate-400">Seus dados são protegidos localmente antes do envio.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">Ativado</span>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                   <h3 className="text-xl font-bold text-slate-800">Portabilidade & Segurança</h3>
                   <p className="text-sm text-slate-500 leading-relaxed">
                      Como uma aplicação focada em privacidade, o Gestor T armazena a maioria dos dados no seu navegador. 
                      É altamente recomendado realizar backups periódicos.
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <button 
                    onClick={exportData}
                    className="flex flex-col items-start gap-4 p-8 bg-teal-50 border border-teal-100 rounded-[2.5rem] hover:bg-teal-100 transition-all text-left group"
                   >
                      <Download size={32} className="text-teal-600 group-hover:scale-110 transition-transform" />
                      <div>
                         <p className="font-bold text-teal-900">Exportar Banco de Dados</p>
                         <p className="text-xs text-teal-700/70">Baixe todos os pacientes, sessões e testes em um arquivo JSON.</p>
                      </div>
                   </button>
                   <button className="flex flex-col items-start gap-4 p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] hover:bg-rose-100 transition-all text-left group">
                      <Trash2 size={32} className="text-rose-600 group-hover:scale-110 transition-transform" />
                      <div>
                         <p className="font-bold text-rose-900">Limpar Dados Locais</p>
                         <p className="text-xs text-rose-700/70">Apagar permanentemente todos os dados deste dispositivo.</p>
                      </div>
                   </button>
                </div>

                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
                   <Shield size={24} className="text-amber-600 flex-shrink-0" />
                   <p className="text-xs text-amber-800 leading-relaxed">
                      <strong>Aviso de Conformidade LGPD:</strong> Os dados de saúde mental são sensíveis. 
                      Certifique-se de que o dispositivo onde o backup for armazenado possua criptografia de disco ativa.
                   </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
             <button className="px-8 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors">Descartar Alterações</button>
             <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-10 py-4 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 shadow-xl shadow-teal-600/20 transition-all flex items-center gap-2 min-w-[200px] justify-center active:scale-95"
             >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
             </button>
          </div>
        </div>
      </div>

      {showSavedToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
           <CheckCircle size={20} />
           <span className="font-bold">Configurações atualizadas com sucesso!</span>
        </div>
      )}
    </div>
  );
};

export default Settings;
