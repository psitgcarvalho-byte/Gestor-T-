// Domínios (Etapa 6 do prompt-mestre) e catálogo de instrumentos.
// IMPORTANTE: o catálogo NÃO traz situação no SATEPSI. Pelo protocolo (§2.4), ela deve ser
// consultada no site oficial e registrada a cada avaliação, com data.
import type { TipoInstrumento } from './types';

export const DOMINIOS: { id: string; nome: string; queixa: string; descritivo?: boolean }[] = [
  { id: 'intelecto', nome: 'Capacidade intelectual geral', queixa: 'Dificuldade geral de compreensão/aprendizagem' },
  { id: 'verbal', nome: 'Raciocínio verbal', queixa: 'Dificuldade de compreensão verbal e raciocínio com palavras' },
  { id: 'naoverbal', nome: 'Raciocínio perceptual / não verbal', queixa: 'Dificuldade de raciocínio lógico e não verbal' },
  { id: 'atencao', nome: 'Atenção', queixa: 'Desatenção, distração, dificuldade de concentração' },
  { id: 'velocidade', nome: 'Velocidade de processamento', queixa: 'Lentidão para realizar tarefas' },
  { id: 'mop', nome: 'Memória operacional', queixa: 'Perde o fio, esquece o que ia fazer, dificuldade com contas de cabeça' },
  { id: 'memoria', nome: 'Memória e aprendizagem', queixa: 'Esquecimentos, dificuldade de reter e recordar informações' },
  { id: 'linguagem', nome: 'Linguagem', queixa: 'Dificuldade de expressão, compreensão, nomeação ou fluência' },
  { id: 'executivo', nome: 'Funções executivas', queixa: 'Desorganização, impulsividade, dificuldade de planejar e de mudar de estratégia' },
  { id: 'visuoespacial', nome: 'Habilidades visuoespaciais e visuoconstrutivas', queixa: 'Dificuldade espacial, de cópia, desenho ou montagem' },
  { id: 'academico', nome: 'Habilidades acadêmicas (leitura, escrita, matemática)', queixa: 'Dificuldade de leitura, escrita ou matemática' },
  { id: 'social', nome: 'Cognição social e comunicação social', queixa: 'Dificuldade de interação, reciprocidade e compreensão social' },
  { id: 'comportamento', nome: 'Comportamento (escalas)', queixa: 'Agitação, oposição, comportamentos repetitivos' },
  { id: 'emocional', nome: 'Humor e aspectos emocionais (escalas)', queixa: 'Ansiedade, tristeza, irritabilidade' },
  { id: 'adaptativo', nome: 'Funcionamento adaptativo', queixa: 'Dificuldade de autonomia e de rotina' },
  { id: 'personalidade', nome: 'Personalidade (traços)', queixa: 'Traços de personalidade a descrever', descritivo: true }
];
export const nomeDominio = (id: string) => (DOMINIOS.find(d => d.id === id) || { nome: id }).nome;

export interface ItemCatalogo { id: string; nome: string; tipo: TipoInstrumento; dominios: string[]; medidas?: { nome: string; dominio: string; composto?: boolean; metrica?: string; natureza?: 'desempenho' | 'sintoma' }[] }

