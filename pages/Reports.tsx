
import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Share2, 
  Trash2,
  ChevronRight,
  Loader2,
  FileSearch,
  CheckCircle2,
  Printer,
  Save
} from 'lucide-react';
import { generateReportDraft } from '../services/geminiService';
import { MOCK_PATIENTS } from '../constants';

const Reports: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState(MOCK_PATIENTS[0].id);
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedPatient = MOCK_PATIENTS.find(p => p.id === selectedPatientId);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    if (!selectedPatient) return;

    try {
      // Mock results for context
      const mockResults = "WISC-V: QI Total 105 (Médio). RAVLT: Dificuldade significativa em recordação tardia. Stroop: Bom controle de interferência.";
      const draft = await generateReportDraft(selectedPatient.anamnesis, mockResults);
      setContent(draft || '');
      setShowEditor(true);
    } catch (err) {
      alert("Erro ao gerar rascunho. Verifique sua conexão ou chave API.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!content) return;
    
    const patientName = selectedPatient?.name.replace(/\s+/g, '_') || 'Paciente';
    const date = new Date().toISOString().split('T')[0];
    const fileName = `Laudo_Neuropsicologico_${patientName}_${date}.txt`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    // A simple way to print is to open a new window with the content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Laudo - ${selectedPatient?.name}</title>
            <style>
              body { font-family: serif; padding: 40px; line-height: 1.6; color: #1a1a1a; }
              h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .header { margin-bottom: 30px; font-size: 12px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
              pre { white-space: pre-wrap; font-family: serif; font-size: 14px; }
              @media print {
                @page { margin: 2cm; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <strong>Gestor T - Sistema de Gestão Neuropsicológica</strong><br>
              Data de Emissão: ${new Date().toLocaleDateString()}
            </div>
            <h1>Laudo Neuropsicológico</h1>
            <pre>${content}</pre>
            <div style="margin-top: 50px; text-align: center;">
              <br><br>
              ___________________________________________________<br>
              Assinatura do Profissional Responsável
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("Rascunho salvo com sucesso no banco de dados local.");
    }, 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Relatórios</h2>
          <p className="text-slate-500 font-medium">Gere, edite e exporte laudos clínicos com auxílio de IA.</p>
        </div>
        {!showEditor && (
          <button className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-teal-700 flex items-center gap-2 shadow-lg shadow-teal-600/20 transition-all active:scale-95">
            <FileText size={20} />
            Novo Laudo em Branco
          </button>
        )}
      </div>

      {!showEditor ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={24} />
                  Assistente de Redação (IA Gemini)
                </h3>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  O assistente utiliza a anamnese e os escores registrados para gerar um rascunho técnico estruturado. 
                  Você poderá revisar, alterar e adicionar suas impressões clínicas posteriormente.
                </p>
                
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Paciente Destino</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-bold text-slate-700 appearance-none"
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                    >
                      {MOCK_PATIENTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  
                  <button 
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-xl shadow-teal-600/20 disabled:opacity-50 active:scale-95"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    {isGenerating ? 'Sintetizando Dados...' : 'Gerar Rascunho Clínico'}
                  </button>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 text-slate-50 opacity-50 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                 <FileText size={240} />
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Relatórios Recentes</h3>
                <button className="text-teal-600 text-xs font-bold hover:underline">Ver Todos</button>
              </div>
              <div className="divide-y divide-slate-50">
                {[1, 2].map(i => (
                  <div key={i} className="px-8 py-5 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                        <FileSearch size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">Avaliação Completa - {i === 1 ? 'João Silva' : 'Maria Oliveira'}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Editado há 2 dias • Pronto para Exportação</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2.5 text-slate-400 hover:text-teal-600 hover:bg-white rounded-xl shadow-sm transition-all"><Share2 size={18} /></button>
                      <button className="p-2.5 text-slate-400 hover:text-teal-600 hover:bg-white rounded-xl shadow-sm transition-all"><Download size={18} /></button>
                      <button className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm transition-all"><Trash2 size={18} /></button>
                      <ChevronRight className="text-slate-300 ml-2" size={20} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
             <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="relative z-10">
                 <div className="bg-teal-600/30 p-3 w-fit rounded-2xl mb-6">
                   <CheckCircle2 size={24} className="text-teal-400" />
                 </div>
                 <h3 className="text-xl font-bold mb-2">Fila de Assinatura</h3>
                 <p className="text-slate-400 text-sm mb-8 leading-relaxed">Você tem 3 relatórios aguardando revisão final e assinatura digital para liberação.</p>
                 <button className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-teal-900/50 active:scale-95">
                   Revisar Documentos
                 </button>
               </div>
               <div className="absolute -bottom-6 -right-6 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                  <CheckCircle2 size={180} />
               </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl animate-in slide-in-from-bottom-12 duration-500">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-8 border-b border-slate-100 gap-4">
              <div className="flex items-center gap-4">
                 <div className="bg-teal-50 p-3 rounded-2xl text-teal-600"><FileText size={24} /></div>
                 <div>
                    <h3 className="text-2xl font-bold text-slate-800">Editor de Laudo</h3>
                    <p className="text-xs text-slate-400 font-medium">Paciente: <span className="text-slate-700 font-bold">{selectedPatient?.name}</span></p>
                 </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => setShowEditor(false)} className="flex-1 md:flex-none px-6 py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors">Cancelar</button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 md:flex-none px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Salvar
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20"
                >
                  <Printer size={18} />
                  Imprimir / PDF
                </button>
                <button 
                  onClick={handleDownload}
                  className="flex-1 md:flex-none px-8 py-3 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-teal-600/20"
                >
                  <Download size={18} />
                  Baixar (.txt)
                </button>
              </div>
           </div>
           
           <div className="bg-slate-50 p-3 rounded-2xl mb-8 flex flex-wrap gap-2 text-[10px] font-bold text-slate-400 overflow-x-auto">
             <button className="px-4 py-2 bg-white shadow-sm rounded-xl text-slate-800 uppercase hover:bg-slate-100 transition-all">Negrito</button>
             <button className="px-4 py-2 hover:bg-white transition-all rounded-xl uppercase">Itálico</button>
             <button className="px-4 py-2 hover:bg-white transition-all rounded-xl uppercase">Lista</button>
             <div className="border-l border-slate-200 h-8 mx-2"></div>
             <button className="px-4 py-2 hover:bg-white transition-all rounded-xl uppercase text-teal-600">Inserir Tabela de Escores</button>
             <button className="px-4 py-2 hover:bg-white transition-all rounded-xl uppercase text-amber-600">Sugerir CID-11</button>
           </div>

           <textarea 
            className="w-full h-[600px] p-10 border-none bg-slate-50/20 rounded-[2.5rem] text-slate-800 leading-relaxed font-serif text-xl focus:ring-0 outline-none resize-none shadow-inner"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Comece a digitar seu laudo aqui ou use o assistente de IA..."
           />

           <div className="mt-8 flex items-center gap-2 text-slate-400 text-xs font-medium">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             Salvamento automático ativado. Última alteração: agora mesmo.
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
