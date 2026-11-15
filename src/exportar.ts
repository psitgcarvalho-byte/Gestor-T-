// Exportação do laudo em .docx (Etapa 20): capa, cabeçalho, rodapé numerado, tabelas e alertas SATEPSI em vermelho.
import type { Avaliacao, Paciente, Referencia } from './engine/types';
import type { Analise } from './engine/raciocinio';
import { textoIdade } from './engine/raciocinio';
import { NOME_TIPO, nomeDominio } from './engine/catalogo';
import type { Config } from './store';
import { SECOES } from './laudo';

const FONTE = 'Times New Roman', VERM = 'C00000';
const hoje = () => new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
const fmt = (iso: string) => { if (!iso) return '—'; const [a, m, d] = iso.split('-'); return `${d}/${m}/${a}`; };

export async function gerarDocx(av: Avaliacao, pac: Paciente | undefined, A: Analise, cfg: Config, refs: Referencia[], perfilPng: Uint8Array | null): Promise<Blob> {
  const D: any = await import('docx');
  const P = (t: string, o: any = {}) => new D.Paragraph({ alignment: o.align ?? D.AlignmentType.JUSTIFIED, indent: o.recuo === false ? undefined : { firstLine: o.recuo ?? 709 }, spacing: { line: o.line ?? 360, after: o.after ?? 120, before: o.before ?? 0 }, keepNext: o.keepNext,
    children: [new D.TextRun({ text: t, font: FONTE, size: o.size ?? 24, bold: o.bold, italics: o.italics, color: o.color })] });
  const alerta = (t: string) => new D.Paragraph({ alignment: D.AlignmentType.JUSTIFIED, spacing: { line: 300, before: 80, after: 160 }, children: [new D.TextRun({ text: t, font: FONTE, size: 22, bold: true, color: VERM })] });
  const H1 = (t: string) => new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, keepNext: true, spacing: { before: 360, after: 200 }, children: [new D.TextRun({ text: t.toUpperCase(), font: FONTE, size: 26, bold: true, color: '000000' })] });
  const H2 = (t: string) => new D.Paragraph({ heading: D.HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 240, after: 120 }, children: [new D.TextRun({ text: t, font: FONTE, size: 24, bold: true, color: '000000' })] });
  const cel = (t: string, o: any = {}) => new D.TableCell({ shading: o.head ? { fill: 'E7E3D8' } : undefined, margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new D.Paragraph({ children: [new D.TextRun({ text: t ?? '', font: FONTE, size: 20, bold: o.head || o.bold, color: o.color })] })] });
  const tabela = (cab: string[], linhas: (string | { t: string; color?: string })[][]) => new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE },
    rows: [new D.TableRow({ tableHeader: true, children: cab.map(c => cel(c, { head: true })) }), ...linhas.map(l => new D.TableRow({ children: l.map(x => typeof x === 'string' ? cel(x) : cel(x.t, { color: x.color, bold: !!x.color })) }))] });
  const titTab = (t: string) => P(t, { recuo: false, size: 20, italics: true, after: 60, keepNext: true });
  const texto = (s: string) => String(s || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const h = l.match(/^#{1,6}\s+(.*)$/); if (h) return H2(h[1]);
    const li = l.match(/^[-•*]\s+(.*)$/); if (li) return new D.Paragraph({ indent: { left: 567, hanging: 283 }, spacing: { line: 360, after: 60 }, children: [new D.TextRun({ text: '• ' + li[1], font: FONTE, size: 24 })] });
    return P(l.replace(/\*\*/g, ''));
  });

  const nome = pac?.nome || 'Paciente';
  const corpo: any[] = [];
  // Capa
  corpo.push(P('AVALIAÇÃO NEUROPSICOLÓGICA', { align: D.AlignmentType.CENTER, recuo: false, size: 36, bold: true, before: 3200, after: 600 }));
  corpo.push(P(nome, { align: D.AlignmentType.CENTER, recuo: false, size: 28, after: 1800 }));
  corpo.push(P(cfg.profissional || '[Profissional responsável]', { align: D.AlignmentType.CENTER, recuo: false, size: 24, after: 60 }));
  corpo.push(P([cfg.titulo, cfg.crp ? 'CRP ' + cfg.crp : ''].filter(Boolean).join(' — '), { align: D.AlignmentType.CENTER, recuo: false, size: 22, after: 1400 }));
  corpo.push(P([cfg.cidade, hoje()].filter(Boolean).join(', '), { align: D.AlignmentType.CENTER, recuo: false, size: 22 }));
  corpo.push(new D.Paragraph({ children: [new D.PageBreak()] }));

  let n = 0;
  for (const s of SECOES) {
    if (s.id === 'assinatura') continue;
    n++;
    corpo.push(H1(`${n}. ${s.titulo}`));
    if (s.id === 'identificacao') {
      const linhas: [string, string][] = [['Nome', nome], ['Data de nascimento', fmt(pac?.nascimento || '')], ['Idade', textoIdade(A.idade)], ['Sexo', pac?.sexo || '—'], ['Escolaridade', pac?.escolaridade || '—'],
        ['Lateralidade', pac?.lateralidade || '—'], ['Responsáveis', pac?.responsaveis || '—'], ['Solicitante', av.demanda.solicitante || '—'], ['Período da avaliação', av.demanda.periodo || '—'],
        ['Profissional responsável', [cfg.profissional, cfg.crp ? 'CRP ' + cfg.crp : ''].filter(Boolean).join(' — ') || '—']];
      corpo.push(new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE }, rows: linhas.map(([a, b]) => new D.TableRow({ children: [cel(a, { bold: true }), cel(b)] })) }));
      continue;
    }
    if (s.id === 'instrumentos') {
      corpo.push(titTab('Tabela 1 — Verificação dos instrumentos no SATEPSI'));
      corpo.push(tabela(['Instrumento e versão', 'Tipo', 'Situação no SATEPSI', 'Data da consulta', 'Faixa normativa', 'Compatível com o caso'],
        A.instrumentos.map(x => [`${x.inst.nome}${x.inst.versao ? ' — ' + x.inst.versao : ''}`, NOME_TIPO[x.inst.tipo], { t: x.inst.satepsi.status, color: x.utilizavel ? undefined : VERM }, fmt(x.inst.satepsi.data), x.inst.satepsi.faixaNormativa || '—',
          x.inst.satepsi.compativel === 'sim' ? 'Sim' : x.inst.satepsi.compativel === 'nao' ? { t: 'Não', color: VERM } : '—'])));
      A.instrumentos.forEach(x => { if (x.alerta) corpo.push(alerta(x.alerta)); if (x.nota) corpo.push(P(x.nota, { size: 22, italics: true, recuo: false })); });
      continue;
    }
    if (s.id === 'resultados') {
      let k = 1;
      A.instrumentos.forEach(x => {
        const ms = A.medidas.filter(m => m.inst?.id === x.inst.id && m.motivoExclusao !== 'sem dado');
        if (!ms.length) return;
        k++;
        corpo.push(titTab(`Tabela ${k} — ${x.inst.nome}`));
        corpo.push(tabela(['Medida / subteste', 'Domínio', 'Escore bruto', 'Escore padronizado', 'Percentil', 'Classificação do examinador'],
          ms.map(m => [m.m.medida, nomeDominio(m.m.dominio), m.m.bruto || '—', m.m.valor !== null && m.m.metrica !== 'percentil' ? String(m.m.valor) : '—',
            m.m.percentil !== null ? String(m.m.percentil) : m.m.metrica === 'percentil' && m.m.valor !== null ? String(m.m.valor) : '—', m.m.classificacaoExaminador || '—'])));
        if (!x.utilizavel) corpo.push(alerta('Resultados apresentados apenas como informação documental: o instrumento não pode fundamentar hipóteses ou conclusões (ver Observação SATEPSI).'));
      });
      if (perfilPng) {
        corpo.push(titTab(`Figura 1 — Perfil por domínio (equivalência interna em desvios-padrão, apenas para comparação; não substitui as tabelas normativas)`));
        corpo.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.ImageRun({ type: 'png', data: perfilPng, transformation: { width: 560, height: 320 } })] }));
      }
      corpo.push(...texto(av.laudo.secoes[s.id] || ''));
      continue;
    }
    if (s.id === 'referencias') {
      const sel = refs.filter(r => av.referenciasIds.includes(r.id)).sort((a, b) => a.abnt.localeCompare(b.abnt, 'pt-BR'));
      if (!sel.length) corpo.push(P('Nenhuma referência selecionada.', { color: VERM, recuo: false }));
      sel.forEach(r => corpo.push(P(r.abnt, { align: D.AlignmentType.LEFT, recuo: false, line: 240, after: 200 })));
      continue;
    }
    const t = av.laudo.secoes[s.id] || '';
    corpo.push(...(t ? texto(t) : [P('[Seção ainda não redigida]', { color: VERM, recuo: false })]));
    if (s.id === 'limitacoes') A.instrumentos.forEach(x => { if (x.alerta) corpo.push(alerta(x.alerta)); });
  }
  // Assinatura
  corpo.push(P([cfg.cidade, hoje()].filter(Boolean).join(', '), { align: D.AlignmentType.RIGHT, recuo: false, before: 600, after: 900 }));
  corpo.push(P('_______________________________________________', { align: D.AlignmentType.CENTER, recuo: false, after: 0 }));
  corpo.push(P(cfg.profissional || '[Profissional responsável]', { align: D.AlignmentType.CENTER, recuo: false, after: 0, bold: true }));
  corpo.push(P([cfg.titulo, cfg.crp ? 'CRP ' + cfg.crp : ''].filter(Boolean).join(' — '), { align: D.AlignmentType.CENTER, recuo: false }));

  const run = (t: string) => new D.TextRun({ text: t, font: FONTE, size: 18, color: '5A5A4D' });
  const doc = new D.Document({
    creator: cfg.profissional || 'T-Gestor', title: 'Avaliação Neuropsicológica',
    sections: [{
      properties: { page: { margin: { top: 1701, left: 1701, bottom: 1134, right: 1134 } }, titlePage: true },
      headers: { default: new D.Header({ children: [new D.Paragraph({ alignment: D.AlignmentType.RIGHT, children: [run(`Avaliação Neuropsicológica${cfg.profissional ? ' — ' + cfg.profissional : ''}`)] })] }) },
      footers: { default: new D.Footer({ children: [new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [run('Documento confidencial · Página '), new D.TextRun({ children: [D.PageNumber.CURRENT], font: FONTE, size: 18, color: '5A5A4D' })] })] }) },
      children: corpo
    }]
  });
  return D.Packer.toBlob(doc);
}
