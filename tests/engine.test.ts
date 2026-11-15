import { analisar, calcularGrau, idade, LIMIARES_PADRAO as L } from '../src/engine/raciocinio';
import { lerMedida, lerClassificacao, normCdf, normInv } from '../src/engine/scores';
import type { Avaliacao, Medida, Instrumento } from '../src/engine/types';

let ok = 0, bad = 0;
const t = (n: string, c: boolean, info?: unknown) => { if (c) ok++; else { bad++; console.log('FALHOU', n, info ?? ''); } };

// ---- escores ----
t('normCdf(0)=0,5', Math.abs(normCdf(0) - 0.5) < 1e-6);
t('normCdf(-1)≈0,1587', Math.abs(normCdf(-1) - 0.1587) < 1e-3);
t('normInv(0,975)≈1,96', Math.abs(normInv(0.975) - 1.96) < 1e-2);
t('normInv inverso', Math.abs(normInv(normCdf(-1.7)) + 1.7) < 1e-3);
const M = (o: Partial<Medida>): Medida => ({ id: Math.random().toString(36), instrumentoId: 'i1', medida: 'x', dominio: 'atencao', natureza: 'desempenho', composto: false, metrica: 'qi', valor: null, percentil: null, bruto: '', classificacaoExaminador: '', obs: '', ...o });
t('QI 70 → z -2 → comprometido', lerMedida(M({ valor: 70 }), L).nivel === 'comprometido' && lerMedida(M({ valor: 70 }), L).z === -2);
t('escalar 7 → z -1 → limite', lerMedida(M({ metrica: 'escalar', valor: 7 }), L).nivel === 'limite');
t('T 30 → z -2', lerMedida(M({ metrica: 't', valor: 30 }), L).z === -2);
t('percentil 50 → médio', lerMedida(M({ metrica: 'percentil', valor: 50 }), L).nivel === 'medio');
t('percentil 5 → rebaixado', lerMedida(M({ metrica: 'percentil', valor: 5 }), L).nivel === 'rebaixado');
t('inconsistência escore×percentil detectada', !!lerMedida(M({ valor: 85, percentil: 70 }), L).inconsistencia);
t('escore×percentil coerente sem alerta', !lerMedida(M({ valor: 85, percentil: 16 }), L).inconsistencia);
t('classificação do examinador prevalece', lerMedida(M({ valor: 95, classificacaoExaminador: 'Inferior' }), L).nivel === 'rebaixado');
t('"Médio inferior" = limite', lerClassificacao('Médio inferior', 'desempenho') === 'limite');
t('"Média" = médio', lerClassificacao('Média', 'desempenho') === 'medio');
t('"Superior" = alto; "Médio superior" = médio', lerClassificacao('Superior', 'desempenho') === 'alto' && lerClassificacao('Médio superior', 'desempenho') === 'medio');
t('"Muito inferior" = baixo', lerClassificacao('Muito inferior', 'desempenho') === 'baixo');
t('sintoma: "Clínico" elevado; "Não clínico" normal', lerClassificacao('Clínico', 'sintoma') === 'elevado-sintoma' && lerClassificacao('Não clínico', 'sintoma') === 'normal-sintoma');
t('sintoma: T 72 elevado', lerMedida(M({ natureza: 'sintoma', metrica: 't', valor: 72 }), L).elevadoSintoma === true);
t('bruto sem norma', lerMedida(M({ metrica: 'bruto', bruto: '23' }), L).nivel === 'sem-norma');
t('idade', JSON.stringify(idade('2016-03-10', new Date('2025-09-09T12:00:00'))) === JSON.stringify({ anos: 9, meses: 5 }));

// ---- grau de sustentação ----
const C = (s: string[]) => s.map(x => ({ essencial: true, status: x as any }));
t('todos ok + convergência forte → Fortemente', calcularGrau(C(['ok', 'ok', 'ok']), ['desenvolvimento', 'sintomas', 'testes', 'prejuizo'], 24).grau === 'Fortemente sustentada');
t('todos ok sem prejuízo → Moderadamente', calcularGrau(C(['ok', 'ok']), ['desenvolvimento', 'sintomas', 'testes'], 21).grau === 'Moderadamente sustentada');
t('contra → Pouco', calcularGrau(C(['ok', 'contra']), ['sintomas'], 7).grau === 'Pouco sustentada');
t('ok + nd → Parcialmente', calcularGrau(C(['ok', 'nd']), [], 0).grau === 'Parcialmente sustentada');
t('nada avaliado → a investigar', calcularGrau(C(['', '', '']), [], 0).grau === 'Hipótese a investigar');

