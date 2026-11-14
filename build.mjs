// Compila o T-Gestor para a pasta dist/ (sem Vite): esbuild + cópia dos arquivos estáticos.
import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const out = 'dist';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'assets'), { recursive: true });
fs.mkdirSync(path.join(out, 'lib'), { recursive: true });
await esbuild.build({
  entryPoints: ['src/main.tsx'], bundle: true, format: 'esm', splitting: true, outdir: path.join(out, 'assets'),
  minify: true, sourcemap: false, target: ['es2021'], jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' },
  nodePaths: process.env.NODE_PATH ? process.env.NODE_PATH.split(':') : [], logLevel: 'warning',
  chunkNames: 'chunks/[name]-[hash]'
});
fs.copyFileSync('src/styles.css', path.join(out, 'assets', 'styles.css'));
fs.copyFileSync('index.html', path.join(out, 'index.html'));
for (const f of fs.readdirSync('public')) fs.copyFileSync(path.join('public', f), path.join(out, f));
// Leitor de PDF (pdf.js) servido como arquivo próprio, carregado só quando necessário
const pdfDir = path.dirname(require.resolve('pdfjs-dist/package.json', { paths: [process.cwd(), ...(process.env.NODE_PATH || '').split(':').filter(Boolean)] }));
fs.copyFileSync(path.join(pdfDir, 'legacy/build/pdf.min.mjs'), path.join(out, 'lib', 'pdf.min.js'));
fs.copyFileSync(path.join(pdfDir, 'legacy/build/pdf.worker.min.mjs'), path.join(out, 'lib', 'pdf.worker.min.js'));
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('dist/ pronto');