const W = (nome: string, dominio: string) => ({ nome, dominio, composto: true, metrica: 'qi' });
const S = (nome: string, dominio: string) => ({ nome, dominio, metrica: 'escalar' });
const P = (nome: string, dominio: string, composto = false) => ({ nome, dominio, composto });
const E = (nome: string, dominio: string, metrica = 'percentil', composto = false) => ({ nome, dominio, natureza: 'sintoma' as const, metrica, composto });
export const CATALOGO: ItemCatalogo[] = [
  { id: 'wisc', nome: 'WISC-IV (Escala Wechsler de Inteligência para Crianças)', tipo: 'teste', dominios: ['intelecto', 'verbal', 'naoverbal', 'mop', 'velocidade'],
    medidas: [W('QI Total', 'intelecto'), W('Índice de Compreensão Verbal', 'verbal'), W('Índice de Organização Perceptual', 'naoverbal'), W('Índice de Memória Operacional', 'mop'), W('Índice de Velocidade de Processamento', 'velocidade'),
      S('Semelhanças', 'verbal'), S('Vocabulário', 'verbal'), S('Compreensão', 'verbal'), S('Cubos', 'naoverbal'), S('Conceitos Figurativos', 'naoverbal'), S('Raciocínio Matricial', 'naoverbal'),
      S('Dígitos', 'mop'), S('Sequência de Números e Letras', 'mop'), S('Código', 'velocidade'), S('Procurar Símbolos', 'velocidade')] },
  { id: 'wais', nome: 'WAIS (Escala Wechsler de Inteligência para Adultos)', tipo: 'teste', dominios: ['intelecto', 'verbal', 'naoverbal', 'mop', 'velocidade'],
    medidas: [W('QI Total', 'intelecto'), W('Índice de Compreensão Verbal', 'verbal'), W('Índice de Organização Perceptual', 'naoverbal'), W('Índice de Memória Operacional', 'mop'), W('Índice de Velocidade de Processamento', 'velocidade')] },
  { id: 'wasi', nome: 'WASI (Escala Wechsler Abreviada de Inteligência)', tipo: 'teste', dominios: ['intelecto', 'verbal', 'naoverbal'], medidas: [W('QI Total', 'intelecto'), W('QI Verbal', 'verbal'), W('QI de Execução', 'naoverbal')] },
  { id: 'raven', nome: 'Matrizes Progressivas de Raven', tipo: 'teste', dominios: ['naoverbal', 'intelecto'] },
  { id: 'sonr', nome: 'SON-R (Teste Não Verbal de Inteligência)', tipo: 'teste', dominios: ['naoverbal', 'intelecto'] },
  { id: 'bpa', nome: 'BPA / BPA-2 (Bateria Psicológica para Avaliação da Atenção)', tipo: 'teste', dominios: ['atencao'], medidas: [P('Atenção Concentrada', 'atencao'), P('Atenção Dividida', 'atencao'), P('Atenção Alternada', 'atencao'), P('Atenção Geral', 'atencao', true)] },
  { id: 'ac', nome: 'Teste de Atenção Concentrada (AC)', tipo: 'teste', dominios: ['atencao'] },
  { id: 'cpt', nome: 'CPT (Teste de Desempenho Contínuo)', tipo: 'teste', dominios: ['atencao', 'executivo'] },
  { id: 'fdt', nome: 'FDT (Teste dos Cinco Dígitos)', tipo: 'teste', dominios: ['velocidade', 'executivo'], medidas: [P('Leitura', 'velocidade'), P('Contagem', 'velocidade'), P('Escolha', 'executivo'), P('Alternância', 'executivo'), P('Inibição', 'executivo'), P('Flexibilidade', 'executivo'), P('Erros – Escolha', 'executivo'), P('Erros – Alternância', 'executivo')] },
  { id: 'tmt', nome: 'Trail Making Test (Teste de Trilhas A e B)', tipo: 'teste', dominios: ['velocidade', 'executivo'], medidas: [{ nome: 'Parte A', dominio: 'velocidade' }, { nome: 'Parte B', dominio: 'executivo' }] },
  { id: 'stroop', nome: 'Teste de Stroop', tipo: 'teste', dominios: ['executivo', 'atencao'] },
  { id: 'wcst', nome: 'Wisconsin Card Sorting Test (WCST)', tipo: 'teste', dominios: ['executivo'] },
  { id: 'torre', nome: 'Torre de Londres', tipo: 'teste', dominios: ['executivo'] },
  { id: 'ravlt', nome: 'RAVLT (Teste de Aprendizagem Auditivo-Verbal de Rey)', tipo: 'teste', dominios: ['memoria'], medidas: [P('A1 – primeira evocação', 'memoria'), P('Escore total (A1–A5)', 'memoria', true), P('Evocação após interferência (A6)', 'memoria'), P('Evocação tardia (A7)', 'memoria'), P('Reconhecimento', 'memoria')] },
  { id: 'rey', nome: 'Figuras Complexas de Rey', tipo: 'teste', dominios: ['visuoespacial', 'memoria'], medidas: [{ nome: 'Cópia', dominio: 'visuoespacial' }, { nome: 'Memória (reprodução)', dominio: 'memoria' }] },
  { id: 'benton', nome: 'Teste de Retenção Visual de Benton', tipo: 'teste', dominios: ['memoria', 'visuoespacial'] },
  { id: 'bender', nome: 'Teste Gestáltico Visomotor de Bender', tipo: 'teste', dominios: ['visuoespacial'] },
  { id: 'fluencia', nome: 'Fluência Verbal (fonêmica e semântica)', tipo: 'tarefa', dominios: ['linguagem', 'executivo'], medidas: [{ nome: 'Fluência fonêmica', dominio: 'executivo' }, { nome: 'Fluência semântica', dominio: 'linguagem' }] },
  { id: 'boston', nome: 'Teste de Nomeação de Boston', tipo: 'tarefa', dominios: ['linguagem'] },
  { id: 'token', nome: 'Token Test', tipo: 'tarefa', dominios: ['linguagem'] },
  { id: 'neupsilin', nome: 'NEUPSILIN (Instrumento de Avaliação Neuropsicológica Breve)', tipo: 'teste', dominios: ['atencao', 'memoria', 'linguagem', 'executivo', 'visuoespacial'] },
  { id: 'tde', nome: 'TDE / TDE-II (Teste de Desempenho Escolar)', tipo: 'teste', dominios: ['academico'], medidas: [P('Leitura', 'academico'), P('Escrita', 'academico'), P('Aritmética', 'academico')] },
  { id: 'snap', nome: 'SNAP-IV', tipo: 'escala', dominios: ['comportamento', 'atencao'], medidas: [{ nome: 'Desatenção', dominio: 'atencao', natureza: 'sintoma', metrica: 'classificacao' }, { nome: 'Hiperatividade/impulsividade', dominio: 'comportamento', natureza: 'sintoma', metrica: 'classificacao' }, { nome: 'Oposição/desafio', dominio: 'comportamento', natureza: 'sintoma', metrica: 'classificacao' }] },
  { id: 'etdah-pais', nome: 'ETDAH-PAIS (Escala de TDAH – versão para pais)', tipo: 'escala', dominios: ['atencao', 'comportamento', 'emocional', 'adaptativo'],
    medidas: [E('F1 – Regulação emocional', 'emocional'), E('F2 – Hiperatividade/impulsividade', 'comportamento'), E('F3 – Comportamento adaptativo', 'adaptativo'), E('F4 – Atenção', 'atencao'), E('Escore geral', 'comportamento', 'percentil', true)] },
  { id: 'brief2', nome: 'BRIEF-2 (Inventário de Avaliação Comportamental das Funções Executivas)', tipo: 'escala', dominios: ['executivo'],
    medidas: [E('Índice de Regulação Comportamental', 'executivo', 't'), E('Índice de Regulação Emocional', 'executivo', 't'), E('Índice de Regulação Cognitiva', 'executivo', 't'), E('Composto Executivo Global', 'executivo', 't', true)] },
  { id: 'masc', nome: 'MASC (Escala Multidimensional de Ansiedade para Crianças)', tipo: 'escala', dominios: ['emocional'],
    medidas: [E('Escore total', 'emocional', 'bruto', true), E('Sintomas físicos', 'emocional', 'bruto'), E('Ansiedade social', 'emocional', 'bruto'), E('Evitação de danos', 'emocional', 'bruto'), E('Ansiedade de separação', 'emocional', 'bruto')] },
  { id: 'abc', nome: 'ABC / ICA (Inventário de Comportamentos Autísticos)', tipo: 'escala', dominios: ['social', 'comportamento'], medidas: [E('Escore total', 'social', 'bruto')] },
  { id: 'epqj', nome: 'EPQ-J (Questionário de Personalidade para Crianças e Adolescentes)', tipo: 'teste', dominios: ['personalidade', 'emocional', 'comportamento'],
    medidas: [E('Psicoticismo (P)', 'comportamento'), E('Extroversão (E)', 'personalidade'), E('Neuroticismo (N)', 'emocional'), E('Sinceridade (S)', 'personalidade')] },
  { id: 'etpc', nome: 'ETPC (Escala de Traços de Personalidade para Crianças)', tipo: 'teste', dominios: ['personalidade', 'emocional', 'comportamento'],
    medidas: [E('Extroversão', 'personalidade'), E('Neuroticismo', 'emocional'), E('Psicoticismo', 'comportamento'), E('Sociabilidade', 'personalidade')] },
  { id: 'htp', nome: 'HTP (Casa-Árvore-Pessoa)', tipo: 'teste', dominios: ['personalidade', 'emocional'] },
  { id: 'tri', nome: 'TRI (Teste Rápido de Inteligência)', tipo: 'teste', dominios: ['intelecto'], medidas: [P('Escore total', 'intelecto')] },
  { id: 'cancelamento', nome: 'Teste de Atenção por Cancelamento', tipo: 'teste', dominios: ['atencao'], medidas: [P('Parte 1', 'atencao'), P('Parte 2', 'atencao'), P('Parte 3', 'atencao')] },
  { id: 'discfon', nome: 'Discriminação fonológica', tipo: 'tarefa', dominios: ['linguagem', 'academico'], medidas: [P('Escore total', 'linguagem')] },
  { id: 'cbcl', nome: 'CBCL (Inventário de Comportamentos para Crianças e Adolescentes)', tipo: 'escala', dominios: ['comportamento', 'emocional'], medidas: [{ nome: 'Problemas internalizantes', dominio: 'emocional', natureza: 'sintoma', metrica: 't' }, { nome: 'Problemas externalizantes', dominio: 'comportamento', natureza: 'sintoma', metrica: 't' }, { nome: 'Total de problemas', dominio: 'comportamento', natureza: 'sintoma', metrica: 't' }] },
  { id: 'srs', nome: 'SRS-2 (Escala de Responsividade Social)', tipo: 'escala', dominios: ['social', 'comportamento'], medidas: [E('Escore total', 'social', 't', true), E('Comunicação e interação social (CIS)', 'social', 't'), E('Padrões restritos e repetitivos (PRR)', 'comportamento', 't')] },
  { id: 'ados', nome: 'ADOS-2 (Protocolo de Observação para Diagnóstico de Autismo)', tipo: 'teste', dominios: ['social'] },
  { id: 'vineland', nome: 'Vineland (Escalas de Comportamento Adaptativo)', tipo: 'escala', dominios: ['adaptativo'], medidas: [W('Composto de Comportamento Adaptativo', 'adaptativo'), W('Comunicação', 'adaptativo'), W('Atividades de Vida Diária', 'adaptativo'), W('Socialização', 'adaptativo')] },
  { id: 'bdi', nome: 'BDI-II (Inventário de Depressão de Beck)', tipo: 'escala', dominios: ['emocional'], medidas: [{ nome: 'Escore total', dominio: 'emocional', natureza: 'sintoma', metrica: 'classificacao' }] },
  { id: 'bai', nome: 'BAI (Inventário de Ansiedade de Beck)', tipo: 'escala', dominios: ['emocional'], medidas: [{ nome: 'Escore total', dominio: 'emocional', natureza: 'sintoma', metrica: 'classificacao' }] },
  { id: 'hads', nome: 'HADS (Escala Hospitalar de Ansiedade e Depressão)', tipo: 'escala', dominios: ['emocional'], medidas: [{ nome: 'Ansiedade', dominio: 'emocional', natureza: 'sintoma', metrica: 'classificacao' }, { nome: 'Depressão', dominio: 'emocional', natureza: 'sintoma', metrica: 'classificacao' }] },
  { id: 'mmpi', nome: 'MMPI-2 / MMPI-2-RF', tipo: 'teste', dominios: ['emocional'] },
  { id: 'meem', nome: 'Mini-Exame do Estado Mental (MEEM)', tipo: 'nao-privativo', dominios: ['intelecto'] },
  { id: 'moca', nome: 'MoCA (Avaliação Cognitiva de Montreal)', tipo: 'nao-privativo', dominios: ['intelecto', 'executivo', 'memoria'] },
  { id: 'ace', nome: 'ACE-III (Exame Cognitivo de Addenbrooke)', tipo: 'nao-privativo', dominios: ['intelecto', 'memoria', 'linguagem', 'visuoespacial'] }
];

export const NOME_TIPO: Record<TipoInstrumento, string> = {
  teste: 'Teste psicológico (privativo)',
  'nao-privativo': 'Instrumento não privativo do psicólogo',
  escala: 'Escala / inventário / questionário',
  tarefa: 'Tarefa clínica'
};
