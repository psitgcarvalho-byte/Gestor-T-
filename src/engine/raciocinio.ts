// Motor de raciocínio clínico — segue as etapas do prompt-mestre do autor:
// 0 consistência · 4 SATEPSI · 5 subtestes · 6 domínios · 7 intraindividual · 10 convergências/divergências
// 12 hipóteses e grau de sustentação · 16 hierarquização · 19 auditoria.
// Tudo é determinístico e explicável; a decisão clínica final é sempre do profissional.
import type { Avaliacao, Paciente, Instrumento, Medida, Limiares, Grau, StatusCriterio } from './types';
import { lerMedida, type MedidaLida, NOME_NIVEL } from './scores';
import { DOMINIOS, CATALOGO, nomeDominio, type ItemCatalogo } from './catalogo';
import { HIPOTESES, FONTES, PESO_TOTAL, type HipoteseDef } from './hipoteses';

export const LIMIARES_PADRAO: Limiares = { rebaixado: -1.5, comprometido: -2.0, ipsativo: 1.0 };

export interface Problema { nivel: 'erro' | 'aviso' | 'info'; texto: string }

export function idade(nasc: string, ref: Date = new Date()): { anos: number; meses: number } | null {
  if (!nasc) return null;
  const d = new Date(nasc + 'T12:00:00');
  if (isNaN(d.getTime())) return null;
  let meses = (ref.getFullYear() - d.getFullYear()) * 12 + ref.getMonth() - d.getMonth();
  if (ref.getDate() < d.getDate()) meses--;
  return meses < 0 ? null : { anos: Math.floor(meses / 12), meses: meses % 12 };
}
export const textoIdade = (i: { anos: number; meses: number } | null) => (i ? `${i.anos} ano(s) e ${i.meses} mês(es)` : 'Informação não disponível nos dados fornecidos');

const fmtData = (iso: string) => { if (!iso) return '[data não registrada]'; const [a, m, d] = iso.split('-'); return `${d}/${m}/${a}`; };

// ---- SATEPSI (§2.4) ----
export function usoInstrumento(i: Instrumento): { utilizavel: boolean; alerta: string | null; nota: string | null } {
  const s = i.satepsi, nome = `${i.nome}${i.versao ? ' — ' + i.versao : ''}`;
  if (s.status === 'Não privativo') {
    return { utilizavel: s.compativel !== 'nao', alerta: s.compativel === 'nao' ? alertaIncompativel(i) : null,
      nota: `${nome} consta como instrumento não privativo do psicólogo: essa classificação não equivale a parecer favorável nem indica avaliação de sua qualidade psicométrica; sua adequação deve ser fundamentada no manual e na literatura.` };
  }
  if (s.status === 'Favorável') {
    if (s.compativel === 'nao') return { utilizavel: false, alerta: alertaIncompativel(i), nota: null };
    return { utilizavel: true, alerta: null, nota: null };
  }
  if (s.status === 'Não verificado') {
    return { utilizavel: false, nota: null,
      alerta: `VERIFICAÇÃO SATEPSI PENDENTE — A situação do instrumento ${nome} no SATEPSI ainda não foi registrada. Consulte o site oficial e registre status e data antes de usar seus resultados na integração.` };
  }
  const status = s.status === 'Não localizado' ? 'não localizado no SATEPSI' : s.status;
  return { utilizavel: false, nota: null,
    alerta: `OBSERVAÇÃO SATEPSI — Na consulta realizada em ${fmtData(s.data)}, o instrumento ${nome} constava no SATEPSI como ${status}. Por não apresentar parecer favorável vigente para uso profissional como teste psicológico, seus resultados não deverão ser utilizados para fundamentar hipóteses diagnósticas, conclusões, classificações ou decisões profissionais. Caso o dado tenha sido recebido de avaliação anterior, descreva-o apenas como informação documental, sem validá-lo tecnicamente, e recomende instrumento substitutivo favorável e adequado.` };
}
function alertaIncompativel(i: Instrumento) {
  return `OBSERVAÇÃO SATEPSI — Embora o instrumento ${i.nome}${i.versao ? ' — ' + i.versao : ''} conste como ${i.satepsi.status === 'Não privativo' ? 'não privativo' : 'favorável'}, foi identificada incompatibilidade entre as condições aprovadas e o uso realizado, referente a ${i.satepsi.incompatibilidade || '[especificar: versão/faixa etária/público-alvo/modalidade de aplicação/correção/normas/prazo dos estudos]'}. O resultado deve ser interpretado com restrição e não poderá sustentar conclusão diagnóstica sem dados complementares tecnicamente adequados.`;
}

