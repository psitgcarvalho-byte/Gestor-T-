import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Avaliacao, Paciente, Instrumento, Medida, StatusSatepsi, StatusCriterio, Grau } from './engine/types';
import { analisar, textoIdade, idade, type Analise } from './engine/raciocinio';
import { DOMINIOS, CATALOGO, NOME_TIPO, nomeDominio } from './engine/catalogo';
import { METRICAS, NOME_NIVEL } from './engine/scores';
import { HIPOTESES, FONTES, NOME_STATUS } from './engine/hipoteses';
import { type Banco, type Config, carregar, salvar, uid, agora, novaAvaliacao, normalizar, baixar, slug } from './store';
import { PROVIDERS, detectarProvider, chamarIA, listarModelos, extrairJSON } from './ai';
import { lerTexto, paraAnexo } from './files';
import { SECOES, sistema, dadosParaIA, pedidoSecao, tratamento, anonimizar, proporcaoCitacoes } from './laudo';
import { perfilSVG, svgParaPng } from './perfil';

// ---------- utilitários de interface ----------
type Mut = (fn: (b: Banco) => void) => void;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
let toastFn: (m: string) => void = () => {};
export const toast = (m: string) => toastFn(m);

function Campo(p: { rotulo: string; valor: string; onChange: (v: string) => void; tipo?: string; dica?: string; ph?: string; id?: string }) {
  return <label className="campo"><span>{p.rotulo}</span><input id={p.id} type={p.tipo || 'text'} value={p.valor ?? ''} placeholder={p.ph} onChange={e => p.onChange(e.target.value)} />{p.dica && <small>{p.dica}</small>}</label>;
}
function Area(p: { rotulo: string; valor: string; onChange: (v: string) => void; linhas?: number; ph?: string; id?: string }) {
  return <label className="campo"><span>{p.rotulo}</span><textarea id={p.id} rows={p.linhas || 4} value={p.valor ?? ''} placeholder={p.ph} onChange={e => p.onChange(e.target.value)} /></label>;
}
function Sel(p: { rotulo?: string; valor: string; onChange: (v: string) => void; opcoes: [string, string][]; id?: string }) {
  const s = <select id={p.id} value={p.valor} onChange={e => p.onChange(e.target.value)}>{p.opcoes.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>;
  return p.rotulo ? <label className="campo"><span>{p.rotulo}</span>{s}</label> : s;
}
const Selo = ({ tom, children }: { tom: string; children: React.ReactNode }) => <span className={'selo ' + tom}>{children}</span>;
const tomNivel = (n: string) => (n === 'comprometido' || n === 'rebaixado' ? 'mau' : n === 'limite' ? 'atencao' : n === 'alto' ? 'bom' : n === 'medio' ? 'neutro' : 'apagado');
const tomStatus = (s: string) => (/comprometimento|elevada/.test(s) ? 'mau' : /isolado|limítrofe/.test(s) ? 'atencao' : /preservado|sem elevação/.test(s) ? 'bom' : 'apagado');
const tomGrau = (g: string) => (g.startsWith('Forte') ? 'mau' : g.startsWith('Moder') ? 'atencao' : g.startsWith('Parcial') ? 'neutro' : 'apagado');
const hojeISO = () => new Date().toISOString().slice(0, 10);

// ---------- aplicativo ----------
export default function App() {
  const [banco, setBanco] = useState<Banco | null>(null);
  const [tela, setTela] = useState<'pacientes' | 'avaliacao' | 'biblioteca' | 'config'>('pacientes');
  const [avId, setAvId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const timer = useRef<any>(null);
  toastFn = (m: string) => { setMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(''), 4000); };

  useEffect(() => { carregar().then(setBanco).catch(() => { setBanco(normalizar({})); toast('Não foi possível abrir o armazenamento local deste navegador.'); }); }, []);
  const salvarTimer = useRef<any>(null);
  useEffect(() => { if (!banco) return; clearTimeout(salvarTimer.current); salvarTimer.current = setTimeout(() => salvar(banco).catch(() => toast('Falha ao salvar no navegador.')), 400); }, [banco]);

  if (!banco) return <div className="carregando">Carregando…</div>;
  const mut: Mut = fn => setBanco(prev => { const b = clone(prev as Banco); fn(b); return b; });
  const av = banco.avaliacoes.find(a => a.id === avId) || null;
  const abrir = (id: string) => { setAvId(id); setTela('avaliacao'); window.scrollTo(0, 0); };

  return <>
    <header className="topo">
      <div className="marca">T<span>-</span>Gestor</div>
      <nav>
        <button className={tela === 'pacientes' ? 'on' : ''} onClick={() => setTela('pacientes')}>Pacientes</button>
        {av && <button className={tela === 'avaliacao' ? 'on' : ''} onClick={() => setTela('avaliacao')}>Avaliação</button>}
        <button className={tela === 'biblioteca' ? 'on' : ''} onClick={() => setTela('biblioteca')}>Referências</button>
        <button id="nav-config" className={tela === 'config' ? 'on' : ''} onClick={() => setTela('config')}>Configurações</button>
      </nav>
    </header>
    <main>
      {tela === 'pacientes' && <Pacientes banco={banco} mut={mut} abrir={abrir} setBanco={setBanco} />}
      {tela === 'avaliacao' && av && <AvaliacaoTela banco={banco} av={av} mut={mut} />}
      {tela === 'biblioteca' && <Biblioteca banco={banco} mut={mut} />}
      {tela === 'config' && <Configuracoes banco={banco} mut={mut} />}
    </main>
    <div className={'toast' + (msg ? ' on' : '')} role="status">{msg}</div>
  </>;
}

// ---------- pacientes ----------
function pacienteVazio(): Paciente { return { id: uid(), nome: '', nascimento: '', sexo: '', escolaridade: '', lateralidade: '', responsaveis: '', contato: '', criadoEm: agora() }; }

function Pacientes({ banco, mut, abrir, setBanco }: { banco: Banco; mut: Mut; abrir: (id: string) => void; setBanco: (b: Banco) => void }) {
  const [busca, setBusca] = useState('');
  const [edit, setEdit] = useState<Paciente | null>(null);
  const lista = banco.pacientes.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase())).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const salvarPac = () => {
    if (!edit || !edit.nome.trim()) return toast('Informe o nome.');
    mut(b => { const i = b.pacientes.findIndex(p => p.id === edit.id); if (i >= 0) b.pacientes[i] = edit; else b.pacientes.push(edit); });
    setEdit(null); toast('Paciente salvo');
  };
  const novaAv = (pid: string) => { const a = novaAvaliacao(pid); mut(b => { b.avaliacoes.push(a); }); setTimeout(() => abrir(a.id), 0); };
  const exportar = () => baixar(`t-gestor-backup-${hojeISO()}.json`, new Blob([JSON.stringify(banco)], { type: 'application/json' }));
  const importar = async (f?: File) => {
    if (!f) return;
    try { const j = JSON.parse(await f.text()); if (!j || !Array.isArray(j.pacientes)) throw 0; if (!confirm('Importar este backup substituirá os dados atuais deste navegador. Continuar?')) return; setBanco(normalizar(j)); toast('Backup importado'); }
    catch { toast('Arquivo de backup inválido.'); }
  };
  return <section>
    <div className="cabecalho">
      <h1>Pacientes</h1>
      <div className="acoes"><button className="b primario" id="novo-paciente" onClick={() => setEdit(pacienteVazio())}>+ Novo paciente</button></div>
    </div>
    {!banco.config.ia.keys[banco.config.ia.provider] && <div className="aviso">Para gerar o laudo com IA, cole uma chave de IA em <b>Configurações</b>. Todo o resto funciona sem chave.</div>}
    {edit && <div className="cartao destaque">
      <h2>{banco.pacientes.some(p => p.id === edit.id) ? 'Editar paciente' : 'Novo paciente'}</h2>
      <div className="grade">
        <Campo id="p-nome" rotulo="Nome completo" valor={edit.nome} onChange={v => setEdit({ ...edit, nome: v })} />
        <Campo id="p-nasc" rotulo="Data de nascimento" tipo="date" valor={edit.nascimento} onChange={v => setEdit({ ...edit, nascimento: v })} />
        <Sel rotulo="Sexo" valor={edit.sexo} onChange={v => setEdit({ ...edit, sexo: v })} opcoes={[['', '—'], ['Feminino', 'Feminino'], ['Masculino', 'Masculino'], ['Outro', 'Outro']]} />
        <Campo id="p-esc" rotulo="Escolaridade" valor={edit.escolaridade} onChange={v => setEdit({ ...edit, escolaridade: v })} ph="ex.: 4º ano do Ensino Fundamental" />
        <Sel rotulo="Lateralidade" valor={edit.lateralidade} onChange={v => setEdit({ ...edit, lateralidade: v })} opcoes={[['', '—'], ['Destro', 'Destro'], ['Canhoto', 'Canhoto'], ['Ambidestro', 'Ambidestro']]} />
        <Campo rotulo="Responsáveis" valor={edit.responsaveis} onChange={v => setEdit({ ...edit, responsaveis: v })} />
        <Campo rotulo="Contato" valor={edit.contato} onChange={v => setEdit({ ...edit, contato: v })} />
      </div>
      <button className="b primario" id="salvar-paciente" onClick={salvarPac}>Salvar</button><button className="b" onClick={() => setEdit(null)}>Cancelar</button>
    </div>}
    <input className="busca" placeholder="Buscar paciente…" value={busca} onChange={e => setBusca(e.target.value)} />
    {!lista.length && <p className="mudo">Nenhum paciente ainda. Os dados ficam salvos somente neste navegador; use o backup para levá-los a outro computador.</p>}
    {lista.map(p => {
      const avs = banco.avaliacoes.filter(a => a.pacienteId === p.id);
      return <div className="cartao" key={p.id}>
        <div className="linha-entre"><div><b className="nome-pac">{p.nome}</b><div className="mudo">{textoIdade(idade(p.nascimento))} · {p.escolaridade || 'escolaridade não informada'}</div></div>
          <div><button className="b" onClick={() => setEdit(clone(p))}>Editar</button><button className="b primario" onClick={() => novaAv(p.id)}>+ Avaliação</button></div></div>
        {avs.map(a => <div className="sub" key={a.id}><span>{a.titulo} · atualizada em {new Date(a.atualizadoEm).toLocaleDateString('pt-BR')}</span>
          <span><button className="b" onClick={() => abrir(a.id)}>Abrir</button><button className="b fraco" onClick={() => { if (confirm('Excluir esta avaliação?')) mut(b => { b.avaliacoes = b.avaliacoes.filter(x => x.id !== a.id); }); }}>Excluir</button></span></div>)}
        <button className="b fraco" onClick={() => { if (confirm(`Excluir ${p.nome} e todas as suas avaliações?`)) mut(b => { b.pacientes = b.pacientes.filter(x => x.id !== p.id); b.avaliacoes = b.avaliacoes.filter(x => x.pacienteId !== p.id); }); }}>Excluir paciente</button>
      </div>;
    })}
    <div className="cartao"><h2>Backup</h2><p className="mudo">Os dados ficam só neste navegador. Exporte um backup regularmente e guarde-o em local seguro (contém dados sensíveis de saúde).</p>
      <button className="b" onClick={exportar}>Exportar backup (.json)</button>
      <label className="b">Importar backup<input type="file" accept=".json,application/json" hidden onChange={e => importar(e.target.files?.[0])} /></label></div>
  </section>;
}

