// Biblioteca de hipóteses. Critérios em PARÁFRASE dos critérios essenciais do DSM-5-TR (conferir sempre no manual).
// Nenhum padrão cognitivo isolado confirma diagnóstico: os domínios "associados" apenas contextualizam (Etapa 11).

export interface Criterio { id: string; texto: string; essencial: boolean; auto?: 'ql-intelecto' | 'ql-academico' | 'tnc-leve' | 'tnc-maior' }
export interface HipoteseDef {
  id: string;
  nome: string;
  criterios: Criterio[];
  dominiosAssociados: string[];
  dadosNecessarios: string[];
  observacao?: string;
}

// Fontes de evidência em ordem de prioridade (§6 do prompt-mestre)
export const FONTES: { id: string; nome: string; peso: number }[] = [
  { id: 'desenvolvimento', nome: 'História do desenvolvimento', peso: 8 },
  { id: 'sintomas', nome: 'Sintomas clinicamente demonstrados', peso: 7 },
  { id: 'testes', nome: 'Resultados neuropsicológicos', peso: 6 },
  { id: 'comportamento', nome: 'Informações comportamentais / observação', peso: 5 },
  { id: 'escalas', nome: 'Escalas e questionários', peso: 4 },
  { id: 'prejuizo', nome: 'Prejuízo funcional', peso: 3 },
  { id: 'persistencia', nome: 'Persistência dos sintomas', peso: 2 },
  { id: 'contextos', nome: 'Presença em contextos relevantes', peso: 1 }
];
export const PESO_TOTAL = FONTES.reduce((a, f) => a + f.peso, 0);

