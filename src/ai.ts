// Conexão com IA: aceita chave de qualquer serviço (reconhecida automaticamente).
// A chave fica somente neste navegador. Dados enviados à IA são anonimizados pelo app.
import type { ConfigIA } from './store';

export interface Provider { nome: string; tipo: 'gemini' | 'anthropic' | 'openai'; base?: string; modelo: string; prefixo?: RegExp; ajuda: string; semNavegador?: boolean; visao?: boolean }
export const PROVIDERS: Record<string, Provider> = {
  gemini: { nome: 'Google Gemini (grátis)', tipo: 'gemini', modelo: 'gemini-4-hydrogen', prefixo: /^AIza/, visao: true, ajuda: 'Chave em aistudio.google.com → Chaves de API. No plano grátis o Google pode usar os dados enviados para melhorar seus produtos.' },
  anthropic: { nome: 'Claude / Anthropic (pago)', tipo: 'anthropic', modelo: 'claude-sonnet-5-5', prefixo: /^sk-ant-/, visao: true, ajuda: 'Chave em console.anthropic.com (exige créditos).' },
  nvidia: { nome: 'NVIDIA (bloqueia o navegador; precisa de proxy)', tipo: 'openai', base: 'https://integrate.api.nvidia.com/v1', modelo: 'google/gemma-4-31b-it', prefixo: /^nvapi-/, semNavegador: true, ajuda: 'Chave em build.nvidia.com.' },
  openrouter: { nome: 'OpenRouter', tipo: 'openai', base: 'https://openrouter.ai/api/v1', modelo: '', prefixo: /^sk-or-/, visao: true, ajuda: 'Chave em openrouter.ai/keys. Modelos ":free" são gratuitos.' },
  groq: { nome: 'Groq (grátis)', tipo: 'openai', base: 'https://api.groq.com/openai/v1', modelo: '', prefixo: /^gsk_/, ajuda: 'Chave em console.groq.com/keys.' },
  deepseek: { nome: 'DeepSeek', tipo: 'openai', base: 'https://api.deepseek.com/v1', modelo: 'deepseek-flash', prefixo: /^sk-[0-9a-f]{32}$/, ajuda: 'Chave em platform.deepseek.com (cobra por uso).' },
  openai: { nome: 'OpenAI (ChatGPT)', tipo: 'openai', base: 'https://api.openai.com/v1', modelo: '', prefixo: /^sk-(proj-|svcacct-|admin-)?/, visao: true, ajuda: 'Chave em platform.openai.com/api-keys.' },
  xai: { nome: 'xAI (Grok)', tipo: 'openai', base: 'https://api.x.ai/v1', modelo: '', prefixo: /^xai-/, ajuda: 'Chave em console.x.ai.' },
  mistral: { nome: 'Mistral', tipo: 'openai', base: 'https://api.mistral.ai/v1', modelo: '', ajuda: 'Chave em console.mistral.ai.' },
  outro: { nome: 'Outro serviço (padrão OpenAI)', tipo: 'openai', base: '', modelo: '', ajuda: 'Informe o endereço base da API (ex.: https://servico.com/v1).' }
};
export function detectarProvider(key: string): string | null {
  for (const id of Object.keys(PROVIDERS)) { const p = PROVIDERS[id].prefixo; if (p && p.test(key.trim())) return id; }
  return null;
}

export interface Anexo { mime: string; base64: string; nome: string }
export interface Msg { role: 'user' | 'assistant'; content: string }

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
class ErroIA extends Error { status?: number }

function ctx(c: ConfigIA) {
  const id = PROVIDERS[c.provider] ? c.provider : 'gemini', P = PROVIDERS[id];
  return { id, P, key: (c.keys[id] || '').trim(), model: (c.models[id] || P.modelo || '').trim(), base: (id === 'outro' ? c.customBase : P.base || '').replace(/\/+$/, '') };
}