// ---------- avaliação em etapas ----------
const ETAPAS = ['Demanda', 'História', 'Observação', 'Instrumentos e SATEPSI', 'Resultados', 'Raciocínio', 'Hipóteses', 'Laudo'];

function AvaliacaoTela({ banco, av, mut }: { banco: Banco; av: Avaliacao; mut: Mut }) {
  const [etapa, setEtapa] = useState(0);
  const pac = banco.pacientes.find(p => p.id === av.pacienteId);
  const A = useMemo(() => analisar(av, pac, banco.config.limiares), [av, pac, banco.config.limiares]);
  const up = (fn: (a: Avaliacao) => void) => mut(b => { const a = b.avaliacoes.find(x => x.id === av.id) as Avaliacao; fn(a); a.atualizadoEm = agora(); });
  const feito = [
    !!av.demanda.motivo.trim(), Object.entries(av.historia).some(([k, v]) => k !== 'anamneseBruta' && String(v).trim()) || !!av.historia.anamneseBruta.trim(),
    !!av.observacao.validade.esforco, av.instrumentos.length > 0 && av.instrumentos.every(i => i.satepsi.status !== 'Não verificado'),
    av.resultados.length > 0, A.consistencia.filter(p => p.nivel === 'erro').length === 0 && av.resultados.length > 0, av.hipoteses.length > 0, Object.keys(av.laudo.secoes).length > 0
  ];
  return <section className="avaliacao">
    <aside>
      <div className="pac-resumo"><b>{pac?.nome}</b><span>{textoIdade(A.idade)}</span><span>{pac?.escolaridade}</span></div>
      <ol>{ETAPAS.map((e, i) => <li key={e}><button id={'etapa-' + i} className={etapa === i ? 'on' : ''} onClick={() => { setEtapa(i); window.scrollTo(0, 0); }}><i className={feito[i] ? 'ok' : ''}>{feito[i] ? '✓' : i + 1}</i>{e}</button></li>)}</ol>
      <p className="mudo pequeno">Tudo é salvo automaticamente neste navegador.</p>
    </aside>
    <div className="painel">
      {etapa === 0 && <EtDemanda av={av} up={up} />}
      {etapa === 1 && <EtHistoria av={av} up={up} banco={banco} pac={pac} />}
      {etapa === 2 && <EtObservacao av={av} up={up} />}
      {etapa === 3 && <EtInstrumentos av={av} up={up} A={A} />}
      {etapa === 4 && <EtResultados av={av} up={up} A={A} banco={banco} />}
      {etapa === 5 && <EtRaciocinio A={A} av={av} up={up} />}
      {etapa === 6 && <EtHipoteses av={av} up={up} A={A} />}
      {etapa === 7 && <EtLaudo av={av} up={up} A={A} banco={banco} pac={pac} mut={mut} />}
      <div className="navegacao">{etapa > 0 && <button className="b" onClick={() => { setEtapa(etapa - 1); window.scrollTo(0, 0); }}>← {ETAPAS[etapa - 1]}</button>}
        {etapa < ETAPAS.length - 1 && <button className="b primario" id="proxima" onClick={() => { setEtapa(etapa + 1); window.scrollTo(0, 0); }}>{ETAPAS[etapa + 1]} →</button>}</div>
    </div>
  </section>;
}
type Up = (fn: (a: Avaliacao) => void) => void;

