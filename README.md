# T-Gestor 2.0

Avaliação neuropsicológica com **raciocínio clínico estruturado**, seguindo o protocolo do Prompt-Mestre de Avaliação Neuropsicológica (Thiago Carvalho, CRP 05/63586).

**Usar:** https://psitgcarvalho-byte.github.io/Gestor-T-/ (no Chrome do PC, clique em “instalar” na barra de endereço para tê-lo como programa).

## Fluxo
Pacientes → **Avaliação em 8 etapas** → Laudo em Word.

1. **Demanda** — motivo, objetivo e queixas por domínio.
2. **História** — cole ou importe a anamnese (.docx, .pdf, .txt); a IA pode organizá-la nos campos (anonimizada, com prévia do texto enviado).
3. **Observação** — comportamento e validade do desempenho (esforço, fatores interferentes).
4. **Instrumentos e SATEPSI** — status, data da consulta, faixa normativa e compatibilidade de cada instrumento. Não há status pré-preenchido: a consulta é sua, a cada avaliação (§2.4).
5. **Resultados** — cada medida/subteste com o tipo de escore (composto, ponderado, T, z, percentil, bruto ou só classificação). A IA pode transcrever escores de fotos/PDF de protocolos, com revisão linha a linha.
6. **Raciocínio** — calculado automaticamente, sem IA.
7. **Hipóteses** — critérios do DSM-5-TR (paráfrase), fontes de evidência e grau de sustentação.
8. **Laudo** — redação por seção com IA, auditoria e exportação .docx.

## O motor de raciocínio (etapas do protocolo)
- **Etapa 0 — Consistência:** idade/escolaridade ausentes, medidas sem dado ou sem instrumento, duplicidades, escore × percentil incoerentes, escore bruto sem norma, validade não registrada, medicação a explicar.
- **§2.4 — SATEPSI:** instrumentos não verificados, desfavoráveis, não localizados ou incompatíveis ficam **fora da integração** e geram, no laudo, o alerta em vermelho com o texto-modelo do protocolo. Instrumentos não privativos recebem a ressalva própria.
- **§2.3 — Escores:** percentis e classificações do examinador são **preservados**; o app só calcula uma equivalência interna (z) para comparar medidas entre si, nunca para substituir a tabela do manual.
- **Etapas 5–7 — Medidas, domínios e análise intraindividual:** nível normativo de cada medida; domínio com “comprometimento demonstrado” só com duas ou mais medidas convergentes (uma só = “achado isolado”); recursos e fragilidades relativas à média do próprio paciente; discrepância entre índices compostos.
- **Etapa 10 — Convergências e divergências:** cruza cada queixa com testes e escalas (convergente, parcial, queixa sem confirmação, achado sem queixa, lacuna).
- **Etapas 11–16 — Hipóteses:** TDAH, TEA, Deficiência Intelectual, Transtorno Específico da Aprendizagem, TNC leve e maior (ou hipótese livre). Indicadores quantitativos sugeridos por critério; fontes ponderadas pela hierarquia de evidências do §6; grau de sustentação (Fortemente / Moderadamente / Parcialmente / A investigar / Pouco sustentada) com justificativa; hierarquização. O grau final é sempre do profissional.
- **Etapa 19 — Auditoria:** SATEPSI datado, hipóteses de fonte única, prejuízo funcional da hipótese principal, referências, proporção de citações diretas (mínimo 5%).

## Laudo
Estrutura do §4. Identificação, tabelas de instrumentos e resultados, alertas SATEPSI, figura do perfil, referências (ABNT) e assinatura são montados pelo app; as seções narrativas são redigidas pela IA com as regras do protocolo (fidelidade, níveis de análise, prudência). A IA **só cita referências marcadas** e **só faz citação direta do banco de citações** que você conferiu na fonte.

## Privacidade
- Dados ficam **somente no navegador** (IndexedDB). Faça backup (.json) regularmente.
- A IA nunca recebe nome, familiares com o mesmo sobrenome, responsáveis cadastrados, telefone, e-mail ou CPF. Dados clínicos anonimizados são enviados ao serviço escolhido: informe isso no termo de consentimento (LGPD).
- Chave de IA de qualquer serviço (Gemini grátis recomendado), guardada só no navegador.

## Desenvolvimento
`npm install` · `npm test` (motor, anonimização e tipos) · `npm run build` (gera `dist/`) · `node tests/e2e.cjs` (fluxo completo no navegador; requer Playwright).
O código anterior (protótipo do AI Studio) está preservado na tag `v1-ai-studio`.
