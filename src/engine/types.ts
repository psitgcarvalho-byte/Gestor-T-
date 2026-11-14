// Modelo de dados do T-Gestor 2.0

export type Metrica = 'qi' | 'escalar' | 't' | 'z' | 'percentil' | 'bruto' | 'classificacao';
export type Natureza = 'desempenho' | 'sintoma';
export type StatusSatepsi =
  | 'Não verificado' | 'Favorável' | 'Desfavorável' | 'Não avaliado' | 'Em avaliação'
  | 'Não localizado' | 'Não privativo';
export type TipoInstrumento = 'teste' | 'nao-privativo' | 'escala' | 'tarefa';
export type StatusCriterio = '' | 'ok' | 'nd' | 'inv' | 'contra';
export type Grau =
  | 'Fortemente sustentada' | 'Moderadamente sustentada' | 'Parcialmente sustentada'
  | 'Hipótese a investigar' | 'Pouco sustentada';

export interface Paciente {
  id: string;
  nome: string;
  nascimento: string; // AAAA-MM-DD
  sexo: string;
  escolaridade: string;
  lateralidade: string;
  responsaveis: string;
  contato: string;
  criadoEm: string;
}

export interface Instrumento {
  id: string;
  catalogoId?: string;
  nome: string;
  versao: string;
  tipo: TipoInstrumento;
  dominios: string[];
  satepsi: {
    status: StatusSatepsi;
    data: string;
    faixaNormativa: string;
    compativel: '' | 'sim' | 'nao';
    incompatibilidade: string;
  };
}

export interface Medida {
  id: string;
  instrumentoId: string;
  medida: string;
  dominio: string;
  natureza: Natureza;
  composto: boolean;
  metrica: Metrica;
  valor: number | null;
  percentil: number | null;
  bruto: string;
  classificacaoExaminador: string;
  obs: string;
}

export interface HipoteseCaso {
  id: string; // id da biblioteca ou 'custom-...'
  nomeLivre?: string;
  criteriosLivres?: string[];
  criterios: Record<string, StatusCriterio>;
  fontes: Record<string, boolean>;
  notas: string;
  grauManual?: Grau | '';
}

export interface Avaliacao {
  id: string;
  pacienteId: string;
  titulo: string;
  criadoEm: string;
  atualizadoEm: string;
  demanda: { solicitante: string; motivo: string; objetivo: string; periodo: string; queixas: string[]; queixaTexto: string };
  historia: {
    anamneseBruta: string; desenvolvimento: string; medico: string; medicacao: string; familiar: string;
    escolar: string; atencaoExecutivo: string; emocional: string; social: string; adaptativo: string; linhaTempo: string;
  };
  observacao: {
    texto: string;
    validade: { esforco: '' | 'adequado' | 'duvidoso' | 'insuficiente'; fatores: string[]; obs: string };
  };
  informantes: string;
  instrumentos: Instrumento[];
  resultados: Medida[];
  hipoteses: HipoteseCaso[];
  referenciasIds: string[];
  laudo: { secoes: Record<string, string>; geradoEm: string };
}

export interface Referencia { id: string; abnt: string; autorAno: string }
export interface Citacao { id: string; texto: string; autor: string; ano: string; pagina: string }

export interface Limiares { rebaixado: number; comprometido: number; ipsativo: number }