// ---- caso completo ----
const I = (id: string, nome: string, status: any, extra: Partial<Instrumento['satepsi']> = {}): Instrumento => ({ id, nome, versao: '', tipo: 'teste', dominios: [], satepsi: { status, data: '2026-11-14', faixaNormativa: '', compativel: 'sim', incompatibilidade: '', ...extra } });
const av: Avaliacao = {
  id: 'a1', pacienteId: 'p1', titulo: 'Avaliação', criadoEm: '', atualizadoEm: '',
  demanda: { solicitante: 'Escola', motivo: 'Desatenção', objetivo: '', periodo: '', queixas: ['atencao', 'memoria', 'academico'], queixaTexto: '' },
  historia: { anamneseBruta: '', desenvolvimento: '', medico: '', medicacao: 'Metilfenidato 10 mg', familiar: '', escolar: '', atencaoExecutivo: '', emocional: '', social: '', adaptativo: '', linhaTempo: '' },
  observacao: { texto: '', validade: { esforco: 'adequado', fatores: [], obs: '' } }, informantes: '',
  instrumentos: [I('w', 'WISC-IV', 'Favorável'), I('b', 'BPA-2', 'Favorável'), I('r', 'RAVLT', 'Favorável'), I('x', 'Teste X', 'Não verificado', { data: '' }), I('d', 'Teste D', 'Desfavorável'), I('s', 'SNAP-IV', 'Não privativo')],
  resultados: [
    M({ instrumentoId: 'w', medida: 'QI Total', dominio: 'intelecto', composto: true, valor: 92, percentil: 30 }),
    M({ instrumentoId: 'w', medida: 'ICV', dominio: 'verbal', composto: true, valor: 104 }),
    M({ instrumentoId: 'w', medida: 'IOP', dominio: 'naoverbal', composto: true, valor: 100 }),
    M({ instrumentoId: 'w', medida: 'IMO', dominio: 'mop', composto: true, valor: 76, percentil: 70 }), // inconsistente de propósito
    M({ instrumentoId: 'w', medida: 'IVP', dominio: 'velocidade', composto: true, valor: 80 }),
    M({ instrumentoId: 'b', medida: 'Atenção Concentrada', dominio: 'atencao', metrica: 'percentil', valor: 5 }),
    M({ instrumentoId: 'b', medida: 'Atenção Alternada', dominio: 'atencao', metrica: 'percentil', valor: 3 }),
    M({ instrumentoId: 'r', medida: 'Evocação tardia', dominio: 'memoria', metrica: 'escalar', valor: 10 }),
    M({ instrumentoId: 'x', medida: 'Leitura', dominio: 'academico', metrica: 'percentil', valor: 2 }),
    M({ instrumentoId: 'd', medida: 'Algo', dominio: 'executivo', metrica: 'qi', valor: 60 }),
    M({ instrumentoId: 's', medida: 'Desatenção', dominio: 'atencao', natureza: 'sintoma', metrica: 'classificacao', classificacaoExaminador: 'Acima do ponto de corte (clínico)' }),
    M({ instrumentoId: 'w', medida: 'ICV', dominio: 'verbal', composto: true, valor: 104 }) // duplicado
  ],
  hipoteses: [{ id: 'tdah', criterios: { a: 'ok', b: 'ok', c: 'ok', d: 'ok', e: 'ok' }, fontes: { desenvolvimento: true, sintomas: true, prejuizo: true }, notas: '' },
              { id: 'teap', criterios: { a: 'ok', b: 'nd' }, fontes: {}, notas: '' }],
  referenciasIds: [], laudo: { secoes: {}, geradoEm: '' }
};
const pac = { id: 'p1', nome: 'Teste', nascimento: '2016-03-10', sexo: 'M', escolaridade: '4º ano', lateralidade: '', responsaveis: '', contato: '', criadoEm: '' };
const A = analisar(av, pac, L, new Date('2026-11-14T12:00:00'));
const dom = (id: string) => A.dominios.find(d => d.id === id)!;
t('atenção: comprometimento demonstrado (2 medidas baixas)', dom('atencao').status === 'comprometimento demonstrado', dom('atencao'));
t('atenção: queixa convergente', dom('atencao').convergencia === 'convergente');
t('memória: queixa sem confirmação', dom('memoria').convergencia === 'queixa sem confirmação', dom('memoria'));
t('acadêmico: instrumento não verificado → lacuna', dom('academico').convergencia === 'lacuna: queixa não avaliada', dom('academico'));
t('executivo: desfavorável excluído → não avaliado', dom('executivo').status === 'não avaliado');
t('velocidade: IVP 80 (z -1,33) = limítrofe, não rebaixado', dom('velocidade').status === 'limítrofe', dom('velocidade'));
t('alerta SATEPSI desfavorável com modelo do protocolo', A.instrumentos.find(i => i.inst.id === 'd')!.alerta!.startsWith('OBSERVAÇÃO SATEPSI — Na consulta realizada em 14/11/2026'));
t('não privativo: utilizável com nota', A.instrumentos.find(i => i.inst.id === 's')!.utilizavel && !!A.instrumentos.find(i => i.inst.id === 's')!.nota);
t('inconsistência IMO detectada', A.consistencia.some(p => p.texto.includes('IMO')));
t('duplicado detectado', A.consistencia.some(p => p.texto.includes('duplicado')));
t('medicação lembrada', A.consistencia.some(p => p.texto.includes('medicação')));
t('discrepância entre índices (ICV 104 × IMO 76)', !!A.discrepanciaCompostos && A.discrepanciaCompostos.menor === 'IMO', A.discrepanciaCompostos);
t('intraindividual: atenção como fragilidade relativa', A.medidas.find(m => m.m.medida === 'Atenção Alternada')!.ipsativo === 'fragilidade relativa');
const tdah = A.hipoteses.find(h => h.id === 'tdah')!;
t('TDAH: testes e escalas ativados automaticamente', tdah.fontesAuto.includes('testes') && tdah.fontesAuto.includes('escalas'), tdah.fontesAuto);
t('TDAH: fortemente sustentada', tdah.grau === 'Fortemente sustentada', tdah.justificativa);
t('TEAp: parcialmente sustentada', A.hipoteses.find(h => h.id === 'teap')!.grau === 'Parcialmente sustentada');
t('hierarquia: TDAH primeiro', A.hipoteses[0].id === 'tdah');
t('TEAp: sugestão do critério B diz não avaliado', /não avaliadas/.test(A.hipoteses.find(h => h.id === 'teap')!.criterios.find(c => c.id === 'b')!.sugestao || ''));
t('lacuna acadêmica com sugestões de instrumento', A.lacunas.some(l => l.dominio === 'academico' && l.sugestoes.some(s => s.id === 'tde')));
t('auditoria acusa SATEPSI pendente', A.auditoria.some(a => !a.ok && a.texto.includes('SATEPSI')));
t('auditoria acusa ausência de referências', A.auditoria.some(a => !a.ok && a.texto.includes('referência')));

