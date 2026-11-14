// Domínios (Etapa 6 do prompt-mestre) e catálogo de instrumentos.
// IMPORTANTE: o catálogo NÃO traz situação no SATEPSI. Pelo protocolo (§2.4), ela deve ser
// consultada no site oficial e registrada a cada avaliação, com data.
import type { TipoInstrumento } from './types';

export const DOMINIOS: { id: string; nome: string; queixa: string }[] = [
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
  { id: 'adaptativo', nome: 'Funcionamento adaptativo', queixa: 'Dificuldade de autonomia e de rotina' }
];
export const nomeDominio = (id: string) => (DOMINIOS.find(d => d.id === id) || { nome: id }).nome;

export interface ItemCatalogo { id: string; nome: string; tipo: TipoInstrumento; dominios: string[]; medidas?: { nome: string; dominio: string; composto?: boolean; metrica?: string; natureza?: 'desempenho' | 'sintoma' }[] }

const W = (nome: string, dominio: string) => ({ nome, dominio, composto: true, metrica: 'qi' });
export const CATALOGO: ItemCatalogo[] = [
  { id: 'wisc', nome: 'WISC (Escala Wechsler de Inteligência para Crianças)', tipo: 'teste', dominios: ['intelecto', 'verbal', 'naoverbal', 'mop', 'velocidade'],
    medidas: [W('QI Total', 'intelecto'), W('Índice de Compreensão Verbal', 'verbal'), W('Índice de Organização Perceptual / Raciocínio Fluido', 'naoverbal'), W('Índice de Memória Operacional', 'mop'), W('Índice de Velocidade de Processamento', 'velocidade')] },
  { id: 'wais', nome: 'WAIS (Escala Wechsler de Inteligência para Adultos)', tipo: 'teste', dominios: ['intelecto', 'verbal', 'naoverbal', 'mop', 'velocidade'],
    medidas: [W('QI Total', 'intelecto'), W('Índice de Compreensão Verbal', 'verbal'), W('Índice de Organização Perceptual', 'naoverbal'), W('Índice de Memória Operacional', 'mop'), W('Índice de Velocidade de Processamento', 'velocidade')] },
  { id: 'wasi', nome: 'WASI (Escala Wechsler Abreviada de Inteligência)', tipo: 'teste', dominios: ['intelecto', 'verbal', 'naoverbal'], medidas: [W('QI Total', 'intelecto'), W('QI Verbal', 'verbal'), W('QI de Execução', 'naoverbal')] },
  { id: 'raven', nome: 'Matrizes Progressivas de Raven', tipo: 'teste', dominios: ['naoverbal', 'intelecto'] },
  { id: 'sonr', nome: 'SON-R (Teste Não Verbal de Inteligência)', tipo: 'teste', dominios: ['naoverbal', 'intelecto'] },
  { id: 'bpa', nome: 'BPA-2 (Bateria Psicológica para Avaliação da Atenção)', tipo: 'teste', dominios: ['atencao'], medidas: [{ nome: 'Atenção Concentrada', dominio: 'atencao' }, { nome: 'Atenção Dividida', dominio: 'atencao' }, { nome: 'Atenção Alternada', dominio: 'atencao' }, { nome: 'Atenção Geral', dominio: 'atencao' }] },
  { id: 'ac', nome: 'Teste de Atenção Concentrada (AC)', tipo: 'teste', dominios: ['atencao'] },
  { id: 'cpt', nome: 'CPT (Teste de Desempenho Contínuo)', tipo: 'teste', dominios: ['atencao', 'executivo'] },
  { id: 'fdt', nome: 'FDT (Teste dos Cinco Dígitos)', tipo: 'teste', dominios: ['velocidade', 'executivo'], medidas: [{ nome: 'Leitura', dominio: 'velocidade' }, { nome: 'Contagem', dominio: 'velocidade' }, { nome: 'Escolha', dominio: 'executivo' }, { nome: 'Alternância', dominio: 'executivo' }, { nome: 'Inibição', dominio: 'executivo' }, { nome: 'Flexibilidade', dominio: 'executivo' }] },
  { id: 'tmt', nome: 'Trail Making Test (Teste de Trilhas A e B)', tipo: 'teste', dominios: ['velocidade', 'executivo'], medidas: [{ nome: 'Parte A', dominio: 'velocidade' }, { nome: 'Parte B', dominio: 'executivo' }] },
  { id: 'stroop', nome: 'Teste de Stroop', tipo: 'teste', dominios: ['executivo', 'atencao'] },
  { id: 'wcst', nome: 'Wisconsin Card Sorting Test (WCST)', tipo: 'teste', dominios: ['executivo'] },
  { id: 'torre', nome: 'Torre de Londres', tipo: 'teste', dominios: ['executivo'] },
  { id: 'ravlt', nome: 'RAVLT (Teste de Aprendizagem Auditivo-Verbal de Rey)', tipo: 'teste', dominios: ['memoria'], medidas: [{ nome: 'Aprendizagem total (A1–A5)', dominio: 'memoria' }, { nome: 'Evocação imediata (A6)', dominio: 'memoria' }, { nome: 'Evocação tardia (A7)', dominio: 'memoria' }, { nome: 'Reconhecimento', dominio: 'memoria' }] },
  { id: 'rey', nome: 'Figuras Complexas de Rey', tipo: 'teste', dominios: ['visuoespacial', 'memoria'], medidas: [{ nome: 'Cópia', dominio: 'visuoespacial' }, { nome: 'Memória (reprodução)', dominio: 'memoria' }] },
  { id: 'benton', nome: 'Teste de Retenção Visual de Benton', tipo: 'teste', dominios: ['memoria', 'visuoespacial'] },
  { id: 'bender', nome: 'Teste Gestáltico Visomotor de Bender', tipo: 'teste', dominios: ['visuoespacial'] },
  { id: 'fluencia', nome: 'Fluência Verbal (fonêmica e semântica)', tipo: 'tarefa', dominios: ['linguagem', 'executivo'], medidas: [{ nome: 'Fluência fonêmica', dominio: 'executivo' }, { nome: 'Fluência semântica', dominio: 'linguagem' }] },
  { id: 'boston', nome: 'Teste de Nomeação de Boston', tipo: 'tarefa', dominios: ['linguagem'] },
  { id: 'token', nome: 'Token Test', tipo: 'tarefa', dominios: ['linguagem'] },
  { id: 'neupsilin', nome: 'NEUPSILIN (Instrumento de Avaliação Neuropsicológica Breve)', tipo: 'teste', dominios: ['atencao', 'memoria', 'linguagem', 'executivo', 'visuoespacial'] },
  { id: 'tde', nome: 'TDE (Teste de Desempenho Escolar)', tipo: 'teste', dominios: ['academico'], medidas: [{ nome: 'Leitura', dominio: 'academico' }, { nome: 'Escrita', dominio: 'academico' }, { nome: 'Aritmética', dominio: 'academico' }] },
  { id: 'snap', nome: 'SNAP-IV', tipo: 'escala', dominios: ['comportamento', 'atencao'], medidas: [{ nome: 'Desatenção', dominio: 'atencao', natureza: 'sintoma', metrica: 'classificacao' }, { nome: 'Hiperatividade/impulsividade', dominio: 'comportamento', natureza: 'sintoma', metrica: 'classificacao' }, { nome: 'Oposição/desafio', dominio: 'comportamento', natureza: 'sintoma', metrica: 'classificacao' }] },
  { id: 'cbcl', nome: 'CBCL (Inventário de Comportamentos para Crianças e Adolescentes)', tipo: 'escala', dominios: ['comportamento', 'emocional'], medidas: [{ nome: 'Problemas internalizantes', dominio: 'emocional', natureza: 'sintoma', metrica: 't' }, { nome: 'Problemas externalizantes', dominio: 'comportamento', natureza: 'sintoma', metrica: 't' }, { nome: 'Total de problemas', dominio: 'comportamento', natureza: 'sintoma', metrica: 't' }] },
  { id: 'srs', nome: 'SRS-2 (Escala de Responsividade Social)', tipo: 'escala', dominios: ['social'], medidas: [{ nome: 'Escore total', dominio: 'social', natureza: 'sintoma', metrica: 't' }] },
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