async function post(url: string, headers: Record<string, string>, body: unknown, nomeServico: string, tipo: string): Promise<any> {
  for (let i = 0; i < 5; i++) {
    let r: Response;
    try { r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) }); }
    catch { throw new ErroIA(tipo === 'openai' ? `${nomeServico} não respondeu. Alguns serviços bloqueiam o uso direto pelo navegador; teste outro serviço em Configurações.` : 'Sem conexão com o serviço de IA. Verifique a internet.'); }
    if ([429, 500, 502, 503, 529].includes(r.status)) { await sleep(3000 * (i + 1) * (i + 1)); continue; }
    const j: any = await r.json().catch(() => ({}));
    const txt = JSON.stringify(j);
    if (r.status === 401 || r.status === 403 || /API key not valid|API_KEY_INVALID|invalid.{0,10}api.{0,3}key|incorrect api key/i.test(txt)) throw new ErroIA('Chave recusada pelo serviço de IA. Confira em Configurações (use "Testar conexão").');
    if (r.status === 402 || /insufficient.{0,3}balance|insufficient_quota|exceeded your current quota|billing/i.test(txt)) throw new ErroIA('A chave funciona, mas a conta do serviço está sem saldo. Adicione créditos ou use um serviço grátis (Gemini).');
    if (r.status === 404) throw new ErroIA('Modelo indisponível para esta chave. Escolha outro em Configurações ("Testar conexão" lista os disponíveis).');
    if (!r.ok) { const e = new ErroIA(String(j?.error?.message || j?.error || j?.detail || j?.message || `Erro ${r.status}`)); e.status = r.status; throw e; }
    return j;
  }
  throw new ErroIA('Serviço ocupado (limite de uso atingido). Aguarde um minuto e tente de novo.');
}