function EtDemanda({ av, up }: { av: Avaliacao; up: Up }) {
  const d = av.demanda;
  return <>
    <h1>1. Demanda</h1>
    <div className="grade">
      <Campo rotulo="Solicitante / encaminhamento" valor={d.solicitante} onChange={v => up(a => { a.demanda.solicitante = v; })} />
      <Campo rotulo="Período da avaliação" valor={d.periodo} onChange={v => up(a => { a.demanda.periodo = v; })} ph="ex.: setembro a outubro de 2026" />
    </div>
    <Area id="d-motivo" rotulo="Motivo do encaminhamento" valor={d.motivo} onChange={v => up(a => { a.demanda.motivo = v; })} linhas={3} />
    <Area rotulo="Objetivo da avaliação" valor={d.objetivo} onChange={v => up(a => { a.demanda.objetivo = v; })} linhas={2} />
    <h3>Queixas por domínio</h3>
    <p className="mudo">Marque os domínios em que há queixa. O app cruza cada queixa com os testes para mostrar convergências, divergências e lacunas (Etapa 10).</p>
    <div className="chips">{DOMINIOS.map(dm => <label key={dm.id} className={'chip' + (d.queixas.includes(dm.id) ? ' on' : '')} title={dm.queixa}>
      <input type="checkbox" checked={d.queixas.includes(dm.id)} onChange={e => up(a => { a.demanda.queixas = e.target.checked ? [...a.demanda.queixas, dm.id] : a.demanda.queixas.filter(x => x !== dm.id); })} />{dm.nome}</label>)}</div>
    <Area rotulo="Detalhes das queixas" valor={d.queixaTexto} onChange={v => up(a => { a.demanda.queixaTexto = v; })} linhas={3} />
  </>;
}

const CAMPOS_HIST: [keyof Avaliacao['historia'], string][] = [['desenvolvimento', 'Desenvolvimento (gestação, parto, marcos motores e de linguagem, autonomia)'], ['medico', 'Histórico médico e neurológico (doenças, internações, sono, alimentação, sentidos)'], ['medicacao', 'Medicação em uso (nome, dose, desde quando)'],
  ['familiar', 'Histórico familiar'], ['escolar', 'Histórico escolar / acadêmico / profissional'], ['atencaoExecutivo', 'Funcionamento atencional e executivo no cotidiano'], ['emocional', 'Funcionamento emocional'], ['social', 'Funcionamento social'], ['adaptativo', 'Funcionamento adaptativo (autonomia, rotina, autocuidado)'], ['linhaTempo', 'Linha do tempo clínica (início, persistência, contextos, prejuízos)']];

function EtHistoria({ av, up, banco, pac }: { av: Avaliacao; up: Up; banco: Banco; pac?: Paciente }) {
  const [ocupado, setOcupado] = useState(false);
  const importar = async (f?: File) => { if (!f) return; try { const t = await lerTexto(f); up(a => { a.historia.anamneseBruta = (a.historia.anamneseBruta ? a.historia.anamneseBruta + '\n\n' : '') + t; }); toast(`${f.name}: texto importado`); } catch (e: any) { toast(e.message); } };
  const organizar = async () => {
    if (!av.historia.anamneseBruta.trim()) return toast('Cole ou importe a anamnese primeiro.');
    setOcupado(true);
    try {
      const trat = tratamento(pac);
      const out = await chamarIA(banco.config.ia, { json: true, maxTokens: 6000,
        system: `Você organiza anamneses de avaliação neuropsicológica. Responda SOMENTE com um objeto JSON com as chaves: ${CAMPOS_HIST.map(c => c[0]).join(', ')}, motivo, queixas. Cada chave de texto recebe o que o texto original diz sobre o tema, de forma fiel e resumida em terceira pessoa, referindo-se ao avaliado como "${trat}"; use "" quando o texto não tratar do tema. Não invente nada. "queixas" é uma lista com ids dentre: ${DOMINIOS.map(d => d.id).join(', ')}, apenas para queixas explícitas.`,
        messages: [{ role: 'user', content: anonimizar(av.historia.anamneseBruta, pac, trat).slice(0, 60000) }] });
      const j = extrairJSON(out); let n = 0;
      up(a => {
        CAMPOS_HIST.forEach(([k]) => { if (typeof j[k] === 'string' && j[k].trim() && !a.historia[k].trim()) { a.historia[k] = j[k].trim(); n++; } });
        if (typeof j.motivo === 'string' && j.motivo.trim() && !a.demanda.motivo.trim()) { a.demanda.motivo = j.motivo.trim(); n++; }
        if (Array.isArray(j.queixas)) a.demanda.queixas = Array.from(new Set([...a.demanda.queixas, ...j.queixas.filter((q: string) => DOMINIOS.some(d => d.id === q))]));
      });
      toast(`${n} campo(s) preenchido(s). Revise antes de seguir (campos já preenchidos não foram alterados).`);
    } catch (e: any) { toast(e.message); }
    setOcupado(false);
  };
  return <>
    <h1>2. História clínica e anamnese</h1>
    <div className="cartao">
      <Area id="h-bruta" rotulo="Anamnese (cole aqui o texto da entrevista ou da transcrição)" valor={av.historia.anamneseBruta} onChange={v => up(a => { a.historia.anamneseBruta = v; })} linhas={8} />
      <label className="b">Importar arquivo (.docx, .pdf, .txt)<input type="file" accept=".docx,.pdf,.txt,.md" hidden onChange={e => importar(e.target.files?.[0])} /></label>
      <button className="b primario" id="organizar" disabled={ocupado} onClick={organizar}>{ocupado ? 'Organizando…' : 'Organizar nos campos com IA'}</button>
      <p className="mudo pequeno">A IA recebe o texto sem o nome do paciente, sem familiares com o mesmo sobrenome, sem os nomes cadastrados em “Responsáveis” e sem telefone, e-mail ou CPF. Outros nomes próprios (irmãos, professores) não são reconhecidos: confira na prévia. A IA preenche apenas os campos vazios; revise tudo.</p>
      {av.historia.anamneseBruta.trim() && <details><summary>Prévia do texto que será enviado à IA</summary><p className="previa">{anonimizar(av.historia.anamneseBruta, pac, tratamento(pac)).slice(0, 4000)}</p></details>}
    </div>
    {CAMPOS_HIST.map(([k, r]) => <Area key={k} rotulo={r} valor={av.historia[k]} onChange={v => up(a => { a.historia[k] = v; })} linhas={k === 'linhaTempo' ? 4 : 3} />)}
    <Area rotulo="Informantes (quem forneceu informações e em quais contextos)" valor={av.informantes} onChange={v => up(a => { a.informantes = v; })} linhas={2} />
  </>;
}

const FATORES = ['fadiga', 'ansiedade de desempenho', 'baixa motivação', 'alteração sensorial não corrigida', 'medicação no dia da testagem', 'sono insuficiente', 'dor ou desconforto', 'dificuldade de compreensão da língua', 'ambiente inadequado'];
function EtObservacao({ av, up }: { av: Avaliacao; up: Up }) {
  const v = av.observacao.validade;
  return <>
    <h1>3. Observação comportamental e validade</h1>
    <Area rotulo="Comportamento durante as sessões (apresentação, contato, compreensão das instruções, colaboração, persistência, estratégias…)" valor={av.observacao.texto} onChange={x => up(a => { a.observacao.texto = x; })} linhas={6} />
    <div className="cartao">
      <h3>Validade do desempenho</h3>
      <Sel id="o-esforco" rotulo="Esforço e engajamento nas tarefas" valor={v.esforco} onChange={x => up(a => { a.observacao.validade.esforco = x as any; })} opcoes={[['', '— registrar —'], ['adequado', 'Adequado'], ['duvidoso', 'Duvidoso'], ['insuficiente', 'Insuficiente']]} />
      <p className="mudo">Fatores que podem ter interferido:</p>
      <div className="chips">{FATORES.map(f => <label key={f} className={'chip' + (v.fatores.includes(f) ? ' on' : '')}><input type="checkbox" checked={v.fatores.includes(f)} onChange={e => up(a => { const s = a.observacao.validade; s.fatores = e.target.checked ? [...s.fatores, f] : s.fatores.filter(x => x !== f); })} />{f}</label>)}</div>
      <Area rotulo="Observações sobre a validade" valor={v.obs} onChange={x => up(a => { a.observacao.validade.obs = x; })} linhas={2} />
    </div>
  </>;
}

