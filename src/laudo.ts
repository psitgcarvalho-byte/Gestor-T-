// Laudo: seções na ordem do §4 do prompt-mestre. Algumas são montadas pelo app (dados exatos);
// as narrativas são redigidas pela IA a partir do JSON anonimizado + análise do motor.
import type { Avaliacao, Paciente, Referencia, Citacao } from './engine/types';
import type { Analise } from './engine/raciocinio';
import { textoIdade } from './engine/raciocinio';
import { nomeDominio, NOME_TIPO } from './engine/catalogo';
import { NOME_NIVEL, METRICAS } from './engine/scores';
import { FONTES, NOME_STATUS } from './engine/hipoteses';

export interface Secao { id: string; titulo: string; modo: 'app' | 'ia'; instrucao?: string }

export const SECOES: Secao[] = [
  { id: 'identificacao', titulo: 'Identificação', modo: 'app' },
  { id: 'motivo', titulo: 'Motivo do encaminhamento', modo: 'ia', instrucao: 'Descreva o motivo do encaminhamento, quem solicitou e as queixas principais, de forma objetiva (Etapa 1). Um ou dois parágrafos.' },
  { id: 'objetivo', titulo: 'Objetivo da avaliação', modo: 'ia', instrucao: 'Explicite o objetivo da avaliação em um parágrafo breve, coerente com a demanda e as hipóteses registradas.' },
  { id: 'dados', titulo: 'Dados recebidos e controle de consistência', modo: 'ia', instrucao: 'Resuma os materiais e fontes efetivamente disponíveis e descreva os problemas do campo "consistencia" (Etapa 0), indicando como afetam a interpretação. Não repita alertas SATEPSI integralmente; apenas mencione que constam na seção de instrumentos.' },
  { id: 'procedimentos', titulo: 'Procedimentos realizados', modo: 'ia', instrucao: 'Descreva os procedimentos: entrevistas, informantes, observação, período e instrumentos aplicados (só os nomes, sem resultados).' },
  { id: 'historia', titulo: 'Histórico clínico e anamnese', modo: 'ia', instrucao: 'Reconstrua o histórico de forma cronológica e lógica (Etapa 2): desenvolvimento, saúde e neurologia, medicação, família (sem causalidade automática), escolaridade, funcionamento atencional/executivo, emocional, social e adaptativo. Termine com o subtítulo "### Linha do tempo clínica". Se houver medicação, explique de modo prudente seu efeito esperado e como pode produzir, mimetizar ou atenuar sintomas e resultados, recomendando confirmar com o prescritor. Não formule diagnóstico.' },
  { id: 'observacao', titulo: 'Observações comportamentais', modo: 'ia', instrucao: 'Descreva objetivamente o comportamento durante as sessões (Etapa 3) e a validade do desempenho (esforço, fatores interferentes), diferenciando o observado da interpretação.' },
  { id: 'instrumentos', titulo: 'Instrumentos utilizados e verificação no SATEPSI', modo: 'app' },
  { id: 'resultados', titulo: 'Resultados e análise neuropsicológica', modo: 'ia', instrucao: 'POR DOMÍNIO' },
  { id: 'integracao', titulo: 'Integração dos resultados', modo: 'ia', instrucao: 'Integre (Etapas 7 a 10): análise intraindividual (recursos e fragilidades relativas), relações funcionais entre domínios como hipóteses, repercussão funcional e ecológica (sem tratar resultado de teste como prejuízo funcional automático), integração multimétodo e multi-informante, e convergências e divergências entre queixa, testes e escalas (campo "dominios.convergencia"), explicando-as sem forçar sua resolução.' },
  { id: 'parteA', titulo: 'Parte A — Possíveis transtornos e fundamentação clínico-científica', modo: 'ia', instrucao: 'Para cada hipótese registrada (Etapa 11): (1) denominação técnica; (2) paráfrase dos critérios essenciais do DSM-5-TR (organização sindrômica, início, persistência, contextos, prejuízo exigido), sem reproduzir o manual; (3) processos neuropsicológicos tipicamente associados, deixando claro que nenhum padrão cognitivo isolado confirma o diagnóstico; (4) indicações clínicas típicas; (5) correspondência com o caso (evidências compatíveis, critérios não demonstrados, evidências contrárias, fatores que produzem manifestações semelhantes, informações necessárias); (6) limite interpretativo: caracterização pré-diagnóstica. Um subtítulo "### " por hipótese. Selecione apenas as hipóteses registradas.' },
  { id: 'hipoteses', titulo: 'Hipóteses e impressão diagnóstica', modo: 'ia', instrucao: 'Para cada hipótese, na ordem de hierarquia já calculada, apresente (Etapa 12): evidências clínicas, neuropsicológicas, do desenvolvimento, funcionais, comportamentais e de escalas; critérios atendidos; não demonstrados; a investigar; evidências contrárias; explicações alternativas; e o grau de sustentação EXATAMENTE como informado no campo "grau", com justificativa que retome as forças e fraquezas das medidas (o que reforça, enfraquece ou é neutro). Um subtítulo "### " por hipótese.' },
  { id: 'parteB', titulo: 'Parte B — Cruzamento entre hipóteses e literatura', modo: 'ia', instrucao: 'Se houver duas ou mais hipóteses com sustentação ao menos parcial, examine apenas as combinações mais prováveis (Etapa 13): coexistência, precedência temporal, interação, impacto sobre a avaliação, perfil neuropsicológico combinado, prognóstico e aplicação ao caso. Use APENAS as referências fornecidas; não informe prevalências ou números sem fonte da lista. Se não houver fonte na lista para um aspecto, escreva que "não foram incluídos dados epidemiológicos por ausência de fonte verificada". Se houver menos de duas hipóteses sustentadas, escreva em um parágrafo que o cruzamento não se aplica e por quê.' },
  { id: 'diferencial', titulo: 'Diagnóstico diferencial e comorbidades', modo: 'ia', instrucao: 'Compare as hipóteses concorrentes (Etapas 14 e 15) por contraste e exclusão progressiva: previsão de cada hipótese, achado observado, compatibilidade, impacto funcional e efeito sobre a sustentação; considere fatores emocionais, médicos e contextuais. Diferencie condição principal, associada, possível comorbidade, consequência secundária e diagnóstico diferencial. Evite exclusões baseadas em um único subteste.' },
  { id: 'conclusao', titulo: 'Conclusão', modo: 'ia', instrucao: 'Narrativa integrada (Etapa 17), nesta ordem, com subtítulos "### ": (A) recursos preservados; (B) principais fragilidades; (C) relação entre os domínios; (D) repercussão funcional; (E) integração com a história clínica; (F) aspectos das Partes A e B que mudam a compreensão do caso; (G) hipótese principal, só se sustentada, com formulação prudente; (H) comorbidades; (I) diagnóstico diferencial: o que foi fortalecido ou enfraquecido; (J) nível de sustentação da hipótese principal: Alto, Moderado, Baixo ou Dados insuficientes, com justificativa. A conclusão integra; não repete os resultados.' },
  { id: 'recomendacoes', titulo: 'Recomendações clínicas e encaminhamentos', modo: 'ia', instrucao: 'Recomendações individualizadas e coerentes com os achados (Etapa 18), cada uma com seu objetivo em uma frase. Inclua avaliação complementar quando necessária para confirmar, refinar ou excluir hipóteses. Pode usar lista com "- ".' },
  { id: 'adicionais', titulo: 'Dados adicionais necessários', modo: 'ia', instrucao: 'Liste, com "- ", apenas as informações capazes de modificar significativamente a conclusão (use "lacunas" e "hipoteses.dadosFaltantes").' },
  { id: 'limitacoes', titulo: 'Limitações da avaliação', modo: 'ia', instrucao: 'Apresente as limitações metodológicas e informações ausentes relevantes, incluindo as cautelas do campo "cautelas" e a menção aos instrumentos sem parecer favorável (os alertas completos são inseridos pelo app logo após este texto).' },
  { id: 'referencias', titulo: 'Referências', modo: 'app' },
  { id: 'assinatura', titulo: 'Assinatura', modo: 'app' }
];

