// Leitura de arquivos (texto de .txt/.docx/.pdf e base64 para envio à IA)
import type { Anexo } from './ai';

const abs = (u: string) => new URL(u, document.baseURI).href;
let pdfjsP: Promise<any> | null = null;
function pdfjs() {
  if (!pdfjsP) pdfjsP = import(/* externo */ abs('lib/pdf.min.js')).then((m: any) => { m.GlobalWorkerOptions.workerSrc = abs('lib/pdf.worker.min.js'); return m; })
    .catch(e => { pdfjsP = null; throw new Error('Não foi possível abrir o leitor de PDF: ' + e.message); });
  return pdfjsP;
}
async function pdfTexto(buf: ArrayBuffer) {
  const lib = await pdfjs();
  const d = await lib.getDocument({ data: new Uint8Array(buf) }).promise; const out: string[] = [];
  for (let i = 1; i <= d.numPages; i++) {
    const c = await (await d.getPage(i)).getTextContent();
    out.push(c.items.map((x: any) => x.str + (x.hasEOL ? '\n' : ' ')).join(''));
  }
  return out.join('\n\n');
}
async function inflar(u8: Uint8Array) {
  const st = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(st).arrayBuffer());
}
// .docx sem dependências: abre o zip e extrai word/document.xml
export async function docxTexto(buf: ArrayBuffer): Promise<string> {
  const u8 = new Uint8Array(buf), dv = new DataView(buf), dec = new TextDecoder('utf-8');
  let e = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error('Arquivo .docx inválido.');
  const n = dv.getUint16(e + 10, true); let off = dv.getUint32(e + 16, true), xml: string | null = null;
  for (let k = 0; k < n && dv.getUint32(off, true) === 0x02014b50; k++) {
    const metodo = dv.getUint16(off + 10, true), tam = dv.getUint32(off + 20, true);
    const nl = dv.getUint16(off + 28, true), xl = dv.getUint16(off + 30, true), cl = dv.getUint16(off + 32, true), lho = dv.getUint32(off + 42, true);
    if (dec.decode(u8.subarray(off + 46, off + 46 + nl)) === 'word/document.xml') {
      const ini = lho + 30 + dv.getUint16(lho + 26, true) + dv.getUint16(lho + 28, true);
      const dado = u8.subarray(ini, ini + tam);
      xml = dec.decode(metodo === 0 ? dado : await inflar(dado)); break;
    }
    off += 46 + nl + xl + cl;
  }
  if (xml === null) throw new Error('Texto não encontrado no .docx.');
  const ent: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  return xml.replace(/<w:tab\/>/g, '\t').replace(/<w:br[^>]*\/>/g, '\n').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '')
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, c) => c[0] === '#' ? String.fromCodePoint(/^#x/i.test(c) ? parseInt(c.slice(2), 16) : parseInt(c.slice(1), 10)) : ent[c] || m)
    .replace(/\n{3,}/g, '\n\n').trim();
}
export async function lerTexto(f: File): Promise<string> {
  const n = f.name.toLowerCase();
  if (n.endsWith('.pdf')) return pdfTexto(await f.arrayBuffer());
  if (n.endsWith('.docx')) return docxTexto(await f.arrayBuffer());
  if (n.endsWith('.doc')) throw new Error('Formato .doc antigo: salve como .docx ou PDF.');
  return f.text();
}
export function paraAnexo(f: File): Promise<Anexo> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res({ nome: f.name, mime: f.type || (f.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'), base64: String(r.result).split(',')[1] });
    r.onerror = () => rej(r.error);
    r.readAsDataURL(f);
  });
}