export async function chamarIA(c: ConfigIA, o: { system: string; messages: Msg[]; maxTokens?: number; anexos?: Anexo[]; json?: boolean }): Promise<string> {
  const { id, P, key, model, base } = ctx(c);
  if (!key) throw new ErroIA('Cole a sua chave de IA em Configurações.');
  if (!model) throw new ErroIA('Escolha um modelo em Configurações ("Testar conexão" lista os disponíveis).');
  const anexos = o.anexos || [];
  if (anexos.length && !P.visao) throw new ErroIA(`${P.nome} não lê imagens/PDF neste app. Use Gemini, Claude, OpenAI ou OpenRouter para extrair escores de arquivos.`);
  const max = o.maxTokens || 4000;

  if (P.tipo === 'gemini') {
    const contents = o.messages.map((m, i) => ({ role: m.role === 'assistant' ? 'model' : 'user',
      parts: [...(i === o.messages.length - 1 ? anexos.map(a => ({ inlineData: { mimeType: a.mime, data: a.base64 } })) : []), { text: m.content }] }));
    const j = await post(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.replace(/^models\//, ''))}:generateContent`,
      { 'content-type': 'application/json', 'x-goog-api-key': key },
      { systemInstruction: { parts: [{ text: o.system }] }, contents, generationConfig: { maxOutputTokens: Math.max(max, 8192), temperature: 0.4, ...(o.json ? { responseMimeType: 'application/json' } : {}) } }, P.nome, P.tipo);
    if (j.promptFeedback?.blockReason) throw new ErroIA(`O Gemini recusou o pedido (${j.promptFeedback.blockReason}).`);
    const cand = j.candidates?.[0];
    const out = (cand?.content?.parts || []).filter((p: any) => !p.thought && p.text).map((p: any) => p.text).join('');
    if (!out.trim()) throw new ErroIA(`O Gemini não devolveu texto${cand?.finishReason ? ' (' + cand.finishReason + ')' : ''}. Tente de novo.`);
    return out.trim();
  }

  if (P.tipo === 'anthropic') {
    const messages = o.messages.map((m, i) => ({ role: m.role,
      content: i === o.messages.length - 1 && anexos.length
        ? [...anexos.map(a => a.mime === 'application/pdf' ? { type: 'document', source: { type: 'base64', media_type: a.mime, data: a.base64 } } : { type: 'image', source: { type: 'base64', media_type: a.mime, data: a.base64 } }), { type: 'text', text: m.content }]
        : m.content }));
    const j = await post('https://api.anthropic.com/v1/messages', { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      { model, max_tokens: max, system: o.system, messages }, P.nome, P.tipo);
    return (j.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim();
  }

  if (P.semNavegador) throw new ErroIA(`${P.nome}: este serviço não permite uso direto pelo navegador. Escolha outro serviço em Configurações.`);
  if (!base) throw new ErroIA('Informe o endereço base da API em Configurações.');
  if (anexos.some(a => a.mime === 'application/pdf')) throw new ErroIA('Este serviço não lê PDF diretamente; envie fotos/imagens do protocolo ou use Gemini/Claude.');
  const messages: any[] = [{ role: 'system', content: o.system }, ...o.messages.map((m, i) => ({ role: m.role,
    content: i === o.messages.length - 1 && anexos.length ? [...anexos.map(a => ({ type: 'image_url', image_url: { url: `data:${a.mime};base64,${a.base64}` } })), { type: 'text', text: m.content }] : m.content }))];
  const body: any = { model, max_tokens: Math.max(max, 6000), temperature: 0.4, messages };
  let j: any;
  for (let k = 0; k < 3; k++) {
    try { j = await post(base + '/chat/completions', { 'content-type': 'application/json', authorization: 'Bearer ' + key }, body, P.nome, P.tipo); break; }
    catch (e: any) {
      if (e.status === 400 && /max_tokens/.test(e.message) && body.max_tokens) { body.max_completion_tokens = body.max_tokens; delete body.max_tokens; continue; }
      if (e.status === 400 && /temperature/.test(e.message) && 'temperature' in body) { delete body.temperature; continue; }
      throw e;
    }
  }
  const out = String(j?.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  if (!out) throw new ErroIA('A IA não devolveu texto. Tente de novo ou escolha outro modelo.');
  return out;
}

export async function listarModelos(c: ConfigIA): Promise<string[]> {
  const { id, P, key, base } = ctx(c);
  try {
    let nomes: string[] = [];
    if (P.tipo === 'gemini') {
      const j = await (await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } })).json();
      nomes = (j.models || []).filter((m: any) => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini/i.test(m.name)).map((m: any) => m.name.replace(/^models\//, ''));
    } else if (P.tipo === 'anthropic') {
      const j = await (await fetch('https://api.anthropic.com/v1/models', { headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' } })).json();
      nomes = (j.data || []).map((m: any) => m.id);
    } else if (!P.semNavegador && base) {
      const j = await (await fetch(base + '/models', { headers: { authorization: 'Bearer ' + key } })).json();
      nomes = (j.data || j.models || []).map((m: any) => m.id || m.name).filter(Boolean);
      if (id === 'openrouter') nomes.sort((a, b) => Number(/:free$/.test(b)) - Number(/:free$/.test(a)));
    }
    return nomes.filter(n => !/embed|whisper|tts|dall-e|image|audio|moderation|rerank|guard|transcri|realtime|speech/i.test(n));
  } catch { return []; }
}

// Extrai o primeiro objeto/array JSON de uma resposta
export function extrairJSON(txt: string): any {
  const s = txt.replace(/```(?:json)?/gi, '').trim();
  try { return JSON.parse(s); } catch { /* segue */ }
  const i = Math.min(...['{', '['].map(c => { const k = s.indexOf(c); return k < 0 ? Infinity : k; }));
  const f = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
  if (i === Infinity || f < i) throw new Error('A IA não devolveu dados no formato esperado. Tente de novo.');
  return JSON.parse(s.slice(i, f + 1));
}