const STATUS_S: StatusSatepsi[] = ['Não verificado', 'Favorável', 'Desfavorável', 'Não avaliado', 'Em avaliação', 'Não localizado', 'Não privativo'];
function EtInstrumentos({ av, up, A }: { av: Avaliacao; up: Up; A: Analise }) {
  const [cat, setCat] = useState(CATALOGO[0].id);
  const adicionar = (catId: string | null) => up(a => {
    const c = CATALOGO.find(x => x.id === catId);
    const i: Instrumento = { id: uid(), catalogoId: c?.id, nome: c?.nome || 'Novo instrumento', versao: '', tipo: c?.tipo || 'teste', dominios: c?.dominios || [],
      satepsi: { status: 'Não verificado', data: '', faixaNormativa: '', compativel: '', incompatibilidade: '' } };
    a.instrumentos.push(i);
    (c?.medidas || []).forEach(m => a.resultados.push({ id: uid(), instrumentoId: i.id, medida: m.nome, dominio: m.dominio, natureza: (m.natureza || 'desempenho') as any, composto: !!m.composto, metrica: (m.metrica || 'percentil') as any, valor: null, percentil: null, bruto: '', classificacaoExaminador: '', obs: '' }));
  });
  const ups = (id: string, fn: (i: Instrumento) => void) => up(a => { fn(a.instrumentos.find(x => x.id === id) as Instrumento); });
  return <>
    <h1>4. Instrumentos e verificação no SATEPSI</h1>
    <div className="aviso">Pelo seu protocolo (§2.4), a situação de cada teste deve ser consultada no SATEPSI <b>a cada avaliação</b>, com data. O app não traz status prontos: instrumentos “Não verificado”, desfavoráveis ou incompatíveis ficam fora da integração e geram o alerta em vermelho no laudo. <a href="https://satepsi.cfp.org.br/" target="_blank" rel="noopener">Abrir o SATEPSI ↗</a></div>
    <div className="linha"><Sel id="cat-sel" valor={cat} onChange={setCat} opcoes={CATALOGO.map(c => [c.id, c.nome])} /><button className="b primario" id="add-inst" onClick={() => adicionar(cat)}>Adicionar</button><button className="b" onClick={() => adicionar(null)}>Adicionar outro instrumento</button></div>
    <p className="mudo pequeno">Instrumentos do catálogo já trazem as medidas mais comuns para preencher na etapa de resultados.</p>
    {av.instrumentos.map(i => {
      const uso = A.instrumentos.find(x => x.inst.id === i.id);
      return <div className={'cartao' + (uso && !uso.utilizavel ? ' alerta' : '')} key={i.id}>
        <div className="grade">
          <Campo rotulo="Instrumento" valor={i.nome} onChange={v => ups(i.id, x => { x.nome = v; })} />
          <Campo rotulo="Versão / edição exata" valor={i.versao} onChange={v => ups(i.id, x => { x.versao = v; })} ph="ex.: 4ª edição, 2013" />
          <Sel rotulo="Tipo" valor={i.tipo} onChange={v => ups(i.id, x => { x.tipo = v as any; })} opcoes={Object.entries(NOME_TIPO) as [string, string][]} />
          <Sel rotulo="Situação no SATEPSI" valor={i.satepsi.status} onChange={v => ups(i.id, x => { x.satepsi.status = v as StatusSatepsi; if (!x.satepsi.data && v !== 'Não verificado') x.satepsi.data = hojeISO(); })} opcoes={STATUS_S.map(s => [s, s])} />
          <Campo rotulo="Data da consulta" tipo="date" valor={i.satepsi.data} onChange={v => ups(i.id, x => { x.satepsi.data = v; })} />
          <Campo rotulo="Faixa normativa / público-alvo" valor={i.satepsi.faixaNormativa} onChange={v => ups(i.id, x => { x.satepsi.faixaNormativa = v; })} />
          <Sel rotulo="Compatível com este caso (idade, versão, modalidade, normas, prazos)?" valor={i.satepsi.compativel} onChange={v => ups(i.id, x => { x.satepsi.compativel = v as any; })} opcoes={[['', '—'], ['sim', 'Sim'], ['nao', 'Não']]} />
          {i.satepsi.compativel === 'nao' && <Campo rotulo="Incompatibilidade" valor={i.satepsi.incompatibilidade} onChange={v => ups(i.id, x => { x.satepsi.incompatibilidade = v; })} />}
        </div>
        {uso?.alerta && <p className="texto-alerta">{uso.alerta}</p>}
        {uso?.nota && <p className="mudo pequeno">{uso.nota}</p>}
        <button className="b fraco" onClick={() => { if (confirm(`Remover ${i.nome} e seus resultados?`)) up(a => { a.instrumentos = a.instrumentos.filter(x => x.id !== i.id); a.resultados = a.resultados.filter(r => r.instrumentoId !== i.id); }); }}>Remover</button>
      </div>;
    })}
  </>;
}