// ---- Resultado da análise ----
export interface MedidaAnalisada {
  m: Medida; inst: Instrumento | undefined; lida: MedidaLida; utilizada: boolean; motivoExclusao: string | null;
  ipsativo: 'recurso relativo' | 'fragilidade relativa' | null; desvioPessoal: number | null;
}
export type StatusDominio = 'comprometimento demonstrado' | 'achado isolado' | 'limítrofe' | 'preservado' | 'escala elevada' | 'escala sem elevação' | 'sem referência normativa' | 'descrição de traços' | 'não avaliado';
export type Convergencia = 'convergente' | 'convergência parcial' | 'queixa sem confirmação' | 'achado sem queixa' | 'lacuna: queixa não avaliada' | 'sem queixa, preservado' | '—';
export interface DominioAnalisado {
  id: string; nome: string; n: number; nUsadas: number; mediaZ: number | null; minZ: number | null;
  nBaixas: number; status: StatusDominio; ipsativo: 'recurso relativo' | 'fragilidade relativa' | null;
  queixa: boolean; convergencia: Convergencia; sintomaElevado: boolean | null;
}
export interface HipoteseAnalisada {
  id: string; nome: string; def: HipoteseDef | null;
  criterios: { id: string; texto: string; essencial: boolean; status: StatusCriterio; sugestao: string | null }[];
  fontesAtivas: string[]; fontesAuto: string[]; pesoConvergencia: number;
  dominios: { id: string; nome: string; status: StatusDominio }[];
  grauSugerido: Grau; grau: Grau; justificativa: string; dadosFaltantes: string[]; observacao?: string; notas: string;
}
export interface Analise {
  idade: { anos: number; meses: number } | null;
  consistencia: Problema[];
  instrumentos: { inst: Instrumento; utilizavel: boolean; alerta: string | null; nota: string | null }[];
  medidas: MedidaAnalisada[];
  mediaPessoal: number | null; dpPessoal: number | null;
  dominios: DominioAnalisado[];
  discrepanciaCompostos: { maior: string; menor: string; difDP: number } | null;
  nBaixas: number; nDesempenho: number;
  cautelas: string[];
  hipoteses: HipoteseAnalisada[];
  lacunas: { dominio: string; motivo: string; sugestoes: ItemCatalogo[] }[];
  auditoria: { ok: boolean; texto: string }[];
}

const media = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const dp = (a: number[]) => { const m = media(a); return a.length > 1 && m !== null ? Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)) : null; };
const r1 = (x: number | null) => (x === null ? null : Math.round(x * 100) / 100);