export function sistema(trat: string) {
  return [
    'Você redige seções de uma Avaliação Neuropsicológica que será revisada e assinada pelo psicólogo responsável. Siga rigorosamente:',
    '1. FIDELIDADE: use exclusivamente os DADOS em JSON. Não invente resultados, sintomas, antecedentes, datas, escores, percentis, classificações, normas, diagnósticos ou referências. Faltando informação, escreva "Informação não disponível nos dados fornecidos." Sem sustentação, escreva "Os dados disponíveis são insuficientes para uma conclusão segura sobre este aspecto."',
    '2. NÍVEIS: diferencie dado objetivo, interpretação, inferência clínica, hipótese explicativa, hipótese diagnóstica e diagnóstico diferencial. Nunca apresente inferência como fato.',
    '3. TESTES: preserve exatamente percentis e classificações informados pelo examinador. Os campos "z" e "nivelInterno" são aproximações calculadas só para comparação interna: não os apresente como resultado normativo. Não trate escala de rastreio como diagnóstico, nem teste isolado como confirmação, nem associe desempenho a lesão específica.',
    '4. SATEPSI: medidas com "utilizada": false não podem fundamentar hipóteses, conclusões ou classificações; cite-as apenas como informação documental.',
    '5. PRUDÊNCIA: use "é compatível com", "sugere", "há indicadores de", "sustentação parcial"; "confirma" apenas quando os critérios estiverem demonstrados. Mantenha os graus de sustentação calculados.',
    '6. FONTES: cite somente as REFERÊNCIAS fornecidas, em sistema autor-data. Citações diretas somente do BANCO DE CITAÇÕES, literalmente, entre aspas, com autor, ano e página, seguidas da aplicação ao caso. Sem citações no banco, não faça citação direta. Nunca invente autores, páginas, DOI, prevalências ou estatísticas.',
    '7. ESTILO: português do Brasil, técnico, objetivo, prudente e impessoal; sem adjetivos excessivos, sem linguagem estigmatizante ou determinista; cada parágrafo cumpre uma função; sem revisão teórica que não altere a compreensão do caso; não exponha raciocínio passo a passo.',
    `8. FORMATO: parágrafos de texto corrido. Subtítulos internos só em linhas iniciadas por "### ". Sem negrito, sem tabelas, sem markdown. Listas apenas quando a seção pedir, com "- ". Não repita o título da seção. Refira-se ao avaliado como "${trat}".`
  ].join('\n');
}