function EtResultados({ av, up, A, banco }: { av: Avaliacao; up: Up; A: Analise; banco: Banco }) {
  const [extraidos, setExtraidos] = useState<any[] | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const upm = (id: string, fn: (m: Medida) => void) => up(a => { fn(a.resultados.find(x => x.id === id) as Medida); });
  const nova = (instId: string) => up(a => { const inst = a.instrumentos.find(i => i.id === instId); a.resultados.push({ id: uid(), instrumentoId: instId, medida: '', dominio: inst?.dominios[0] || 'atencao', natureza: 'desempenho', composto: false, metrica: 'percentil', valor: null, percentil: null, bruto: '', classificacaoExaminador: '', obs: '' }); });
  const nOuNull = (v: string) => (v.trim() === '' || isNaN(Number(v.replace(',', '.'))) ? null : Number(v.replace(',', '.')));
  const extrair = async (fs: FileList | null) => {
    if (!fs || !fs.length) return;
    setOcupado(true);
    try {
      const anexos = await Promise.all(Array.from(fs).map(paraAnexo));
      const out = await chamarIA(banco.config.ia, { json: true, maxTokens: 8000, anexos,
        system: 'Você transcreve resultados de protocolos e folhas de resposta de testes neuropsicológicos. Responda SOMENTE com um array JSON. Cada item: {"instrumento": "", "medida": "", "escoreBruto": "", "escorePadronizado": null, "tipoEscore": "qi|escalar|t|z|percentil|", "percentil": null, "classificacao": ""}. Transcreva apenas o que estiver escrito; não calcule, não converta e não deduza valores ausentes (use null ou "").',
        messages: [{ role: 'user', content: 'Transcreva todos os resultados presentes nestes arquivos.' }] });
      const j = extrairJSON(out);
      setExtraidos((Array.isArray(j) ? j : j.resultados || []).map((r: any) => ({ ...r, usar: true })));
    } catch (e: any) { toast(e.message); }
    setOcupado(false);
  };
  const aplicar = () => {
    up(a => {
      (extraidos || []).filter(r => r.usar).forEach(r => {
        const nome = String(r.instrumento || 'Instrumento');
        let inst = a.instrumentos.find(i => i.nome.toLowerCase().includes(nome.toLowerCase().slice(0, 6)) || nome.toLowerCase().includes(i.nome.toLowerCase().split(' ')[0]));
        if (!inst) { inst = { id: uid(), nome, versao: '', tipo: 'teste', dominios: [], satepsi: { status: 'Não verificado', data: '', faixaNormativa: '', compativel: '', incompatibilidade: '' } }; a.instrumentos.push(inst); }
        const tipo = ['qi', 'escalar', 't', 'z', 'percentil'].includes(r.tipoEscore) ? r.tipoEscore : r.escorePadronizado != null ? 'qi' : r.percentil != null ? 'percentil' : r.classificacao ? 'classificacao' : 'bruto';
        a.resultados.push({ id: uid(), instrumentoId: inst.id, medida: String(r.medida || ''), dominio: inst.dominios[0] || 'atencao', natureza: 'desempenho', composto: false, metrica: tipo,
          valor: tipo === 'percentil' ? (r.percentil ?? null) : (r.escorePadronizado ?? null), percentil: tipo === 'percentil' ? null : (r.percentil ?? null), bruto: r.escoreBruto != null ? String(r.escoreBruto) : '', classificacaoExaminador: String(r.classificacao || ''), obs: '[transcrito por IA — conferir com o protocolo]' });
      });
    });
    toast('Resultados adicionados. Confira domínio, tipo de escore e valores com o protocolo.'); setExtraidos(null);
  };
  return <>
    <h1>5. Resultados</h1>
    <p className="mudo">Registre cada medida/subteste com o tipo de escore. Percentis e classificações que você informar são preservados exatamente no laudo (§2.3); o app só calcula uma equivalência interna para comparar medidas entre si.</p>
    <div className="cartao"><b>Transcrever escores de fotos/PDF de protocolos com IA</b>
      <p className="mudo pequeno">Funciona com Gemini, Claude, OpenAI ou OpenRouter. Você revisa cada linha antes de adicionar.</p>
      <label className="b">{ocupado ? 'Lendo arquivos…' : 'Selecionar arquivos'}<input type="file" multiple accept="image/*,application/pdf" hidden disabled={ocupado} onChange={e => extrair(e.target.files)} /></label>
      {extraidos && <div className="revisao"><table><thead><tr><th>Usar</th><th>Instrumento</th><th>Medida</th><th>Bruto</th><th>Padronizado</th><th>Tipo</th><th>Percentil</th><th>Classificação</th></tr></thead>
        <tbody>{extraidos.map((r, k) => <tr key={k}><td><input type="checkbox" checked={r.usar} onChange={e => setExtraidos(extraidos.map((x, i) => i === k ? { ...x, usar: e.target.checked } : x))} /></td><td>{r.instrumento}</td><td>{r.medida}</td><td>{r.escoreBruto}</td><td>{r.escorePadronizado}</td><td>{r.tipoEscore}</td><td>{r.percentil}</td><td>{r.classificacao}</td></tr>)}</tbody></table>
        <button className="b primario" onClick={aplicar}>Adicionar selecionados</button><button className="b" onClick={() => setExtraidos(null)}>Descartar</button></div>}
    </div>
    {!av.instrumentos.length && <p className="aviso">Adicione os instrumentos na etapa anterior.</p>}
    {av.instrumentos.map(i => {
      const ms = av.resultados.filter(r => r.instrumentoId === i.id);
      const uso = A.instrumentos.find(x => x.inst.id === i.id);
      return <div className="cartao" key={i.id}>
        <div className="linha-entre"><h3>{i.nome}</h3>{uso && !uso.utilizavel && <Selo tom="mau">fora da integração (SATEPSI)</Selo>}</div>
        <div className="tabela-rolagem"><table className="medidas"><thead><tr><th>Medida / subteste</th><th>Domínio</th><th>Natureza</th><th>Tipo de escore</th><th>Escore</th><th>Percentil</th><th>Bruto</th><th>Classificação do manual</th><th>Leitura</th><th></th></tr></thead>
          <tbody>{ms.map(m => {
            const an = A.medidas.find(x => x.m.id === m.id);
            return <tr key={m.id}>
              <td><input value={m.medida} onChange={e => upm(m.id, x => { x.medida = e.target.value; })} /><label className="pequeno"><input type="checkbox" checked={m.composto} onChange={e => upm(m.id, x => { x.composto = e.target.checked; })} /> índice composto</label></td>
              <td><Sel valor={m.dominio} onChange={v => upm(m.id, x => { x.dominio = v; })} opcoes={DOMINIOS.map(d => [d.id, d.nome])} /></td>
              <td><Sel valor={m.natureza} onChange={v => upm(m.id, x => { x.natureza = v as any; })} opcoes={[['desempenho', 'Desempenho'], ['sintoma', 'Sintoma (escala)']]} /></td>
              <td><Sel valor={m.metrica} onChange={v => upm(m.id, x => { x.metrica = v as any; })} opcoes={METRICAS.map(x => [x.id, x.nome])} /></td>
              <td><input className="num" inputMode="decimal" disabled={m.metrica === 'bruto' || m.metrica === 'classificacao'} value={m.valor ?? ''} onChange={e => upm(m.id, x => { x.valor = nOuNull(e.target.value); })} /></td>
              <td><input className="num" inputMode="decimal" disabled={m.metrica === 'percentil'} value={m.percentil ?? ''} onChange={e => upm(m.id, x => { x.percentil = nOuNull(e.target.value); })} /></td>
              <td><input className="num" value={m.bruto} onChange={e => upm(m.id, x => { x.bruto = e.target.value; })} /></td>
              <td><input value={m.classificacaoExaminador} placeholder="como no manual" onChange={e => upm(m.id, x => { x.classificacaoExaminador = e.target.value; })} /></td>
              <td>{an && (m.natureza === 'sintoma' ? <Selo tom={an.lida.elevadoSintoma ? 'mau' : an.lida.elevadoSintoma === false ? 'bom' : 'apagado'}>{an.lida.elevadoSintoma ? 'elevado' : an.lida.elevadoSintoma === false ? 'sem elevação' : '—'}</Selo> : <Selo tom={tomNivel(an.lida.nivel)}>{NOME_NIVEL[an.lida.nivel]}</Selo>)}
                {an?.lida.inconsistencia && <div className="texto-alerta pequeno" title={an.lida.inconsistencia}>⚠ conferir percentil</div>}</td>
              <td><button className="b fraco" title="Remover" onClick={() => up(a => { a.resultados = a.resultados.filter(x => x.id !== m.id); })}>×</button></td>
            </tr>;
          })}</tbody></table></div>
        <button className="b" onClick={() => nova(i.id)}>+ Medida</button>
      </div>;
    })}
  </>;
}