export function analisar(av: Avaliacao, pac: Paciente | undefined, L: Limiares = LIMIARES_PADRAO, hoje: Date = new Date()): Analise {
  const cons: Problema[] = [];
  const id = idade(pac?.nascimento || '', hoje);

  // ---- Etapa 0: consistência dos dados ----
  if (!pac?.nascimento) cons.push({ nivel: 'erro', texto: 'Data de nascimento não registrada: a idade é necessária para escolher e conferir as normas.' });
  if (!pac?.escolaridade) cons.push({ nivel: 'aviso', texto: 'Escolaridade não registrada.' });
  if (!av.demanda.motivo.trim()) cons.push({ nivel: 'aviso', texto: 'Motivo do encaminhamento não registrado.' });
  if (!av.observacao.validade.esforco) cons.push({ nivel: 'aviso', texto: 'Validade do desempenho (esforço/engajamento) não registrada: sem ela, resultados baixos não podem ser interpretados com segurança.' });
  else if (av.observacao.validade.esforco !== 'adequado') cons.push({ nivel: 'aviso', texto: `Esforço/engajamento registrado como "${av.observacao.validade.esforco}": resultados baixos devem ser interpretados com restrição.` });
  if (av.historia.medicacao.trim()) cons.push({ nivel: 'info', texto: 'Há medicação registrada: o laudo deve explicar seu efeito e como pode produzir, mimetizar ou atenuar sintomas e resultados (§9).' });

  const instById = new Map(av.instrumentos.map(i => [i.id, i]));
  const instrumentos = av.instrumentos.map(inst => ({ inst, ...usoInstrumento(inst) }));
  const usoById = new Map(instrumentos.map(x => [x.inst.id, x]));
  instrumentos.forEach(x => { if (x.alerta) cons.push({ nivel: x.inst.satepsi.status === 'Não verificado' ? 'aviso' : 'erro', texto: x.alerta }); });

  const vistos = new Set<string>();
  const vazias: string[] = [];
  const medidas: MedidaAnalisada[] = av.resultados.map(m => {
    const inst = instById.get(m.instrumentoId);
    const lida = lerMedida(m, L);
    let motivo: string | null = null;
    if (!inst) motivo = 'medida sem instrumento identificado';
    else if (!usoById.get(inst.id)!.utilizavel) motivo = 'instrumento sem parecer favorável/compatível no SATEPSI (ou não verificado)';
    else if (m.valor === null && m.percentil === null && !m.classificacaoExaminador.trim() && !m.bruto.trim()) motivo = 'sem dado';
    else if (m.natureza === 'desempenho' && lida.nivel === 'sem-norma') motivo = 'sem referência normativa (apenas escore bruto)';
    if (!inst) cons.push({ nivel: 'erro', texto: `Resultado "${m.medida || '(sem nome)'}" sem identificação do instrumento.` });
    if (!m.medida.trim()) cons.push({ nivel: 'aviso', texto: `Há um resultado de ${inst?.nome || 'instrumento não identificado'} sem nome de medida/subteste.` });
    if (m.valor === null && m.percentil === null && !m.classificacaoExaminador.trim() && !m.bruto.trim()) vazias.push(`${m.medida || '(sem nome)'} (${inst?.nome || '?'})`);
    if (m.metrica === 'bruto' && m.natureza === 'desempenho') cons.push({ nivel: 'aviso', texto: `"${m.medida}" tem só escore bruto: sem tabela normativa não pode ser interpretado normativamente (§2.3).` });
    if (lida.inconsistencia) cons.push({ nivel: 'aviso', texto: `"${m.medida}" (${inst?.nome || '?'}): ${lida.inconsistencia}` });
    const chave = `${m.instrumentoId}|${m.medida.trim().toLowerCase()}`;
    if (m.medida.trim() && vistos.has(chave)) cons.push({ nivel: 'aviso', texto: `Resultado duplicado: "${m.medida}" aparece mais de uma vez em ${inst?.nome || '?'}.` });
    vistos.add(chave);
    return { m, inst, lida, utilizada: !motivo, motivoExclusao: motivo, ipsativo: null, desvioPessoal: null };
  });

  if (vazias.length) cons.push({ nivel: 'erro', texto: vazias.length === 1 ? `"${vazias[0]}" não tem escore, percentil nem classificação.` : `${vazias.length} medidas sem escore, percentil nem classificação — preencha ou remova: ${vazias.slice(0, 6).join('; ')}${vazias.length > 6 ? '…' : ''}.` });

  // ---- Etapa 7: análise intraindividual (média pessoal das medidas de desempenho utilizáveis) ----
  const desemp = medidas.filter(x => x.utilizada && x.m.natureza === 'desempenho' && x.lida.z !== null);
  // Índice composto que resume medidas do mesmo instrumento e domínio (ex.: IVP com Código e Procurar Símbolos,
  // Atenção Geral com AC/AD/AA) não é evidência independente: fica fora das contagens e da média pessoal.
  const redundante = (x: MedidaAnalisada) => x.m.composto && medidas.some(y => y !== x && y.utilizada && !y.m.composto && y.m.instrumentoId === x.m.instrumentoId && y.m.dominio === x.m.dominio && y.m.natureza === x.m.natureza && (y.lida.z !== null || y.lida.nivel !== 'sem-norma'));
  const indep = desemp.filter(x => !redundante(x));
  const zs = indep.map(x => x.lida.z as number);
  const mp = media(zs), dpp = dp(zs);
  if (mp !== null && zs.length >= 3) desemp.forEach(x => {
    const d = (x.lida.z as number) - mp; x.desvioPessoal = r1(d);
    if (d <= -L.ipsativo) x.ipsativo = 'fragilidade relativa'; else if (d >= L.ipsativo) x.ipsativo = 'recurso relativo';
  });

  // Discrepância entre índices compostos (cautela na interpretação de escore global)
  let disc: Analise['discrepanciaCompostos'] = null;
  const comp = desemp.filter(x => x.m.composto && x.m.dominio !== 'intelecto' && x.lida.origemZ === 'escore');
  if (comp.length >= 2) {
    const ord = comp.slice().sort((a, b) => (a.lida.z as number) - (b.lida.z as number));
    const dif = (ord[ord.length - 1].lida.z as number) - (ord[0].lida.z as number);
    if (dif >= 1.5) disc = { maior: ord[ord.length - 1].m.medida, menor: ord[0].m.medida, difDP: r1(dif) as number };
  }

  // ---- Etapa 6 + 10: domínios e convergência com a queixa ----
  const dominios: DominioAnalisado[] = DOMINIOS.map(d => {
    const todas = medidas.filter(x => x.m.dominio === d.id);
    const us = todas.filter(x => x.utilizada);
    const des = us.filter(x => x.m.natureza === 'desempenho' && !redundante(x));
    const sin = us.filter(x => x.m.natureza === 'sintoma' && !redundante(x));
    const dz = des.filter(x => x.lida.z !== null).map(x => x.lida.z as number);
    const nBaixas = des.filter(x => x.lida.nivel === 'rebaixado' || x.lida.nivel === 'comprometido').length;
    const nLim = des.filter(x => x.lida.nivel === 'limite').length;
    const elev = sin.length ? sin.some(x => x.lida.elevadoSintoma === true) : null;
    let status: StatusDominio = 'não avaliado';
    if (des.length) {
      if (nBaixas >= 2) status = 'comprometimento demonstrado';
      else if (nBaixas === 1) status = 'achado isolado';
      else if (nLim > 0 && nLim >= des.length / 2) status = 'limítrofe';
      else if (des.every(x => x.lida.nivel === 'sem-norma')) status = 'sem referência normativa';
      else status = 'preservado';
    } else if (sin.length) status = d.descritivo ? 'descrição de traços' : elev ? 'escala elevada' : 'escala sem elevação';
    const md = media(dz);
    let ips: DominioAnalisado['ipsativo'] = null;
    if (md !== null && mp !== null && zs.length >= 3) { if (md - mp <= -L.ipsativo) ips = 'fragilidade relativa'; else if (md - mp >= L.ipsativo) ips = 'recurso relativo'; }
    const queixa = av.demanda.queixas.includes(d.id);
    let conv: Convergencia = '—';
    const baixo = status === 'comprometimento demonstrado' || status === 'escala elevada';
    if (queixa) conv = baixo ? 'convergente' : status === 'achado isolado' || status === 'limítrofe' ? 'convergência parcial' : status === 'não avaliado' || status === 'sem referência normativa' ? 'lacuna: queixa não avaliada' : 'queixa sem confirmação';
    else if (baixo || status === 'achado isolado') conv = 'achado sem queixa';
    else if (status === 'preservado' || status === 'escala sem elevação') conv = 'sem queixa, preservado';
    if (d.descritivo) conv = '—';
    return { id: d.id, nome: d.nome, n: todas.length, nUsadas: us.length, mediaZ: r1(md), minZ: r1(dz.length ? Math.min(...dz) : null), nBaixas, status, ipsativo: ips, queixa, convergencia: conv, sintomaElevado: d.descritivo ? null : elev };
  });

  // ---- Cautelas interpretativas ----
  const nBaixas = indep.filter(x => x.lida.nivel === 'rebaixado' || x.lida.nivel === 'comprometido').length;
  const cautelas: string[] = [];
  if (indep.length >= 8 && nBaixas > 0 && nBaixas <= 2) cautelas.push(`Há ${nBaixas} escore(s) abaixo do esperado entre ${indep.length} medidas. Em baterias extensas, escores baixos isolados também ocorrem em pessoas sem condição clínica: não fundamente conclusões em achados isolados.`);
  if (disc) cautelas.push(`Discrepância de ${disc.difDP.toString().replace('.', ',')} DP entre "${disc.maior}" e "${disc.menor}": o escore global deve ser interpretado com cautela; priorize a análise dos índices.`);
  if (av.observacao.validade.fatores.length) cautelas.push(`Fatores que podem ter interferido no desempenho: ${av.observacao.validade.fatores.join(', ')}.`);
  const emoc = dominios.find(d => d.id === 'emocional');
  if (emoc?.sintomaElevado && dominios.some(d => d.status === 'comprometimento demonstrado' || d.status === 'achado isolado')) cautelas.push('Escalas emocionais elevadas coexistem com desempenhos rebaixados: considere a contribuição do estado afetivo (ansiedade, humor) sobre atenção, memória e velocidade antes de atribuir os achados a um déficit primário.');
  medidas.filter(x => !x.utilizada && x.motivoExclusao && x.motivoExclusao !== 'sem dado').forEach(x => cautelas.push(`"${x.m.medida || '?'}" (${x.inst?.nome || '?'}) não entra na integração: ${x.motivoExclusao}.`));

  // ---- Etapa 12: hipóteses ----
  const domById = new Map(dominios.map(d => [d.id, d]));
  const hipoteses: HipoteseAnalisada[] = av.hipoteses.map(h => {
    const def = HIPOTESES.find(x => x.id === h.id) || null;
    const crits = (def ? def.criterios : (h.criteriosLivres || []).map((t, i) => ({ id: 'c' + i, texto: t || `Critério ${i + 1}`, essencial: true }))) as HipoteseDef['criterios'];
    const criterios = crits.map(c => ({ id: c.id, texto: c.texto, essencial: c.essencial, status: (h.criterios[c.id] || '') as StatusCriterio, sugestao: sugestao(c.auto, domById, desemp, L) }));
    const doms = (def?.dominiosAssociados || []).map(id => ({ id, nome: nomeDominio(id), status: domById.get(id)?.status || 'não avaliado' as StatusDominio }));
    const auto: string[] = [];
    if (doms.some(d => d.status === 'comprometimento demonstrado')) auto.push('testes');
    if ((def?.dominiosAssociados || []).some(id => domById.get(id)?.sintomaElevado)) auto.push('escalas');
    const ativas = Array.from(new Set([...Object.keys(h.fontes).filter(k => h.fontes[k]), ...auto]));
    const peso = FONTES.filter(f => ativas.includes(f.id)).reduce((a, f) => a + f.peso, 0);
    const { grau, justificativa } = calcularGrau(criterios, ativas, peso);
    const faltantes = [...(def?.dadosNecessarios || [])];
    criterios.filter(c => c.essencial && (c.status === '' || c.status === 'inv')).forEach(c => faltantes.push(`Investigar: ${c.texto}`));
    doms.filter(d => d.status === 'não avaliado').forEach(d => faltantes.push(`Domínio associado não avaliado: ${d.nome}`));
    return { id: h.id, nome: def?.nome || h.nomeLivre || 'Hipótese', def, criterios, fontesAtivas: ativas, fontesAuto: auto, pesoConvergencia: peso,
      dominios: doms, grauSugerido: grau, grau: (h.grauManual || grau) as Grau, justificativa, dadosFaltantes: faltantes, observacao: def?.observacao, notas: h.notas };
  });
  const ordemGrau: Grau[] = ['Fortemente sustentada', 'Moderadamente sustentada', 'Parcialmente sustentada', 'Hipótese a investigar', 'Pouco sustentada'];
  hipoteses.sort((a, b) => ordemGrau.indexOf(a.grau) - ordemGrau.indexOf(b.grau) || b.pesoConvergencia - a.pesoConvergencia);

  // ---- Lacunas e sugestões de instrumentos ----
  const usadosCat = new Set(av.instrumentos.map(i => i.catalogoId).filter(Boolean));
  const lacunas: Analise['lacunas'] = [];
  const addLacuna = (dom: string, motivo: string) => {
    if (lacunas.some(l => l.dominio === dom)) return;
    lacunas.push({ dominio: dom, motivo, sugestoes: CATALOGO.filter(c => c.dominios.includes(dom) && !usadosCat.has(c.id)).slice(0, 4) });
  };
  dominios.filter(d => d.convergencia === 'lacuna: queixa não avaliada').forEach(d => addLacuna(d.id, 'há queixa neste domínio, mas nenhuma medida utilizável'));
  hipoteses.forEach(h => h.dominios.filter(d => d.status === 'não avaliado').forEach(d => addLacuna(d.id, `domínio associado à hipótese "${h.nome}"`)));

  // ---- Etapa 19: auditoria automática ----
  const aud: Analise['auditoria'] = [];
  const naoVerif = instrumentos.filter(x => x.inst.satepsi.status === 'Não verificado' || !x.inst.satepsi.data);
  aud.push({ ok: !!pac?.nascimento && !!pac?.escolaridade, texto: 'Idade e escolaridade registradas' });
  aud.push({ ok: instrumentos.length > 0 && naoVerif.length === 0, texto: naoVerif.length ? `SATEPSI: ${naoVerif.length} instrumento(s) sem status ou sem data de consulta` : 'SATEPSI consultado e datado para todos os instrumentos' });
  const excl = instrumentos.filter(x => !x.utilizavel).length;
  aud.push({ ok: true, texto: excl ? `${excl} instrumento(s) sem parecer favorável/compatível excluído(s) da integração, com alerta em vermelho` : 'Nenhum instrumento não favorável usado na integração' });
  const semDado = av.resultados.filter(m => m.valor === null && m.percentil === null && !m.classificacaoExaminador.trim() && !m.bruto.trim()).length;
  aud.push({ ok: av.resultados.length > 0 && semDado === 0, texto: semDado ? `${semDado} medida(s) sem nenhum dado` : 'Todas as medidas têm dado registrado' });
  const incons = medidas.filter(x => x.lida.inconsistencia).length;
  aud.push({ ok: incons === 0, texto: incons ? `${incons} inconsistência(s) entre escore e percentil a conferir` : 'Escores e percentis coerentes entre si' });
  aud.push({ ok: !!av.observacao.validade.esforco, texto: 'Validade do desempenho (esforço/engajamento) registrada' });
  const fracas = hipoteses.filter(h => ['Fortemente sustentada', 'Moderadamente sustentada', 'Parcialmente sustentada'].includes(h.grau) && h.fontesAtivas.length < 2);
  aud.push({ ok: fracas.length === 0, texto: fracas.length ? `Hipótese(s) sustentada(s) por uma única fonte: ${fracas.map(h => h.nome).join('; ')}` : 'Nenhuma hipótese sustentada por fonte única (teste ou escala isolada)' });
  const princ = hipoteses[0];
  aud.push({ ok: !princ || princ.fontesAtivas.includes('prejuizo'), texto: princ ? (princ.fontesAtivas.includes('prejuizo') ? 'Prejuízo funcional documentado para a hipótese principal' : 'Prejuízo funcional ainda não documentado para a hipótese principal') : 'Nenhuma hipótese registrada' });
  aud.push({ ok: av.referenciasIds.length > 0, texto: av.referenciasIds.length ? `${av.referenciasIds.length} referência(s) selecionada(s) para o laudo` : 'Nenhuma referência selecionada (o laudo exige referências efetivamente consultadas)' });

  return { idade: id, consistencia: cons, instrumentos, medidas, mediaPessoal: r1(mp), dpPessoal: r1(dpp), dominios, discrepanciaCompostos: disc,
    nBaixas, nDesempenho: desemp.length, cautelas, hipoteses, lacunas, auditoria: aud };
}

