// Armazenamento local (IndexedDB) — os dados ficam somente neste navegador.
import type { Paciente, Avaliacao, Referencia, Citacao, Limiares } from './engine/types';
import { LIMIARES_PADRAO } from './engine/raciocinio';

export interface ConfigIA { provider: string; keys: Record<string, string>; models: Record<string, string>; customBase: string }
export interface Config { profissional: string; crp: string; titulo: string; cidade: string; limiares: Limiares; ia: ConfigIA }
export interface Banco {
  pacientes: Paciente[];
  avaliacoes: Avaliacao[];
  referencias: Referencia[];
  citacoes: Citacao[];
  config: Config;
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const agora = () => new Date().toISOString();

// Bibliografia-base do prompt-mestre (§7.1). Os campos entre colchetes devem ser confirmados na edição consultada.
const BIB_BASE: string[] = [
  'CAPOVILLA, Fernando César; CAPOVILLA, Alessandra Gotuzo Seabra. Uma introdução à neuropsicologia e à avaliação neuropsicológica. São Paulo: [s.n.], [s.d.].',
  'FUENTES, Daniel; MALLOY-DINIZ, Leandro Fernandes; MATTOS, Paulo; ABREU, Neander. Avaliação neuropsicológica. [S.l.]: [s.n.], [s.d.].',
  'ORTIZ, Karin Zazo et al. Avaliação neuropsicológica: panorama interdisciplinar dos estudos na normatização e validação de instrumentos no Brasil. [S.l.]: Vetor, 2008.',
  'FONSECA, Rochele Paz; PRANDO, Maria Luiza; ZIMMERMANN, Nicolle. Tarefas para avaliação neuropsicológica. v. 1. [S.l.]: [s.n.], [s.d.].',
  'ZIMMERMANN, Nicolle; FONSECA, Rochele Paz. Tarefas para avaliação neuropsicológica. v. 2: avaliação de linguagem e funções executivas em adultos. [S.l.]: Memnon, [s.d.].',
  'RODRIGUES, Juliana C.; FONSECA, Rochele Paz; SALLES, Jerusa Fumagalli de; FONTOURA, Daiane R. Neuropsicologia da linguagem: bases para avaliação e reabilitação. [S.l.]: [s.n.], [s.d.].',
  'LEZAK, Muriel D.; HOWIESON, Diane B.; BIGLER, Erin D.; TRANEL, Daniel. Neuropsychological assessment. New York: Oxford University Press, [s.d.].',
  'STRAUSS, Esther; SHERMAN, Elisabeth M. S.; SPREEN, Otfried. A compendium of neuropsychological tests. New York: Oxford University Press, [s.d.].',
  'KOLB, Bryan; WHISHAW, Ian Q. Fundamentals of human neuropsychology. [S.l.]: Worth Publishers, [s.d.].',
  'SNYDER, Peter J.; NUSSBAUM, Paul D.; ROBINS, David L. Clinical neuropsychology: a pocket handbook for assessment. [S.l.]: [s.n.], [s.d.].',
  'AMERICAN PSYCHIATRIC ASSOCIATION. Manual diagnóstico e estatístico de transtornos mentais: DSM-5-TR. 5. ed., texto revisado. Porto Alegre: Artmed, [ano da edição consultada].'
];
const autorAno = (abnt: string) => { const a = abnt.split(/[;,.]/)[0].trim(); const y = (abnt.match(/\b(19|20)\d{2}\b/) || ['s.d.'])[0]; return `${a.charAt(0) + a.slice(1).toLowerCase()}, ${y}`; };

export function bancoVazio(): Banco {
  return {
    pacientes: [], avaliacoes: [], citacoes: [],
    referencias: BIB_BASE.map(abnt => ({ id: uid(), abnt, autorAno: autorAno(abnt) })),
    config: { profissional: '', crp: '', titulo: 'Psicólogo Clínico e Neuropsicólogo', cidade: '', limiares: { ...LIMIARES_PADRAO }, ia: { provider: 'gemini', keys: {}, models: {}, customBase: '' } }
  };
}

export function novaAvaliacao(pacienteId: string): Avaliacao {
  const d = agora();
  return {
    id: uid(), pacienteId, titulo: 'Avaliação Neuropsicológica', criadoEm: d, atualizadoEm: d,
    demanda: { solicitante: '', motivo: '', objetivo: '', periodo: '', queixas: [], queixaTexto: '' },
    historia: { anamneseBruta: '', desenvolvimento: '', medico: '', medicacao: '', familiar: '', escolar: '', atencaoExecutivo: '', emocional: '', social: '', adaptativo: '', linhaTempo: '' },
    observacao: { texto: '', validade: { esforco: '', fatores: [], obs: '' } },
    informantes: '', instrumentos: [], resultados: [], hipoteses: [], referenciasIds: [],
    laudo: { secoes: {}, geradoEm: '' }
  };
}

// Garante que dados antigos/importados tenham todos os campos
export function normalizar(b: Partial<Banco>): Banco {
  const v = bancoVazio();
  const out: Banco = { ...v, ...b, config: { ...v.config, ...(b.config || {}), limiares: { ...v.config.limiares, ...(b.config?.limiares || {}) }, ia: { ...v.config.ia, ...(b.config?.ia || {}) } } as Config };
  out.avaliacoes = (b.avaliacoes || []).map(a => {
    const n = novaAvaliacao(a.pacienteId);
    return { ...n, ...a, demanda: { ...n.demanda, ...a.demanda }, historia: { ...n.historia, ...a.historia },
      observacao: { ...n.observacao, ...a.observacao, validade: { ...n.observacao.validade, ...(a.observacao?.validade || {}) } }, laudo: { ...n.laudo, ...a.laudo } };
  });
  if (!b.referencias) out.referencias = v.referencias;
  return out;
}

let db: IDBDatabase | null = null;
function abrir(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    if (db) return res(db);
    const r = indexedDB.open('tgestor', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => { db = r.result; res(db); };
    r.onerror = () => rej(r.error);
  });
}
export async function carregar(): Promise<Banco> {
  const d = await abrir();
  return new Promise((res, rej) => {
    const q = d.transaction('kv').objectStore('kv').get('banco');
    q.onsuccess = () => res(normalizar(q.result || {}));
    q.onerror = () => rej(q.error);
  });
}
export async function salvar(b: Banco): Promise<void> {
  const d = await abrir();
  return new Promise((res, rej) => {
    const tx = d.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(b, 'banco');
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export function baixar(nome: string, blob: Blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
export const slug = (s: string) => String(s || 'arquivo').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60) || 'arquivo';