function EtRaciocinio({ A, av, up }: { A: Analise; av: Avaliacao; up: Up }) {
  const svg = perfilSVG(A);
  return <>
    <h1>6. Raciocínio clínico</h1>
    <p className="mudo">Calculado automaticamente a partir dos dados, seguindo as etapas do seu protocolo. Nada aqui é diagnóstico: é a organização da evidência para a sua decisão.</p>
    <div className="cartao"><h3>Controle de consistência dos dados (Etapa 0)</h3>
      {!A.consistencia.length ? <p>Nenhum problema encontrado.</p> : <ul className="problemas">{A.consistencia.map((p, i) => <li key={i} className={p.nivel}>{p.texto}</li>)}</ul>}</div>
    <div className="cartao"><h3>Perfil por domínio</h3>{svg ? <div className="perfil" dangerouslySetInnerHTML={{ __html: svg }} /> : <p className="mudo">Sem medidas de desempenho utilizáveis ainda.</p>}</div>
    <div className="cartao"><h3>Domínios, queixas e convergência (Etapas 6, 7 e 10)</h3>
      <div className="tabela-rolagem"><table><thead><tr><th>Domínio</th><th>Medidas</th><th>Situação</th><th>Análise intraindividual</th><th>Queixa</th><th>Convergência</th></tr></thead>
        <tbody>{A.dominios.filter(d => d.n || d.queixa).map(d => <tr key={d.id}><td>{d.nome}</td><td>{d.nUsadas}{d.n !== d.nUsadas ? ` de ${d.n}` : ''}</td><td><Selo tom={tomStatus(d.status)}>{d.status}</Selo></td><td>{d.ipsativo || '—'}</td><td>{d.queixa ? 'sim' : '—'}</td><td>{d.convergencia}</td></tr>)}</tbody></table></div>
      {A.mediaPessoal !== null && <p className="mudo pequeno">Referência intraindividual: média das medidas de desempenho do próprio paciente (z ≈ {String(A.mediaPessoal).replace('.', ',')}). Fragilidade/recurso relativo = 1 DP abaixo/acima dessa média.</p>}</div>
    <div className="cartao"><h3>Medidas (Etapa 5)</h3>
      <div className="tabela-rolagem"><table><thead><tr><th>Instrumento</th><th>Medida</th><th>Leitura normativa</th><th>Intraindividual</th><th>Na integração</th></tr></thead>
        <tbody>{A.medidas.map(m => <tr key={m.m.id}><td>{m.inst?.nome}</td><td>{m.m.medida}</td><td>{m.m.natureza === 'sintoma' ? (m.lida.elevadoSintoma ? 'sintomas elevados' : m.lida.elevadoSintoma === false ? 'sem elevação' : '—') : NOME_NIVEL[m.lida.nivel]}</td><td>{m.ipsativo || '—'}</td><td>{m.utilizada ? 'sim' : <span className="texto-alerta">não — {m.motivoExclusao}</span>}</td></tr>)}</tbody></table></div></div>
    {A.cautelas.length > 0 && <div className="cartao"><h3>Cautelas interpretativas</h3><ul>{A.cautelas.map((c, i) => <li key={i}>{c}</li>)}</ul></div>}
    {A.lacunas.length > 0 && <div className="cartao"><h3>Lacunas e instrumentos sugeridos</h3><ul>{A.lacunas.map(l => <li key={l.dominio}><b>{nomeDominio(l.dominio)}</b> — {l.motivo}.{l.sugestoes.length > 0 && <> Opções do catálogo: {l.sugestoes.map(s => s.nome).join('; ')}.</>}</li>)}</ul></div>}
  </>;
}

function EtHipoteses({ av, up, A }: { av: Avaliacao; up: Up; A: Analise }) {
  const [sel, setSel] = useState(HIPOTESES[0].id);
  const uph = (id: string, fn: (h: Avaliacao['hipoteses'][number]) => void) => up(a => { fn(a.hipoteses.find(h => h.id === id) as any); });
  const add = () => {
    if (sel === 'custom') return up(a => { a.hipoteses.push({ id: 'custom-' + uid(), nomeLivre: 'Outra hipótese', criteriosLivres: ['Critério 1'], criterios: {}, fontes: {}, notas: '' }); });
    if (av.hipoteses.some(h => h.id === sel)) return toast('Esta hipótese já foi adicionada.');
    up(a => { a.hipoteses.push({ id: sel, criterios: {}, fontes: {}, notas: '' }); });
  };
  return <>
    <h1>7. Hipóteses (Etapas 11 a 16)</h1>
    <p className="mudo">Marque cada critério com base nos dados. O app reúne as evidências, sugere o grau de sustentação pela hierarquia de evidências do §6 e ordena as hipóteses. O grau final é decisão sua.</p>
    <div className="linha"><Sel id="hip-sel" valor={sel} onChange={setSel} opcoes={[...HIPOTESES.map(h => [h.id, h.nome] as [string, string]), ['custom', 'Outra hipótese (livre)']]} /><button className="b primario" id="add-hip" onClick={add}>Adicionar hipótese</button></div>
    {A.hipoteses.map(h => {
      const raw = av.hipoteses.find(x => x.id === h.id)!;
      return <div className="cartao" key={h.id}>
        <div className="linha-entre">{h.def ? <h3>{h.nome}</h3> : <input className="titulo-livre" value={raw.nomeLivre || ''} onChange={e => uph(h.id, x => { x.nomeLivre = e.target.value; })} />}
          <Selo tom={tomGrau(h.grau)}>{h.grau}</Selo></div>
        {h.observacao && <p className="aviso pequeno">{h.observacao}</p>}
        <table className="criterios"><tbody>{h.criterios.map(c => <tr key={c.id}>
          <td>{h.def ? c.texto : <input value={(raw.criteriosLivres || [])[Number(c.id.slice(1))] ?? ''} onChange={e => uph(h.id, x => { (x.criteriosLivres = x.criteriosLivres || [])[Number(c.id.slice(1))] = e.target.value; })} />}{c.sugestao && <div className="sugestao">↳ {c.sugestao}</div>}</td>
          <td className="estados">{(['ok', 'nd', 'inv', 'contra'] as StatusCriterio[]).map(s => <button key={s} className={'est ' + s + (c.status === s ? ' on' : '')} onClick={() => uph(h.id, x => { x.criterios[c.id] = x.criterios[c.id] === s ? '' : s; })}>{NOME_STATUS[s]}</button>)}</td>
        </tr>)}</tbody></table>
        {!h.def && <button className="b fraco" onClick={() => uph(h.id, x => { x.criteriosLivres = [...(x.criteriosLivres || []), `Critério ${(x.criteriosLivres || []).length + 1}`]; })}>+ critério</button>}
        <p className="mudo"><b>Fontes de evidência que convergem</b> (ordem de prioridade do §6):</p>
        <div className="chips">{FONTES.map(f => { const auto = h.fontesAuto.includes(f.id); return <label key={f.id} className={'chip' + (h.fontesAtivas.includes(f.id) ? ' on' : '')} title={auto ? 'Marcado automaticamente pelos resultados' : ''}>
          <input type="checkbox" disabled={auto} checked={h.fontesAtivas.includes(f.id)} onChange={e => uph(h.id, x => { x.fontes[f.id] = e.target.checked; })} />{f.nome}{auto ? ' (auto)' : ''}</label>; })}</div>
        {h.dominios.length > 0 && <p className="pequeno"><b>Domínios tipicamente associados</b> (contextualizam; nenhum padrão cognitivo isolado confirma o diagnóstico): {h.dominios.map(d => `${d.nome}: ${d.status}`).join(' · ')}</p>}
        <p className="pequeno"><b>Grau sugerido:</b> {h.grauSugerido}. {h.justificativa}</p>
        <Sel rotulo="Grau final (decisão do profissional)" valor={raw.grauManual || ''} onChange={v => uph(h.id, x => { x.grauManual = v as Grau | ''; })} opcoes={[['', `Usar o sugerido (${h.grauSugerido})`], ...(['Fortemente sustentada', 'Moderadamente sustentada', 'Parcialmente sustentada', 'Hipótese a investigar', 'Pouco sustentada'].map(g => [g, g] as [string, string]))]} />
        <Area rotulo="Notas clínicas sobre esta hipótese" valor={raw.notas} onChange={v => uph(h.id, x => { x.notas = v; })} linhas={2} />
        {h.dadosFaltantes.length > 0 && <details><summary>Dados ainda necessários ({h.dadosFaltantes.length})</summary><ul>{h.dadosFaltantes.map((d, i) => <li key={i}>{d}</li>)}</ul></details>}
        <button className="b fraco" onClick={() => up(a => { a.hipoteses = a.hipoteses.filter(x => x.id !== h.id); })}>Remover hipótese</button>
      </div>;
    })}
  </>;
}