function sugestao(auto: string | undefined, dom: Map<string, DominioAnalisado>, desemp: MedidaAnalisada[], L: Limiares): string | null {
  if (!auto) return null;
  const fz = (z: number) => z.toFixed(2).replace('.', ',');
  if (auto === 'ql-intelecto') {
    const g = desemp.filter(x => x.m.dominio === 'intelecto' && x.m.composto && x.lida.z !== null).sort((a, b) => (a.lida.z as number) - (b.lida.z as number))[0];
    if (!g) return 'Nenhuma medida intelectual global utilizável registrada.';
    const z = g.lida.z as number;
    if (z <= -2) return `"${g.m.medida}" cerca de 2 DP ou mais abaixo da média (z ≈ ${fz(z)}): compatível com o critério A, se a validade da medida e o erro de medida forem considerados.`;
    if (z <= -1.33) return `"${g.m.medida}" em faixa limítrofe (z ≈ ${fz(z)}): considere o erro de medida; isoladamente não sustenta o critério A.`;
    return `"${g.m.medida}" não está rebaixado (z ≈ ${fz(z)}): não sustenta o critério A.`;
  }
  if (auto === 'ql-academico') {
    const a = dom.get('academico');
    if (!a || a.status === 'não avaliado') return 'Habilidades acadêmicas ainda não avaliadas com teste padronizado.';
    const n = desemp.filter(x => x.m.dominio === 'academico' && x.lida.z !== null && (x.lida.z as number) <= L.rebaixado).length;
    return n ? `${n} medida(s) acadêmica(s) abaixo do esperado: compatível com o critério B, se confirmada clinicamente e com interferência funcional.` : 'Nenhuma medida acadêmica abaixo do esperado: o critério B não é sustentado pelos testes.';
  }
  const cog = Array.from(dom.values()).filter(d => !['comportamento', 'emocional', 'adaptativo', 'social'].includes(d.id) && d.mediaZ !== null);
  if (auto === 'tnc-leve') {
    const f = cog.filter(d => (d.mediaZ as number) <= -1 && (d.mediaZ as number) > -2);
    return f.length ? `Prejuízo modesto (entre 1 e 2 DP) em: ${f.map(d => d.nome).join('; ')}. Confirme que representa declínio em relação ao nível prévio.` : 'Nenhum domínio com média entre 1 e 2 DP abaixo.';
  }
  if (auto === 'tnc-maior') {
    const f = cog.filter(d => (d.mediaZ as number) <= -2);
    return f.length ? `Prejuízo substancial (2 DP ou mais) em: ${f.map(d => d.nome).join('; ')}. Confirme declínio e repercussão nas atividades diárias.` : 'Nenhum domínio com média 2 DP ou mais abaixo.';
  }
  return null;
}