export const HIPOTESES: HipoteseDef[] = [
  {
    id: 'tdah', nome: 'Transtorno de Déficit de Atenção/Hiperatividade (TDAH)',
    criterios: [
      { id: 'a', essencial: true, texto: 'Padrão persistente de desatenção e/ou hiperatividade-impulsividade: 6 ou mais sintomas em ao menos uma dimensão (5 ou mais a partir dos 17 anos), por pelo menos 6 meses, incompatível com o nível de desenvolvimento.' },
      { id: 'b', essencial: true, texto: 'Vários sintomas presentes antes dos 12 anos de idade.' },
      { id: 'c', essencial: true, texto: 'Vários sintomas presentes em dois ou mais contextos (ex.: casa, escola ou trabalho, relações sociais).' },
      { id: 'd', essencial: true, texto: 'Evidência clara de que os sintomas interferem no funcionamento social, acadêmico ou ocupacional, ou reduzem sua qualidade.' },
      { id: 'e', essencial: true, texto: 'Os sintomas não ocorrem exclusivamente durante esquizofrenia ou outro transtorno psicótico e não são mais bem explicados por outro transtorno mental.' }
    ],
    dominiosAssociados: ['atencao', 'executivo', 'mop', 'velocidade'],
    dadosNecessarios: ['Relato de sintomas por pelo menos dois informantes ou contextos', 'História do desenvolvimento com início dos sintomas', 'Escala de sintomas aplicada a informantes', 'Investigação de condições que mimetizam (sono, ansiedade, humor, uso de substâncias, medicação)']
  },
  {
    id: 'tea', nome: 'Transtorno do Espectro Autista (TEA)',
    criterios: [
      { id: 'a', essencial: true, texto: 'Déficits persistentes na comunicação e na interação social em múltiplos contextos, nos três aspectos: reciprocidade socioemocional; comportamentos comunicativos não verbais; desenvolver, manter e compreender relacionamentos.' },
      { id: 'b', essencial: true, texto: 'Padrões restritos e repetitivos de comportamento, interesses ou atividades: pelo menos 2 de 4 (estereotipias motoras/fala/uso de objetos; insistência na mesmice e rotinas; interesses restritos e fixos anormais em intensidade ou foco; hiper ou hiporreatividade sensorial).' },
      { id: 'c', essencial: true, texto: 'Sintomas presentes no período inicial do desenvolvimento (podem manifestar-se plenamente só quando as demandas sociais excedem as capacidades).' },
      { id: 'd', essencial: true, texto: 'Os sintomas causam prejuízo clinicamente significativo no funcionamento social, profissional ou em outras áreas importantes.' },
      { id: 'e', essencial: true, texto: 'As alterações não são mais bem explicadas por deficiência intelectual ou atraso global do desenvolvimento.' }
    ],
    dominiosAssociados: ['social', 'linguagem', 'executivo'],
    dadosNecessarios: ['História detalhada do desenvolvimento precoce (social, linguagem, brincadeira)', 'Observação clínica estruturada da interação', 'Relato de informantes em mais de um contexto', 'Avaliação de funcionamento intelectual e adaptativo para o critério E']
  },
  {
    id: 'tdi', nome: 'Transtorno do Desenvolvimento Intelectual (Deficiência Intelectual)',
    criterios: [
      { id: 'a', essencial: true, auto: 'ql-intelecto', texto: 'Déficits em funções intelectuais (raciocínio, resolução de problemas, planejamento, pensamento abstrato, julgamento, aprendizagem) confirmados por avaliação clínica e teste de inteligência padronizado e individual (em geral cerca de 2 desvios-padrão abaixo da média, considerando o erro de medida).' },
      { id: 'b', essencial: true, texto: 'Déficits em funcionamento adaptativo (domínios conceitual, social e prático) que impedem atingir padrões de desenvolvimento e socioculturais de independência e responsabilidade social, limitando atividades diárias em múltiplos ambientes.' },
      { id: 'c', essencial: true, texto: 'Início dos déficits intelectuais e adaptativos durante o período do desenvolvimento.' }
    ],
    dominiosAssociados: ['intelecto', 'adaptativo'],
    dadosNecessarios: ['Escala padronizada de comportamento adaptativo', 'História do desenvolvimento', 'Verificação da validade da medida intelectual (cooperação, condições sensoriais, linguagem, cultura)'],
    observacao: 'QI reduzido isolado não basta (Etapa 11): diferencie rebaixamento observado, funcionamento intelectual limítrofe e Deficiência Intelectual, sempre com o funcionamento adaptativo.'
  },
  {
    id: 'teap', nome: 'Transtorno Específico da Aprendizagem',
    criterios: [
      { id: 'a', essencial: true, texto: 'Dificuldades na aprendizagem e no uso de habilidades acadêmicas (leitura, compreensão, ortografia, expressão escrita, senso numérico/cálculo ou raciocínio matemático), persistindo por pelo menos 6 meses apesar de intervenções dirigidas.' },
      { id: 'b', essencial: true, auto: 'ql-academico', texto: 'Habilidades acadêmicas afetadas substancial e quantificavelmente abaixo do esperado para a idade, confirmadas por testes padronizados individuais e avaliação clínica, interferindo significativamente no desempenho escolar, profissional ou cotidiano.' },
      { id: 'c', essencial: true, texto: 'Início durante os anos escolares (podem manifestar-se plenamente só quando as demandas excedem as capacidades).' },
      { id: 'd', essencial: true, texto: 'Não mais bem explicadas por deficiência intelectual, acuidade visual ou auditiva não corrigida, outros transtornos mentais ou neurológicos, adversidade psicossocial, falta de proficiência na língua ou instrução inadequada.' }
    ],
    dominiosAssociados: ['academico', 'linguagem', 'mop', 'velocidade'],
    dadosNecessarios: ['Histórico escolar e das intervenções já realizadas (e por quanto tempo)', 'Testes padronizados de leitura, escrita e matemática', 'Exclusão de alterações sensoriais (visão, audição)', 'Medida intelectual para o critério D']
  },
  {
    id: 'tncleve', nome: 'Transtorno Neurocognitivo Leve',
    criterios: [
      { id: 'a', essencial: true, auto: 'tnc-leve', texto: 'Evidência de declínio cognitivo modesto em relação a um nível anterior, em um ou mais domínios, baseada em (1) preocupação do indivíduo, de informante ou do clínico e (2) prejuízo modesto documentado em teste padronizado (tipicamente entre 1 e 2 desvios-padrão abaixo da média).' },
      { id: 'b', essencial: true, texto: 'Os déficits não interferem na independência nas atividades cotidianas (podem exigir maior esforço, estratégias compensatórias ou acomodação).' },
      { id: 'c', essencial: true, texto: 'Os déficits não ocorrem exclusivamente no contexto de delirium.' },
      { id: 'd', essencial: true, texto: 'Os déficits não são mais bem explicados por outro transtorno mental (ex.: depressão maior, esquizofrenia).' }
    ],
    dominiosAssociados: ['memoria', 'atencao', 'executivo', 'linguagem', 'visuoespacial', 'velocidade'],
    dadosNecessarios: ['Evidência de declínio em relação ao nível prévio (escolaridade, ocupação, informante)', 'Avaliação das atividades instrumentais da vida diária', 'Rastreio de humor (depressão pode simular declínio)', 'Investigação médica (exames, medicação, sono)']
  },
  {
    id: 'tncmaior', nome: 'Transtorno Neurocognitivo Maior',
    criterios: [
      { id: 'a', essencial: true, auto: 'tnc-maior', texto: 'Evidência de declínio cognitivo significativo em relação a um nível anterior, em um ou mais domínios, baseada em (1) preocupação do indivíduo, de informante ou do clínico e (2) prejuízo substancial documentado em teste padronizado (tipicamente 2 desvios-padrão ou mais abaixo da média).' },
      { id: 'b', essencial: true, texto: 'Os déficits interferem na independência nas atividades cotidianas (no mínimo, exigem assistência em atividades instrumentais complexas).' },
      { id: 'c', essencial: true, texto: 'Os déficits não ocorrem exclusivamente no contexto de delirium.' },
      { id: 'd', essencial: true, texto: 'Os déficits não são mais bem explicados por outro transtorno mental (ex.: depressão maior, esquizofrenia).' }
    ],
    dominiosAssociados: ['memoria', 'atencao', 'executivo', 'linguagem', 'visuoespacial', 'velocidade'],
    dadosNecessarios: ['Evidência de declínio em relação ao nível prévio', 'Avaliação funcional das atividades da vida diária com informante', 'Rastreio de humor', 'Investigação médica e neurológica']
  }
];

export const NOME_STATUS: Record<string, string> = { ok: 'Atendido', nd: 'Não demonstrado', inv: 'A investigar', contra: 'Evidência contrária', '': 'Não avaliado' };