function EtLaudo({ av, up, A, banco, pac, mut }: { av: Avaliacao; up: Up; A: Analise; banco: Banco; pac?: Paciente; mut: Mut }) {
  const [prog, setProg] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const refs = banco.referencias.filter(r => av.referenciasIds.includes(r.id));
  const prop = proporcaoCitacoes(av.laudo.secoes);
  const gerar = async (ids?: string[]) => {
    const alvo = SECOES.filter(s => s.modo === 'ia' && (!ids || ids.includes(s.id)));
    setOcupado(true);
    const trat = tratamento(pac), sys = sistema(trat), dados = dadosParaIA(av, pac, A, refs, banco.citacoes);
    try {
      for (let k = 0; k < alvo.length; k++) {
        const s = alvo[k];
        setProg(`Redigindo ${k + 1}/${alvo.length}: ${s.titulo}…`);
        let texto = '';
        if (s.id === 'resultados') {
          const doms = A.dominios.filter(d => d.n > 0);
          const partes: string[] = [];
          for (const d of doms) {
            setProg(`Redigindo ${k + 1}/${alvo.length}: Resultados — ${d.nome}…`);
            const medidas = (dados.medidas as any[]).filter(m => m.dominio === d.nome);
            const t = await chamarIA(banco.config.ia, { system: sys, maxTokens: 6000, messages: [{ role: 'user', content: pedidoSecao({ ...s, instrucao: `Domínio "${d.nome}" (situação calculada: ${d.status}; convergência com a queixa: ${d.convergencia}). Para CADA medida deste domínio, crie um subtítulo "### ${d.nome} · [instrumento] — [medida]" e um parágrafo com, nesta ordem: (1) construto ou processo investigado; (2) parâmetros disponíveis e seus limites interpretativos; (3) interpretação normativa e intraindividual (preservado, recurso relativo, fragilidade relativa ou comprometimento demonstrado); (4) impacto funcional provável ou demonstrado, explicitando quando for hipotético; (5) forças e mecanismos compensatórios; (6) fraquezas, fatores interferentes e explicações alternativas; (7) o que o achado reforça, enfraquece ou deixa neutro em cada hipótese registrada. Medidas com "utilizada": false: mencione apenas como informação documental. Termine com "### Síntese do domínio: ${d.nome}" em um parágrafo (Etapa 6).` }, { ...dados, medidas }) }] });
            partes.push(t.trim());
          }
          texto = partes.join('\n\n');
        } else {
          texto = await chamarIA(banco.config.ia, { system: sys, maxTokens: 6000, messages: [{ role: 'user', content: pedidoSecao(s, dados) }] });
        }
        up(a => { a.laudo.secoes[s.id] = texto.trim(); a.laudo.geradoEm = agora(); });
      }
      setProg(''); toast('Laudo redigido. Revise cada seção antes de exportar.');
    } catch (e: any) { setProg(''); toast(e.message); }
    setOcupado(false);
  };
  const exportar = async () => {
    try {
      const svg = perfilSVG(A);
      const png = svg ? await svgParaPng(svg).catch(() => null) : null;
      const { gerarDocx } = await import('./exportar');
      const blob = await gerarDocx(av, pac, A, banco.config, banco.referencias, png);
      baixar(`Avaliacao_Neuropsicologica_${slug(pac?.nome || 'paciente')}_${hojeISO()}.docx`, blob);
    } catch (e: any) { toast('Erro ao gerar o .docx: ' + e.message); }
  };
  return <>
    <h1>8. Laudo</h1>
    <div className="cartao"><h3>Auditoria crítica (Etapa 19)</h3>
      <ul className="auditoria">{A.auditoria.map((x, i) => <li key={i} className={x.ok ? 'ok' : 'falta'}>{x.ok ? '✓' : '✗'} {x.texto}</li>)}
        <li className={prop >= 0.05 ? 'ok' : 'falta'}>{prop >= 0.05 ? '✓' : '✗'} Citações diretas no texto analítico: {(prop * 100).toFixed(1).replace('.', ',')}% (mínimo do protocolo: 5%). {banco.citacoes.length ? '' : 'Cadastre citações verificadas em Referências; a IA só usa citações do seu banco.'}</li></ul>
      {!banco.config.profissional && <p className="aviso pequeno">Preencha seu nome e CRP em Configurações para a capa e a assinatura.</p>}</div>
    <div className="cartao"><h3>Referências consultadas para este laudo</h3>
      <p className="mudo pequeno">Marque apenas as obras que você efetivamente consultou. A IA só pode citar estas. Gerencie a lista em Referências.</p>
      {banco.referencias.map(r => <label key={r.id} className="ref"><input type="checkbox" checked={av.referenciasIds.includes(r.id)} onChange={e => up(a => { a.referenciasIds = e.target.checked ? [...a.referenciasIds, r.id] : a.referenciasIds.filter(x => x !== r.id); })} /> {r.abnt}</label>)}</div>
    <div className="cartao">
      <button className="b primario" id="gerar-laudo" disabled={ocupado} onClick={() => gerar()}>{ocupado ? 'Redigindo…' : Object.keys(av.laudo.secoes).length ? 'Redigir todas as seções de novo' : 'Redigir laudo com IA'}</button>
      <button className="b primario" id="exportar-docx" onClick={exportar}>Baixar laudo em Word (.docx)</button>
      {prog && <p className="progresso">{prog}</p>}
      <p className="mudo pequeno">A IA recebe apenas idade, sexo, escolaridade e os dados clínicos anonimizados; o nome entra só no arquivo final. Identificação, tabelas, alertas SATEPSI, referências e assinatura são montados pelo app.</p>
    </div>
    {SECOES.map((s, i) => <div className="cartao secao" key={s.id}>
      <div className="linha-entre"><h3>{i + 1}. {s.titulo}</h3>{s.modo === 'ia' ? <button className="b" disabled={ocupado} onClick={() => gerar([s.id])}>{av.laudo.secoes[s.id] ? 'Refazer' : 'Redigir'}</button> : <Selo tom="apagado">montada pelo app</Selo>}</div>
      {s.modo === 'ia' ? <textarea rows={av.laudo.secoes[s.id] ? 10 : 2} value={av.laudo.secoes[s.id] || ''} placeholder="Ainda não redigida" onChange={e => up(a => { a.laudo.secoes[s.id] = e.target.value; })} />
        : s.id === 'instrumentos' ? <ul className="pequeno">{A.instrumentos.map(x => <li key={x.inst.id}>{x.inst.nome}: {x.inst.satepsi.status}{x.alerta && <span className="texto-alerta"> — alerta em vermelho no laudo</span>}</li>)}</ul>
        : <p className="mudo pequeno">{s.id === 'identificacao' ? 'Dados do cadastro do paciente.' : s.id === 'referencias' ? `${refs.length} referência(s) selecionada(s), em ABNT.` : 'Local, data, nome, título e CRP das Configurações.'}</p>}
    </div>)}
  </>;
}

