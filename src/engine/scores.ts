// Escores: equivalência interna em z, consistência e leitura das classificações do examinador.
// Regra do prompt-mestre (§2.3): o app NUNCA substitui percentil nem classificação informados pelo examinador.
// O z calculado aqui serve apenas para comparar medidas entre si (perfil e análise intraindividual).
import type { Medida, Metrica, Limiares } from './types';

export const METRICAS: { id: Metrica; nome: string; media?: number; dp?: number }[] = [
  { id: 'qi', nome: 'Escore composto / QI (média 100, DP 15)', media: 100, dp: 15 },
  { id: 'escalar', nome: 'Escore ponderado / escalar (média 10, DP 3)', media: 10, dp: 3 },
  { id: 't', nome: 'Escore T (média 50, DP 10)', media: 50, dp: 10 },
  { id: 'z', nome: 'Escore z (média 0, DP 1)', media: 0, dp: 1 },
  { id: 'percentil', nome: 'Somente percentil' },
  { id: 'bruto', nome: 'Somente escore bruto (sem norma)' },
  { id: 'classificacao', nome: 'Somente classificação do manual' }
];

// Aproximação da função de distribuição normal (Abramowitz-Stegun 26.2.17)
export function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-z * z / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z > 0 ? 1 - p : p;
}
// Inversa (Acklam), para percentil → z
export function normInv(p: number): number {
  p = Math.min(Math.max(p, 0.0001), 0.9999);
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  let q: number, r: number;
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - pl) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  q = p - 0.5; r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

const num = (v: unknown): number | null => (v === null || v === undefined || v === '' || isNaN(Number(v)) ? null : Number(v));

// Leitura da classificação escrita pelo examinador (sem convertê-la em número)
export type Leitura = 'baixo' | 'limite' | 'medio' | 'alto' | 'elevado-sintoma' | 'normal-sintoma' | null;
export function lerClassificacao(txt: string, natureza: 'desempenho' | 'sintoma'): Leitura {
  const s = String(txt || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (!s.trim()) return null;
  if (natureza === 'sintoma') {
    // em escalas de sintomas, "superior"/"acima" significa mais sintomas (ex.: ETDAH); "médio superior" não conta
    if (/abaixo do (ponto de )?corte|nao atinge|dentro da media/.test(s)) return 'normal-sintoma';
    if (/acima do (ponto de )?corte|atinge o (ponto de )?corte|(^|[^o] )superior|^superior|muito acima|acima da media/.test(s) && !/medio superior|media superior/.test(s)) return 'elevado-sintoma';
    if (/(clinic|elevad|grave|sever|moderad|leve|acentuad|significativ|alterad|limitrofe|risco|positiv)/.test(s) && !/(nao|sem) (clinic|significativ|alterad)/.test(s)) return 'elevado-sintoma';
    if (/(normal|minim|ausen|nao clinic|sem sinais|esperado|negativ)/.test(s)) return 'normal-sintoma';
    return null;
  }
  if (/(muito inferior|extremamente baixo|deficit|deficitari|comprometid|prejudicad|intelectualmente deficiente|muito baixo)/.test(s)) return 'baixo';
  if (/(inferior|baixo|rebaixad|abaixo)/.test(s) && !/medio (inferior|baixo)/.test(s)) return 'baixo';
  if (/(limitrofe|medio inferior|medio baixo|media inferior)/.test(s)) return 'limite';
  if (/(superior|alto|acima)/.test(s) && !/medio superior/.test(s)) return 'alto';
  if (/(medio|media|normal|esperado|adequad|preservad)/.test(s)) return 'medio';
  return null;
}

export interface MedidaLida {
  z: number | null;            // equivalência interna (só para comparação)
  origemZ: 'escore' | 'percentil' | 'classificacao' | null;
  nivel: 'comprometido' | 'rebaixado' | 'limite' | 'medio' | 'alto' | 'sem-norma';
  elevadoSintoma: boolean | null; // apenas para natureza 'sintoma'
  percentilInformado: number | null;
  percentilAprox: number | null;
  inconsistencia: string | null;
}

// Converte a medida em z interno. Para medidas de sintoma, z alto = mais sintoma.
export function lerMedida(m: Medida, L: Limiares): MedidaLida {
  const met = METRICAS.find(x => x.id === m.metrica);
  const v = num(m.valor), pInf = num(m.percentil);
  let z: number | null = null, origem: MedidaLida['origemZ'] = null;
  if (met && met.dp && v !== null) { z = (v - (met.media as number)) / met.dp; origem = 'escore'; }
  else if (m.metrica === 'percentil' && v !== null) { z = normInv(v / 100); origem = 'percentil'; }
  else if (pInf !== null) { z = normInv(pInf / 100); origem = 'percentil'; }

  let inconsistencia: string | null = null;
  if (origem === 'escore' && pInf !== null && pInf > 0 && pInf < 100) {
    const zp = normInv(pInf / 100);
    if (Math.abs(zp - (z as number)) > 0.5) inconsistencia = `Escore ${v} e percentil ${pInf} parecem incompatíveis na curva normal. Confira os dados ou a tabela do manual (algumas normas não são normais).`;
  }

  const leitura = lerClassificacao(m.classificacaoExaminador, m.natureza);
  if (m.natureza === 'sintoma') {
    let elev: boolean | null = null;
    if (leitura === 'elevado-sintoma') elev = true;
    else if (leitura === 'normal-sintoma') elev = false;
    else if (z !== null) elev = z >= 1.5; // T ≥ 65 / percentil ≥ 93
    return { z, origemZ: origem, nivel: 'sem-norma', elevadoSintoma: elev, percentilInformado: pInf, percentilAprox: z !== null ? Math.round(normCdf(z) * 100) : null, inconsistencia };
  }

  let nivel: MedidaLida['nivel'] = 'sem-norma';
  if (leitura) { // a classificação do examinador tem precedência
    nivel = leitura === 'baixo' ? (z !== null && z <= L.comprometido ? 'comprometido' : 'rebaixado') : leitura === 'limite' ? 'limite' : leitura === 'alto' ? 'alto' : 'medio';
    if (z === null) origem = 'classificacao';
  } else if (z !== null) {
    nivel = z <= L.comprometido ? 'comprometido' : z <= L.rebaixado ? 'rebaixado' : z <= -1 ? 'limite' : z >= 1.33 ? 'alto' : 'medio';
  }
  return { z, origemZ: origem, nivel, elevadoSintoma: null, percentilInformado: pInf, percentilAprox: z !== null ? Math.round(normCdf(z) * 1000) / 10 : null, inconsistencia };
}

export const NOME_NIVEL: Record<MedidaLida['nivel'], string> = {
  comprometido: 'Comprometimento acentuado',
  rebaixado: 'Abaixo do esperado',
  limite: 'Limítrofe / médio inferior',
  medio: 'Dentro do esperado',
  alto: 'Acima do esperado',
  'sem-norma': 'Sem referência normativa'
};