// Remove nomes e contatos do texto livre antes de enviar à IA.
// - nome do paciente (em bloco: "Maria Eduarda Fontes" → "a paciente")
// - familiares que compartilham o sobrenome ("Joana Fontes" → "[familiar]")
// - nomes cadastrados em "Responsáveis" → "[responsável]"
// - e-mail, telefone e CPF
const CONECT = '(?:de|da|do|dos|das|e)';
const escRe = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toks = (s: string) => String(s || '').split(/[\s,;/]+/).map(t => t.trim()).filter(t => t.length >= 3 && !new RegExp('^' + CONECT + '$', 'i').test(t));
const bloco = (ts: string[]) => { const alt = ts.map(escRe).join('|'); return `(?:${alt})(?:\\s+(?:${CONECT}\\s+)?(?:${alt}))*`; };
export function anonimizar(txt: string, pac?: Paciente, trat = 'o(a) paciente'): string {
  let s = String(txt || '')
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, '[e-mail]')
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF]')
    .replace(/(\(?\b\d{2}\)?\s?)?\b\d{4,5}-?\d{4}\b/g, '[telefone]');
  const nome = toks(pac?.nome || ''), resp = toks(pac?.responsaveis || '');
  if (resp.length) s = s.replace(new RegExp(`(?<![\\p{L}])${bloco(resp)}(?![\\p{L}])`, 'giu'), '[responsável]');
  if (nome.length) {
    const primeiro = nome[0], sobren = nome.slice(1);
    if (sobren.length) {
      // Prenome desconhecido + sobrenome do paciente = outra pessoa da família
      s = s.replace(new RegExp(`(?<![\\p{L}])((?:\\p{Lu}[\\p{Ll}]+\\s+)+)(?:${CONECT}\\s+)?${bloco(sobren)}(?![\\p{L}])`, 'gu'), (m, pre: string) =>
        new RegExp(`(?:^|\\s)${escRe(primeiro)}(?:\\s|$)`, 'i').test(pre) ? m : '[familiar]');
    }
    s = s.replace(new RegExp(`(?<![\\p{L}])${bloco(nome)}(?![\\p{L}])`, 'giu'), trat);
  }
  return s;
}

export function tratamento(pac?: Paciente) {
  const s = (pac?.sexo || '').toLowerCase();
  return s.startsWith('f') ? 'a paciente' : s.startsWith('m') ? 'o paciente' : 'o(a) paciente';
}

const escoreTexto = (m: Analise['medidas'][number]) => {
  const met = METRICAS.find(x => x.id === m.m.metrica);
  const v = m.m.valor !== null && m.m.valor !== undefined ? `${m.m.valor}` : '';
  return [v && met?.dp ? `${v} (${m.m.metrica === 'qi' ? 'escore composto' : m.m.metrica === 'escalar' ? 'escore ponderado' : m.m.metrica === 't' ? 'escore T' : 'escore z'})` : v && m.m.metrica === 'percentil' ? `percentil ${v}` : '', m.m.bruto ? `bruto ${m.m.bruto}` : ''].filter(Boolean).join('; ') || 'não informado';
};

