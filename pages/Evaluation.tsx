
import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
  Plus, 
  Brain, 
  Search, 
  LineChart as ChartIcon, 
  History,
  FileUp,
  Save,
  Sparkles,
  Loader2,
  Stethoscope,
  ChevronRight,
  Info,
  Trash2,
  CheckCircle,
  Globe,
  ExternalLink,
  ShieldAlert,
  FileCheck2,
  AlertCircle,
  UserPlus,
  Paperclip,
  Image as ImageIcon,
  FileText as FileIcon,
  X,
  Download,
  Table as TableIcon,
  ScanText
} from 'lucide-react';
import { DataContext, LanguageContext } from '../App';
import { MOCK_TESTS } from '../constants';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  ResponsiveContainer 
} from 'recharts';
import { useTranslation } from '../services/i18n';
import { analyzeDiagnosticHypothesis, extractScoresFromDocuments } from '../services/geminiService';
import { NeuroTest, TestResult } from '../types';
import * as htmlToImage from 'html-to-image';

interface FileAttachment {
  name: string;
  data: string;
  mimeType: string;
  size: number;
}

const Evaluation: React.FC = () => {
  const { lang } = useContext(LanguageContext);
  const { patients, addTestResult, testResults: globalResults } = useContext(DataContext);
  const t = useTranslation(lang);
  
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'tests' | 'results' | 'attachments' | 'diagnosis'>('tests');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisSources, setAnalysisSources] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<NeuroTest | null>(null);
  const [includeSearch, setIncludeSearch] = useState(true);
  
  // Results and attachments for the current session
  const [sessionResults, setSessionResults] = useState<TestResult[]>([]);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  
  const [rawScore, setRawScore] = useState('');
  const [standardScore, setStandardScore] = useState('');
  const [percentile, setPercentile] = useState('');
  const [obs, setObs] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleSaveResult = () => {
    if (!selectedTest || !selectedPatientId) return;
    const newResult: TestResult = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: selectedPatientId,
      testId: selectedTest.id,
      rawScore: Number(rawScore),
      standardScore: Number(standardScore),
      percentile: Number(percentile),
      date: new Date().toISOString(),
      observations: obs
    };
    
    setSessionResults([...sessionResults, newResult]);
    addTestResult(newResult);

    setRawScore('');
    setStandardScore('');
    setPercentile('');
    setObs('');
    setSelectedTest(null);
    setActiveTab('results');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files) as File[]) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setAttachments(prev => [...prev, {
          name: file.name,
          data: base64,
          mimeType: file.type,
          size: file.size
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractData = async () => {
    if (attachments.length === 0) {
      alert("Anexe pelo menos um documento para extrair dados.");
      return;
    }

    setIsExtracting(true);
    try {
      const data = await extractScoresFromDocuments(
        attachments.map(a => ({ data: a.data, mimeType: a.mimeType }))
      );

      if (data.results && data.results.length > 0) {
        const newResults: TestResult[] = data.results.map((res: any) => {
          // Attempt to find test in our mock database
          const foundTest = MOCK_TESTS.find(t => 
            t.name.toLowerCase().includes(res.testName.toLowerCase()) ||
            res.testName.toLowerCase().includes(t.name.toLowerCase())
          );

          return {
            id: Math.random().toString(36).substr(2, 9),
            patientId: selectedPatientId,
            testId: foundTest?.id || 'manual-ocr',
            testName: foundTest?.name || res.testName, // Helper for UI display
            rawScore: res.rawScore,
            standardScore: res.standardScore,
            percentile: res.percentile,
            date: new Date().toISOString(),
            observations: `[Extraído via IA] ${res.observations || ''}`
          } as TestResult;
        });

        setSessionResults(prev => [...prev, ...newResults]);
        // Also add to global context if needed
        newResults.forEach(r => addTestResult(r));
        
        alert(`${newResults.length} resultados extraídos com sucesso dos documentos.`);
      } else {
        alert("Nenhum dado estruturado foi encontrado nos documentos.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao extrair dados. Verifique a qualidade dos anexos.");
    } finally {
      setIsExtracting(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAIAnalysis = async () => {
    if (sessionResults.length === 0 && attachments.length === 0) {
      alert("Registre resultados ou anexe arquivos para fundamentar a análise diagnóstica.");
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisSources([]);
    
    const resultsStr = sessionResults
      .map(r => {
        const testName = (r as any).testName || MOCK_TESTS.find(t => t.id === r.testId)?.name || 'Teste';
        return `${testName}: Bruto=${r.rawScore}, Padrão=${r.standardScore}, %=${r.percentile}. Obs: ${r.observations}`;
      })
      .join("\n");
      
    try {
      const result = await analyzeDiagnosticHypothesis(
        selectedPatient?.anamnesis || '', 
        resultsStr, 
        lang, 
        includeSearch,
        attachments.map(a => ({ data: a.data, mimeType: a.mimeType }))
      );
      setAnalysisResult(result.text || '');
      setAnalysisSources(result.sources || []);
      setActiveTab('diagnosis');
    } catch (err) {
      alert("Erro na análise profunda.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRadarData = () => {
    const base = [
      { subject: 'Atenção', A: 0, fullMark: 150 },
      { subject: 'Memória', A: 0, fullMark: 150 },
      { subject: 'Executivo', A: 0, fullMark: 150 },
      { subject: 'Linguagem', A: 0, fullMark: 150 },
      { subject: 'Visuoespacial', A: 0, fullMark: 150 },
      { subject: 'Inteligência', A: 0, fullMark: 150 },
    ];
    
    const resultsToUse = sessionResults.length > 0 
      ? sessionResults 
      : globalResults.filter(r => r.patientId === selectedPatientId);

    if (resultsToUse.length === 0) {
        return base.map(b => ({ ...b, A: 100 }));
    }

    return base.map(b => {
      const relevant = resultsToUse.filter(r => {
        const test = MOCK_TESTS.find(mt => mt.id === r.testId);
        const domain = test?.domain.toLowerCase() || '';
        const subj = b.subject.toLowerCase().substring(0, 4);
        return domain.includes(subj);
      });
      if (relevant.length === 0) return { ...b, A: 100 };
      const avg = relevant.reduce((acc, curr) => acc + curr.standardScore, 0) / relevant.length;
      return { ...b, A: avg };
    });
  };

  const downloadChart = () => {
    if (chartRef.current === null) return;
    
    htmlToImage.toPng(chartRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `Perfil_Cognitivo_${selectedPatient?.name || 'Paciente'}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Error exporting chart:', err);
      });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{t('evaluations')}</h2>
          <p className="text-slate-500 font-medium">Fluxo de diagnóstico diferencial assistido por IA.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <input 
              type="checkbox" 
              checked={includeSearch} 
              onChange={e => setIncludeSearch(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300" 
            />
            <Globe size={14} className="text-teal-600" />
            Grounding Científico
          </label>
          <button 
            onClick={handleAIAnalysis}
            disabled={isAnalyzing || (sessionResults.length === 0 && attachments.length === 0)}
            className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-amber-600 flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            Análise Diferencial Profunda
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Paciente em Foco</label>
            <div className="relative">
              <select 
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none appearance-none cursor-pointer text-slate-900 font-bold"
                value={selectedPatientId}
                onChange={(e) => {
                  setSelectedPatientId(e.target.value);
                  setSessionResults([]);
                  setAttachments([]);
                  setAnalysisResult(null);
                }}
              >
                {patients.length > 0 ? (
                  patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                ) : (
                  <option disabled value="">Nenhum paciente cadastrado</option>
                )}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" size={16} />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <button 
              onClick={() => setActiveTab('tests')}
              className={`w-full flex items-center gap-3 px-6 py-5 border-b border-slate-50 transition-all ${activeTab === 'tests' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Brain size={20} />
              <span>Catálogo de Testes</span>
            </button>
            <button 
              onClick={() => setActiveTab('results')}
              className={`w-full flex items-center justify-between px-6 py-5 border-b border-slate-50 transition-all ${activeTab === 'results' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <ChartIcon size={20} />
                <span>Escores Registrados</span>
              </div>
              <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs font-bold">{sessionResults.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab('attachments')}
              className={`w-full flex items-center justify-between px-6 py-5 border-b border-slate-50 transition-all ${activeTab === 'attachments' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <Paperclip size={20} />
                <span>Anexos & Documentos</span>
              </div>
              <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs font-bold">{attachments.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab('diagnosis')}
              className={`w-full flex items-center gap-3 px-6 py-5 transition-all ${activeTab === 'diagnosis' ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Stethoscope size={20} />
              <span>Diagnóstico & Exclusão</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[700px] relative overflow-y-auto">
          {activeTab === 'tests' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h3 className="text-2xl font-bold text-slate-800">Instrumentos Disponíveis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {MOCK_TESTS.map(test => (
                  <div 
                    key={test.id} 
                    onClick={() => { setSelectedTest(test); setActiveTab('results'); }}
                    className="p-6 rounded-3xl border-2 border-slate-50 bg-white hover:border-teal-100 hover:bg-teal-50/5 transition-all cursor-pointer group"
                  >
                    <h4 className="font-bold text-lg text-slate-800 group-hover:text-teal-700">{test.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{test.domain}</p>
                    <p className="text-sm text-slate-500 leading-relaxed">{test.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
              <div className="flex justify-between items-center gap-4">
                <h3 className="text-2xl font-bold text-slate-800">Anexos para Análise</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={handleExtractData}
                    disabled={isExtracting || attachments.length === 0}
                    className="bg-amber-100 text-amber-700 px-6 py-3 rounded-2xl font-bold hover:bg-amber-200 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isExtracting ? <Loader2 size={18} className="animate-spin" /> : <ScanText size={18} />}
                    Extrair Dados (IA)
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-teal-700 flex items-center gap-2 shadow-lg shadow-teal-600/20"
                  >
                    <FileUp size={18} />
                    Anexar Arquivo
                  </button>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                />
              </div>

              {attachments.length === 0 ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="py-32 text-center space-y-4 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 cursor-pointer hover:bg-slate-100 transition-all"
                >
                  <div className="bg-white p-6 rounded-full w-fit mx-auto shadow-sm">
                    <Paperclip size={48} className="text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-bold">Arraste ou clique para anexar</p>
                    <p className="text-slate-400 text-xs">Suporta fotos de protocolos (Figura de Rey, Bender), TC, RM ou PDFs.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="p-4 bg-white border border-slate-100 rounded-3xl flex items-center justify-between group shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="bg-teal-50 p-3 rounded-2xl text-teal-600">
                          {file.mimeType.startsWith('image/') ? <ImageIcon size={20} /> : <FileIcon size={20} />}
                        </div>
                        <div className="max-w-[150px]">
                          <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeAttachment(idx)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-12 border-t border-slate-100 space-y-12">
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <TableIcon className="text-teal-600" size={24} />
                       <h3 className="text-xl font-bold text-slate-800">Quadro Resumo de Escores</h3>
                    </div>
                    {sessionResults.length > 0 ? (
                      <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            <tr>
                              <th className="px-6 py-4">Instrumento</th>
                              <th className="px-6 py-4">Bruto</th>
                              <th className="px-6 py-4">Padrão</th>
                              <th className="px-6 py-4">Percentil</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {sessionResults.map((res) => (
                              <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700">
                                  {(res as any).testName || MOCK_TESTS.find(t => t.id === res.testId)?.name}
                                </td>
                                <td className="px-6 py-4 text-slate-600">{res.rawScore}</td>
                                <td className="px-6 py-4 font-bold text-teal-600">{res.standardScore}</td>
                                <td className="px-6 py-4 font-bold text-amber-600">{res.percentile}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-50 rounded-3xl text-slate-400 text-sm italic">
                        Nenhum escore registrado. Use o botão "Extrair Dados (IA)" acima para ler anexos.
                      </div>
                    )}
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <ChartIcon className="text-teal-600" size={24} />
                          <h3 className="text-xl font-bold text-slate-800">Perfil Cognitivo Visual</h3>
                       </div>
                       <button 
                        onClick={downloadChart}
                        className="flex items-center gap-2 text-xs font-bold text-teal-700 bg-teal-50 px-4 py-2 rounded-xl hover:bg-teal-100 transition-all border border-teal-100"
                       >
                          <Download size={14} />
                          Baixar Gráfico (.png)
                       </button>
                    </div>
                    
                    <div ref={chartRef} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex justify-center">
                       <div className="w-full h-[400px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                              <PolarGrid stroke="#e2e8f0" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                              <Radar
                                name="Paciente"
                                dataKey="A"
                                stroke="#0d9488"
                                fill="#0d9488"
                                fillOpacity={0.6}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
               {selectedTest ? (
                 <div className="space-y-8">
                    <h3 className="text-xl font-bold text-slate-800">Lançamento: {selectedTest.name}</h3>
                    <div className="grid grid-cols-3 gap-6">
                      <input 
                        value={rawScore} 
                        onChange={e => setRawScore(e.target.value)} 
                        type="number" 
                        placeholder="Bruto" 
                        className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none" 
                      />
                      <input 
                        value={standardScore} 
                        onChange={e => setStandardScore(e.target.value)} 
                        type="number" 
                        placeholder="Padrão" 
                        className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none" 
                      />
                      <input 
                        value={percentile} 
                        onChange={e => setPercentile(e.target.value)} 
                        type="number" 
                        placeholder="Percentil" 
                        className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none" 
                      />
                    </div>
                    <textarea 
                      value={obs} 
                      onChange={e => setObs(e.target.value)} 
                      rows={5} 
                      className="w-full p-5 bg-slate-50 rounded-3xl text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none" 
                      placeholder="Observações qualitativas..." 
                    />
                    <div className="flex justify-end gap-4">
                      <button onClick={() => setSelectedTest(null)} className="px-6 py-3 text-slate-400">Cancelar</button>
                      <button onClick={handleSaveResult} className="px-8 py-3 bg-teal-600 text-white rounded-2xl font-bold">Salvar Teste</button>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-slate-800">Escores da Sessão</h3>
                    {sessionResults.map(res => (
                      <div key={res.id} className="p-5 bg-white border border-slate-100 rounded-3xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-teal-50 p-3 rounded-2xl text-teal-600"><FileCheck2 size={20} /></div>
                          <div>
                            <h4 className="font-bold text-slate-800">
                              {(res as any).testName || MOCK_TESTS.find(t => t.id === res.testId)?.name}
                            </h4>
                            <p className="text-xs text-slate-400">Padrão: {res.standardScore} | %: {res.percentile}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setActiveTab('tests')} className="text-teal-600 font-bold">+ Adicionar Instrumento Manualmente</button>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'diagnosis' && (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-8 text-center">
                  <Loader2 size={80} className="animate-spin text-amber-500" />
                  <h4 className="font-bold text-slate-800 text-xl">Integrando Escores e Anexos...</h4>
                </div>
              ) : analysisResult ? (
                <div className="space-y-8 animate-in zoom-in-95 duration-500">
                  <div className="bg-white p-10 rounded-[3rem] border-2 border-amber-100 shadow-2xl relative overflow-hidden">
                    <div className="prose prose-slate max-w-none text-slate-700 leading-loose whitespace-pre-line">
                      {analysisResult}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                  <Stethoscope size={80} strokeWidth={1} className="text-slate-200 mb-6" />
                  <h4 className="text-xl font-bold text-slate-800">Inicie a Síntese</h4>
                  <p className="text-slate-400 max-w-xs mx-auto">Após registrar os escores e anexar documentos visuais, clique no botão de análise no topo.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Evaluation;
