// Gráfico de perfil por domínio (SVG puro): equivalência interna em DP, faixas de referência,
// pontos por medida e marcador da média do domínio. Usado na tela e no laudo (PNG).
import type { Analise } from './engine/raciocinio';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function perfilSVG(A: Analise, largura = 820): string | null {
  const doms = A.dominios.filter(d => A.medidas.some(m => m.utilizada && m.m.dominio === d.id && m.m.natureza === 'desempenho' && m.lida.z !== null));
  if (!doms.length) return null;
  const L = 250, R = 30, top = 34, lh = 30, W = largura, H = top + doms.length * lh + 52;
  const x = (z: number) => L + ((Math.max(-3, Math.min(3, z)) + 3) / 6) * (W - L - R);
  const faixas: [number, number, string][] = [[-3, -2, '#E8B9B5'], [-2, -1.5, '#F1D3CF'], [-1.5, -1, '#F4E6CF'], [-1, 1, '#F5F1E8'], [1, 3, '#E3EADB']];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Georgia, 'Times New Roman', serif">`;
  s += `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`;
  faixas.forEach(([a, b, c]) => { s += `<rect x="${x(a)}" y="${top - 6}" width="${x(b) - x(a)}" height="${doms.length * lh + 6}" fill="${c}"/>`; });
  [-3, -2, -1.5, -1, 0, 1, 2, 3].forEach(z => {
    s += `<line x1="${x(z)}" x2="${x(z)}" y1="${top - 6}" y2="${top + doms.length * lh}" stroke="${z === 0 ? '#5A5A4D' : '#D6CFBF'}" stroke-width="${z === 0 ? 1.2 : 0.8}"/>`;
    s += `<text x="${x(z)}" y="${top - 12}" font-size="11" text-anchor="middle" fill="#5A5A4D">${String(z).replace('.', ',')}</text>`;
  });
  doms.forEach((d, i) => {
    const y = top + i * lh + lh / 2;
    s += `<text x="${L - 10}" y="${y + 4}" font-size="12.5" text-anchor="end" fill="#111111">${esc(d.nome.length > 34 ? d.nome.slice(0, 33) + '…' : d.nome)}</text>`;
    s += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="#E2DCCF" stroke-width="0.6"/>`;
    A.medidas.filter(m => m.utilizada && m.m.dominio === d.id && m.m.natureza === 'desempenho' && m.lida.z !== null).forEach(m => {
      const baixo = m.lida.nivel === 'rebaixado' || m.lida.nivel === 'comprometido';
      s += `<circle cx="${x(m.lida.z as number)}" cy="${y}" r="5" fill="${baixo ? '#BC2E28' : '#5A5A4D'}" fill-opacity="0.85"><title>${esc(m.m.medida)}</title></circle>`;
    });
    if (d.mediaZ !== null) s += `<rect x="${x(d.mediaZ) - 1.5}" y="${y - 10}" width="3" height="20" fill="#111111"/>`;
  });
  s += `<text x="20" y="${H - 24}" font-size="10.5" fill="#5A5A4D">Pontos: medidas (vermelho = abaixo do esperado). Traço: média do domínio.</text>`;
  s += `<text x="20" y="${H - 10}" font-size="10.5" fill="#5A5A4D">Escala em desvios-padrão (equivalência interna; não substitui as tabelas dos manuais).</text>`;
  return s + '</svg>';
}

export async function svgParaPng(svg: string, escala = 2): Promise<Uint8Array> {
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const c = document.createElement('canvas');
  c.width = img.width * escala; c.height = img.height * escala;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.scale(escala, escala); g.drawImage(img, 0, 0);
  const blob: Blob = await new Promise(res => c.toBlob(b => res(b as Blob), 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}