// ---- classificações de escalas de sintomas (ETDAH, MASC, ABC) ----
t('sintoma: "Superior" elevado; "Médio superior" não', lerClassificacao('Superior', 'sintoma') === 'elevado-sintoma' && lerClassificacao('Médio superior', 'sintoma') !== 'elevado-sintoma');
t('sintoma: "acima do ponto de corte" elevado; "abaixo do corte" normal', lerClassificacao('Acima do ponto de corte', 'sintoma') === 'elevado-sintoma' && lerClassificacao('Abaixo do corte', 'sintoma') === 'normal-sintoma');

// ---- índice composto não conta junto com os próprios subtestes ----
const av2: Avaliacao = JSON.parse(JSON.stringify(av));
av2.hipoteses = []; av2.instrumentos = [I('w', 'WISC-IV', 'Favorável'), I('b', 'BPA', 'Favorável'), I('e', 'EPQ-J', 'Favorável')];
av2.resultados = [
  M({ instrumentoId: 'w', medida: 'IVP', dominio: 'velocidade', composto: true, valor: 75 }),
  M({ instrumentoId: 'w', medida: 'Código', dominio: 'velocidade', metrica: 'escalar', valor: 5 }),
  M({ instrumentoId: 'w', medida: 'Procurar Símbolos', dominio: 'velocidade', metrica: 'escalar', valor: 9 }),
  M({ instrumentoId: 'b', medida: 'Atenção Concentrada', dominio: 'atencao', metrica: 'percentil', valor: 5 }),
  M({ instrumentoId: 'b', medida: 'Atenção Alternada', dominio: 'atencao', metrica: 'percentil', valor: 50 }),
  M({ instrumentoId: 'b', medida: 'Atenção Geral', dominio: 'atencao', metrica: 'percentil', composto: true, valor: 4 }),
  M({ instrumentoId: 'e', medida: 'Extroversão', dominio: 'personalidade', natureza: 'sintoma', metrica: 'percentil', valor: 97 })
];
const A2 = analisar(av2, pac, L, new Date('2026-11-14T12:00:00'));
const d2 = (id: string) => A2.dominios.find(d => d.id === id)!;
t('IVP + 1 subteste baixo = achado isolado (não 2 medidas)', d2('velocidade').status === 'achado isolado', d2('velocidade'));
t('Atenção Geral não soma com AC: achado isolado', d2('atencao').status === 'achado isolado', d2('atencao'));
t('personalidade é descritiva (sem "elevada" nem convergência)', d2('personalidade').status === 'descrição de traços' && d2('personalidade').convergencia === '—');

console.log(`${ok} ok, ${bad} falhas`);
process.exit(bad ? 1 : 0);