export function calcularGrau(criterios: { essencial: boolean; status: StatusCriterio }[], fontes: string[], peso: number): { grau: Grau; justificativa: string } {
  const ess = criterios.filter(c => c.essencial);
  const n = ess.length, ok = ess.filter(c => c.status === 'ok').length, nd = ess.filter(c => c.status === 'nd').length, contra = ess.filter(c => c.status === 'contra').length;
  const inv = n - ok - nd - contra;
  const conv = `${fontes.length} fonte(s) de evidência convergente(s) (peso ${peso} de ${PESO_TOTAL} na hierarquia do §6)`;
  const base = `Critérios essenciais: ${ok} atendido(s), ${nd} não demonstrado(s), ${inv} a investigar, ${contra} com evidência contrária, de ${n}. ${conv}.`;
  if (contra > 0) return { grau: 'Pouco sustentada', justificativa: `${base} Há evidência contrária a critério essencial.` };
  if (n > 0 && ok === n) {
    if (peso >= PESO_TOTAL / 2 && fontes.includes('prejuizo') && fontes.length >= 3) return { grau: 'Fortemente sustentada', justificativa: `${base} Todos os critérios essenciais atendidos, com convergência entre fontes independentes e prejuízo funcional documentado.` };
    return { grau: 'Moderadamente sustentada', justificativa: `${base} Critérios atendidos, mas a convergência entre fontes ${fontes.includes('prejuizo') ? 'ainda é limitada' : 'não inclui prejuízo funcional documentado'}.` };
  }
  if (nd > 0) return ok > 0 ? { grau: 'Parcialmente sustentada', justificativa: `${base} Parte dos critérios essenciais não foi demonstrada.` } : { grau: 'Pouco sustentada', justificativa: `${base} Nenhum critério essencial atendido e há critérios não demonstrados.` };
  return ok >= n / 2 && ok > 0 ? { grau: 'Parcialmente sustentada', justificativa: `${base} Critérios restantes ainda precisam ser investigados.` } : { grau: 'Hipótese a investigar', justificativa: `${base} Dados insuficientes para graduar a hipótese.` };
}

export { NOME_NIVEL };