// ---------- referências ----------
function Biblioteca({ banco, mut }: { banco: Banco; mut: Mut }) {
  return <section>
    <h1>Referências e citações</h1>
    <div className="cartao"><h2>Referências (ABNT)</h2>
      <p className="mudo">Começa com a bibliografia-base do seu prompt-mestre. Complete os dados entre colchetes com a edição que você consultou. Só as referências marcadas em cada laudo podem ser citadas pela IA.</p>
      {banco.referencias.map(r => <div className="ref-ed" key={r.id}>
        <textarea rows={2} value={r.abnt} onChange={e => mut(b => { (b.referencias.find(x => x.id === r.id) as any).abnt = e.target.value; })} />
        <input value={r.autorAno} title="Como citar no texto (autor, ano)" onChange={e => mut(b => { (b.referencias.find(x => x.id === r.id) as any).autorAno = e.target.value; })} />
        <button className="b fraco" onClick={() => mut(b => { b.referencias = b.referencias.filter(x => x.id !== r.id); b.avaliacoes.forEach(a => { a.referenciasIds = a.referenciasIds.filter(x => x !== r.id); }); })}>×</button></div>)}
      <button className="b" onClick={() => mut(b => { b.referencias.push({ id: uid(), abnt: 'SOBRENOME, Nome. Título. Edição. Cidade: Editora, ano.', autorAno: 'Sobrenome, ano' }); })}>+ Referência</button></div>
    <div className="cartao"><h2>Banco de citações diretas</h2>
      <p className="mudo">Trechos que você conferiu na fonte original, com página. A IA só faz citação direta usando este banco, literalmente (§2.7), e não inventa páginas.</p>
      {banco.citacoes.map(c => <div className="ref-ed" key={c.id}>
        <textarea rows={2} value={c.texto} placeholder="Trecho literal" onChange={e => mut(b => { (b.citacoes.find(x => x.id === c.id) as any).texto = e.target.value; })} />
        <input value={c.autor} placeholder="Autor" onChange={e => mut(b => { (b.citacoes.find(x => x.id === c.id) as any).autor = e.target.value; })} />
        <input value={c.ano} placeholder="Ano" className="curto" onChange={e => mut(b => { (b.citacoes.find(x => x.id === c.id) as any).ano = e.target.value; })} />
        <input value={c.pagina} placeholder="p." className="curto" onChange={e => mut(b => { (b.citacoes.find(x => x.id === c.id) as any).pagina = e.target.value; })} />
        <button className="b fraco" onClick={() => mut(b => { b.citacoes = b.citacoes.filter(x => x.id !== c.id); })}>×</button></div>)}
      <button className="b" onClick={() => mut(b => { b.citacoes.push({ id: uid(), texto: '', autor: '', ano: '', pagina: '' }); })}>+ Citação</button></div>
  </section>;
}

// ---------- configurações ----------
function Configuracoes({ banco, mut }: { banco: Banco; mut: Mut }) {
  const c = banco.config, ia = c.ia, P = PROVIDERS[ia.provider] || PROVIDERS.gemini;
  const [teste, setTeste] = useState<{ ok: boolean; t: string } | null>(null);
  const [modelos, setModelos] = useState<string[]>([]);
  const up = (fn: (c: Config) => void) => mut(b => fn(b.config));
  const modelo = ia.models[ia.provider] || P.modelo;
  const testar = async () => {
    setTeste({ ok: true, t: 'Testando…' }); const t0 = Date.now();
    try {
      const ms = await listarModelos(ia); setModelos(ms);
      if (!modelo && ms.length) up(x => { x.ia.models[x.ia.provider] = ms[0]; });
      const cfg = { ...ia, models: { ...ia.models, [ia.provider]: modelo || ms[0] || '' } };
      const r = await chamarIA(cfg, { system: 'Responda em português, em uma frase curta.', messages: [{ role: 'user', content: 'Diga apenas: conexão funcionando.' }], maxTokens: 200 });
      setTeste({ ok: true, t: `✓ Funcionando (${Math.round((Date.now() - t0) / 1000)} s): ${r.slice(0, 80)}${ms.length ? ` · ${ms.length} modelos disponíveis` : ''}` });
    } catch (e: any) { setTeste({ ok: false, t: '✗ ' + e.message }); }
  };
  return <section>
    <h1>Configurações</h1>
    <div className="cartao"><h2>Profissional</h2><div className="grade">
      <Campo id="c-prof" rotulo="Nome" valor={c.profissional} onChange={v => up(x => { x.profissional = v; })} />
      <Campo id="c-crp" rotulo="CRP" valor={c.crp} onChange={v => up(x => { x.crp = v; })} />
      <Campo rotulo="Título" valor={c.titulo} onChange={v => up(x => { x.titulo = v; })} />
      <Campo rotulo="Cidade (para a data do laudo)" valor={c.cidade} onChange={v => up(x => { x.cidade = v; })} /></div></div>
    <div className="cartao"><h2>Inteligência artificial</h2>
      <Campo id="c-key" tipo="password" rotulo="Chave de API (de qualquer serviço — fica só neste navegador)" valor={ia.keys[ia.provider] || ''} ph="Cole aqui"
        onChange={v => up(x => { const d = detectarProvider(v); if (d && d !== x.ia.provider) { x.ia.keys[d] = v.trim(); x.ia.provider = d; toast('Chave reconhecida: ' + PROVIDERS[d].nome); } else x.ia.keys[x.ia.provider] = v.trim(); })} />
      <Sel id="c-prov" rotulo="Serviço (reconhecido automaticamente pela chave)" valor={ia.provider} onChange={v => up(x => { x.ia.provider = v; })} opcoes={Object.entries(PROVIDERS).map(([k, p]) => [k, p.nome])} />
      {ia.provider === 'outro' && <Campo rotulo="Endereço base da API" valor={ia.customBase} onChange={v => up(x => { x.ia.customBase = v; })} ph="https://servico.com/v1" />}
      <label className="campo"><span>Modelo</span><input id="c-model" list="lista-modelos" value={modelo} onChange={e => up(x => { x.ia.models[x.ia.provider] = e.target.value; })} /><datalist id="lista-modelos">{modelos.map(m => <option key={m} value={m} />)}</datalist></label>
      <p className="mudo pequeno">{P.ajuda}</p>
      <button className="b primario" id="testar" onClick={testar}>Testar conexão</button>
      {teste && <p id="teste-out" className={teste.ok ? 'ok-texto' : 'texto-alerta'}>{teste.t}</p>}
      <p className="mudo pequeno">Privacidade: o app nunca envia nome, contato, e-mail, telefone ou CPF à IA. Ainda assim, dados clínicos anonimizados são enviados ao serviço escolhido; informe isso no seu termo de consentimento (LGPD).</p></div>
    <div className="cartao"><h2>Limiares do raciocínio</h2><p className="mudo">Pontos de corte usados pelo motor, em desvios-padrão (equivalência interna). Ajuste conforme sua prática.</p><div className="grade">
      <Campo tipo="number" rotulo="Abaixo do esperado (z ≤)" valor={String(c.limiares.rebaixado)} onChange={v => up(x => { x.limiares.rebaixado = Number(v); })} />
      <Campo tipo="number" rotulo="Comprometimento acentuado (z ≤)" valor={String(c.limiares.comprometido)} onChange={v => up(x => { x.limiares.comprometido = Number(v); })} />
      <Campo tipo="number" rotulo="Diferença intraindividual (DP)" valor={String(c.limiares.ipsativo)} onChange={v => up(x => { x.limiares.ipsativo = Number(v); })} /></div></div>
    <p className="mudo pequeno">T-Gestor 2.0</p>
  </section>;
}
