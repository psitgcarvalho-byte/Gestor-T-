// Teste ponta a ponta no Chromium: fluxo completo de uma avaliação, com a IA (Gemini) simulada.
// Uso: node tests/e2e.cjs <pasta-saida>
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), http = require('http'), path = require('path');
const root = path.resolve(__dirname, '..', 'dist'), OUT = process.argv[2] || '/tmp';
const MIME = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', MIME[path.extname(f)] || 'application/octet-stream'); r.end(fs.readFileSync(f)); }).listen(8766);

const R = []; const t = (n, c, info) => R.push([n, !!c, info]);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true, serviceWorkers: 'block', viewport: { width: 1300, height: 900 } });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  pg.on('dialog', d => d.accept());
  const enviados = []; let nSecoes = 0;
  await pg.route('https://generativelanguage.googleapis.com/**', async r => {
    const H = { 'access-control-allow-origin': '*' };
    if (r.request().method() === 'GET') return r.fulfill({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify({ models: [{ name: 'models/gemini-4-hydrogen', supportedGenerationMethods: ['generateContent'] }] }) });
    const body = r.request().postData(); enviados.push(body);
    const sys = JSON.parse(body).systemInstruction.parts[0].text;
    let txt;
    if (/organiza anamneses/.test(sys)) txt = JSON.stringify({ desenvolvimento: 'Marcos motores dentro do esperado; fala com atraso leve.', escolar: 'Dificuldade de atenção em sala desde o 1º ano.', medicacao: '', queixas: ['atencao', 'executivo'], motivo: 'Investigação de desatenção' });
    else if (/frase curta/.test(sys)) txt = 'Conexão funcionando.';
    else { nSecoes++; txt = `### Subtítulo de teste\nParágrafo redigido pela IA para a seção, com dados do caso. A paciente apresentou desempenho compatível com os achados registrados (Fuentes, s.d.).\n- item de lista`; }
    await r.fulfill({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify({ candidates: [{ content: { parts: [{ text: 'pensamento', thought: true }, { text: txt }] }, finishReason: 'STOP' }] }) });
  });
  await pg.goto('http://localhost:8766/');

  // Configurações: reconhecimento da chave e teste de conexão
  await pg.click('#nav-config');
  await pg.fill('#c-key', 'nvapi-abc'); t('chave nvapi reconhecida como NVIDIA', (await pg.inputValue('#c-prov')) === 'nvidia');
  await pg.fill('#c-key', 'AIzaTESTE123'); t('chave AIza reconhecida como Gemini', (await pg.inputValue('#c-prov')) === 'gemini');
  await pg.fill('#c-prof', 'Thiago Carvalho'); await pg.fill('#c-crp', '05/63586');
  await pg.click('#testar'); await pg.waitForSelector('#teste-out:has-text("Funcionando")', { timeout: 8000 }).catch(() => {});
  t('Testar conexão funciona', (await pg.textContent('#teste-out') || '').includes('✓ Funcionando'), await pg.textContent('#teste-out'));

  // Paciente
  await pg.click('nav >> text=Pacientes'); await pg.click('#novo-paciente');
  await pg.fill('#p-nome', 'Maria Eduarda Fontes'); await pg.fill('#p-nasc', '2016-03-10'); await pg.selectOption('.cartao.destaque select >> nth=0', 'Feminino'); await pg.fill('#p-esc', '4º ano do Ensino Fundamental');
  await pg.click('#salvar-paciente'); await pg.click('text=+ Avaliação');
  t('avaliação aberta com idade calculada', (await pg.textContent('.pac-resumo')).includes('ano(s)'));

  // 1 Demanda
  await pg.fill('#d-motivo', 'Encaminhada pela escola por desatenção.');
  await pg.click('.chip:has-text("Atenção")'); await pg.click('.chip:has-text("Memória e aprendizagem")');
  // 2 História — com nome e telefone no texto para testar a anonimização
  await pg.click('#etapa-1');
  await pg.fill('#h-bruta', 'Maria Eduarda tem 9 anos. A mãe, Joana Fontes, telefone (22) 99876-5432, e-mail joana@exemplo.com, relata que Maria se distrai muito.');
  await pg.click('#organizar'); await pg.waitForFunction(() => document.querySelectorAll('textarea')[1] && document.querySelectorAll('textarea')[1].value.length > 0, null, { timeout: 8000 }).catch(() => {});
  const org = enviados.find(x => /organiza anamneses/.test(x)) || '';
  t('anamnese organizada nos campos', (await pg.inputValue('textarea >> nth=1')).includes('Marcos motores'));
  t('IA não recebeu nome, telefone nem e-mail', org && !/Maria|Eduarda|Joana|Fontes|99876|joana@/.test(org), org.slice(0, 300));
  // 3 Observação
  await pg.click('#etapa-2'); await pg.selectOption('#o-esforco', 'adequado'); await pg.click('.chip:has-text("fadiga")');
  // 4 Instrumentos
  await pg.click('#etapa-3');
  await pg.selectOption('#cat-sel', 'bpa'); await pg.click('#add-inst');
  await pg.selectOption('#cat-sel', 'wisc'); await pg.click('#add-inst');
  await pg.selectOption('#cat-sel', 'tde'); await pg.click('#add-inst');
  const cards = pg.locator('.painel .cartao');
  t('alerta de SATEPSI pendente aparece', (await pg.textContent('.painel')).includes('VERIFICAÇÃO SATEPSI PENDENTE'));
  await cards.nth(0).locator('select').nth(1).selectOption('Favorável'); await cards.nth(0).locator('select').nth(2).selectOption('sim');
  await cards.nth(1).locator('select').nth(1).selectOption('Favorável'); await cards.nth(1).locator('select').nth(2).selectOption('sim');
  await cards.nth(2).locator('select').nth(1).selectOption('Desfavorável');
  t('alerta vermelho de desfavorável com modelo do protocolo', (await pg.textContent('.painel')).includes('constava no SATEPSI como Desfavorável'));
  // 5 Resultados
  await pg.click('#etapa-4');
  const tab = i => pg.locator('table.medidas').nth(i);
  const preencher = async (ti, row, col, v) => tab(ti).locator('tbody tr').nth(row).locator('td').nth(col).locator('input').first().fill(String(v));
  await preencher(0, 0, 4, 5); await preencher(0, 1, 4, 3); await preencher(0, 2, 4, 40); await preencher(0, 3, 4, 8);   // BPA percentis
  await preencher(1, 0, 4, 92); await preencher(1, 1, 4, 104); await preencher(1, 2, 4, 100); await preencher(1, 3, 4, 76); await preencher(1, 3, 5, 70); await preencher(1, 4, 4, 80); // WISC
  await preencher(2, 0, 4, 2); // TDE (desfavorável)
  t('leitura "Abaixo do esperado" aparece na linha', (await tab(0).locator('tbody tr').nth(0).textContent()).includes('Abaixo do esperado'));
  t('percentil incoerente sinalizado', (await tab(1).locator('tbody tr').nth(3).textContent()).includes('conferir percentil'));
  // 6 Raciocínio
  await pg.click('#etapa-5');
  const rac = await pg.textContent('.painel');
  t('Atenção: comprometimento demonstrado e convergente', /Atenção\d*comprometimento demonstrado.*convergente/.test(rac.replace(/\s+/g, '')) || (rac.includes('comprometimento demonstrado') && rac.includes('convergente')));
  t('Memória: lacuna (queixa não avaliada)', rac.includes('lacuna: queixa não avaliada'));
  t('TDE desfavorável fora da integração', rac.includes('instrumento sem parecer favorável'));
  t('perfil (gráfico) desenhado', await pg.locator('.perfil svg circle').count() >= 5);
  t('discrepância entre índices detectada', rac.includes('Discrepância'));
  // 7 Hipóteses
  await pg.click('#etapa-6'); await pg.selectOption('#hip-sel', 'tdah'); await pg.click('#add-hip');
  const ests = pg.locator('table.criterios tr');
  for (let i = 0; i < 5; i++) await ests.nth(i).locator('button.est.ok').click();
  for (const f of ['História do desenvolvimento', 'Sintomas clinicamente demonstrados', 'Prejuízo funcional']) await pg.click(`.chip:has-text("${f}")`);
  t('TDAH: grau "Fortemente sustentada"', (await pg.textContent('.painel .cartao .selo')).includes('Fortemente sustentada'), await pg.textContent('.painel .cartao .selo'));
  t('fonte "Resultados neuropsicológicos" marcada automaticamente', (await pg.textContent('.painel')).includes('Resultados neuropsicológicos (auto)'));
  // 8 Laudo
  await pg.click('#etapa-7');
  await pg.locator('label.ref input').nth(1).check();
  await pg.click('#gerar-laudo');
  await pg.waitForFunction(() => !document.querySelector('#gerar-laudo')?.hasAttribute('disabled') && !document.querySelector('.progresso'), null, { timeout: 30000 }).catch(() => {});
  const secs = await pg.locator('.secao textarea').evaluateAll(ts => ts.filter(t => t.value.length > 20).length);
  t('todas as seções narrativas redigidas', secs === 16, secs);
  t('resultados redigidos por domínio (várias chamadas)', nSecoes >= 18, nSecoes);
  const laudoReqs = enviados.filter(x => !/organiza anamneses|frase curta/.test(x));
  t('nenhum pedido do laudo contém nome/contatos', laudoReqs.every(x => !/Maria|Eduarda|Joana|99876|joana@/.test(x)));
  t('pedidos do laudo levam as regras do prompt-mestre', laudoReqs.every(x => /FIDELIDADE/.test(x) && /SATEPSI/.test(x)));
  t('IA recebe a hipótese com grau calculado', laudoReqs.some(x => x.includes('Fortemente sustentada')));
  const dl = pg.waitForEvent('download', { timeout: 20000 }).catch(() => null);
  await pg.click('#exportar-docx'); const d = await dl;
  const f = path.join(OUT, 'laudo-teste.docx'); if (d) await d.saveAs(f);
  t('laudo .docx baixado', d && fs.statSync(f).size > 8000, d && d.suggestedFilename());
  // Persistência
  await pg.waitForTimeout(800); await pg.reload(); await pg.waitForSelector('.nome-pac', { timeout: 8000 }).catch(async () => console.log('TELA APÓS RELOAD:', (await pg.textContent('body')).slice(0, 300)));
  t('dados persistem após recarregar', (await pg.textContent('main')).includes('Maria Eduarda Fontes'));
  t('sem erros no console', errs.length === 0, errs.join(' | '));
  for (const [n, ok, info] of R) console.log((ok ? 'OK     ' : 'FALHOU ') + n + (info !== undefined && !ok ? '  — ' + String(typeof info === 'string' ? info : JSON.stringify(info)).slice(0, 300) : ''));
  console.log(`${R.filter(x => x[1]).length}/${R.length}`);
  await b.close(); srv.close(); process.exit(R.every(x => x[1]) ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