// JSON anonimizado com tudo que a IA precisa
export function dadosParaIA(av: Avaliacao, pac: Paciente | undefined, A: Analise, refs: Referencia[], cits: Citacao[]) {
  const trat = tratamento(pac), an = (s: string) => anonimizar(s, pac, trat);
  return {
    paciente: { idade: textoIdade(A.idade), sexo: pac?.sexo || 'não informado', escolaridade: pac?.escolaridade || 'não informada', lateralidade: pac?.lateralidade || 'não informada' },
    demanda: { solicitante: an(av.demanda.solicitante), motivo: an(av.demanda.motivo), objetivo: an(av.demanda.objetivo), periodo: av.demanda.periodo, queixas: av.demanda.queixas.map(nomeDominio), detalhes: an(av.demanda.queixaTexto) },
    historia: Object.fromEntries(Object.entries(av.historia).filter(([k, v]) => k !== 'anamneseBruta' && String(v).trim()).map(([k, v]) => [k, an(String(v))])),
    anamneseOriginal: Object.values(av.historia).filter(v => String(v).trim()).length <= 1 ? an(av.historia.anamneseBruta).slice(0, 20000) : undefined,
    observacao: { texto: an(av.observacao.texto), esforco: av.observacao.validade.esforco || 'não registrado', fatoresInterferentes: av.observacao.validade.fatores, obs: an(av.observacao.validade.obs) },
    informantes: an(av.informantes),
    instrumentos: A.instrumentos.map(x => ({ nome: x.inst.nome, versao: x.inst.versao, tipo: NOME_TIPO[x.inst.tipo], satepsi: x.inst.satepsi.status, dataConsulta: x.inst.satepsi.data, faixaNormativa: x.inst.satepsi.faixaNormativa, utilizavelNaIntegracao: x.utilizavel, nota: x.nota })),
    medidas: A.medidas.map(x => ({ instrumento: x.inst?.nome, medida: x.m.medida, dominio: nomeDominio(x.m.dominio), natureza: x.m.natureza, escore: escoreTexto(x), percentilInformado: x.m.percentil, classificacaoDoExaminador: x.m.classificacaoExaminador || null, nivelInterno: x.m.natureza === 'desempenho' ? NOME_NIVEL[x.lida.nivel] : (x.lida.elevadoSintoma === null ? 'indeterminado' : x.lida.elevadoSintoma ? 'sintomas elevados' : 'sem elevação'), z: x.lida.z === null ? null : Math.round(x.lida.z * 100) / 100, intraindividual: x.ipsativo, utilizada: x.utilizada, motivoExclusao: x.motivoExclusao, observacoes: an(x.m.obs) })),
    intraindividual: { mediaPessoalZ: A.mediaPessoal, discrepanciaEntreIndices: A.discrepanciaCompostos },
    dominios: A.dominios.filter(d => d.n || d.queixa).map(d => ({ dominio: d.nome, status: d.status, queixa: d.queixa, convergencia: d.convergencia, intraindividual: d.ipsativo })),
    consistencia: A.consistencia.map(p => p.texto), cautelas: A.cautelas,
    hipoteses: A.hipoteses.map(h => ({ nome: h.nome, grau: h.grau, justificativaDoAlgoritmo: h.justificativa, criterios: h.criterios.map(c => ({ criterio: c.texto, status: NOME_STATUS[c.status], indicadorQuantitativo: c.sugestao })), fontesConvergentes: FONTES.filter(f => h.fontesAtivas.includes(f.id)).map(f => f.nome), dominiosAssociados: h.dominios.map(d => `${d.nome}: ${d.status}`), dadosFaltantes: h.dadosFaltantes, notasDoProfissional: an(h.notas) })),
    lacunas: A.lacunas.map(l => `${nomeDominio(l.dominio)} (${l.motivo})`),
    referencias: refs.map(r => ({ citarComo: r.autorAno, referencia: r.abnt })),
    bancoDeCitacoes: cits.map(c => ({ texto: c.texto, autor: c.autor, ano: c.ano, pagina: c.pagina }))
  };
}

export function pedidoSecao(sec: Secao, dados: unknown, extra = '') {
  return `SEÇÃO: ${sec.titulo}\nINSTRUÇÃO: ${sec.instrucao}${extra ? '\n' + extra : ''}\n\nDADOS (JSON):\n${JSON.stringify(dados)}\n\nEscreva agora somente o texto desta seção.`;
}

// Proporção aproximada de citações diretas (§2.7) no texto analítico
export function proporcaoCitacoes(secoes: Record<string, string>): number {
  const analiticas = ['resultados', 'integracao', 'parteA', 'hipoteses', 'parteB', 'diferencial', 'conclusao', 'recomendacoes'];
  const txt = analiticas.map(k => secoes[k] || '').join(' ');
  const total = (txt.match(/[\p{L}\p{N}]+/gu) || []).length;
  const aspas = (txt.match(/“[^”]{3,}”|"[^"]{3,}"/g) || []).join(' ');
  const q = (aspas.match(/[\p{L}\p{N}]+/gu) || []).length;
  return total ? q / total : 0;
}
