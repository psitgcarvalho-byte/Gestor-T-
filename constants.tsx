
import { Patient, PatientStatus, Session, SessionType, NeuroTest, TestResult } from './types';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    name: 'João Silva',
    birthDate: '1995-05-15',
    email: 'joao.silva@email.com',
    phone: '(11) 98765-4321',
    status: PatientStatus.ACTIVE,
    referralSource: 'Neurologist Dr. Smith',
    anamnesis: 'Paciente relata dificuldade de concentração e lapsos de memória frequentes nos últimos 6 meses. Histórico de ansiedade leve.',
    createdAt: '2023-10-01'
  },
  {
    id: '2',
    name: 'Maria Oliveira',
    birthDate: '2010-08-22',
    email: 'maria.parents@email.com',
    phone: '(11) 91234-5678',
    status: PatientStatus.WAITING,
    referralSource: 'School Teacher',
    anamnesis: 'Dificuldades de leitura e ansiedade social no ambiente escolar. Suspeita de TDAH.',
    createdAt: '2023-11-15'
  }
];

export const MOCK_TESTS: NeuroTest[] = [
  // 1. Inteligência e Cognição Geral
  { id: 'wais4', name: 'WAIS-IV', domain: 'Inteligência (Adultos)', description: 'Escala de Inteligência Wechsler para Adultos. Padrão-ouro para avaliação intelectual.' },
  { id: 'wisc5', name: 'WISC-V', domain: 'Inteligência (Crianças)', description: 'Escala de Inteligência Wechsler para Crianças.' },
  { id: 'wppsi4', name: 'WPPSI-IV', domain: 'Inteligência (Pré-Escolares)', description: 'Avaliação de inteligência para crianças de 2 anos e 6 meses a 7 anos e 7 meses.' },
  { id: 'raven', name: 'Matrizes Progressivas de Raven', domain: 'Inteligência', description: 'Avaliação do fator g de inteligência e raciocínio abstrato.' },
  { id: 'son-r', name: 'SON-R', domain: 'Inteligência Não Verbal', description: 'Teste de inteligência não verbal, ideal para casos com dificuldades de linguagem.' },

  // 2. Atenção e Funções Executivas
  { id: 'stroop', name: 'Stroop Test', domain: 'Funções Executivas', description: 'Avalia atenção seletiva, controle inibitório e flexibilidade cognitiva.' },
  { id: 'wcst', name: 'Wisconsin Card Sorting Test (WCST)', domain: 'Funções Executivas', description: 'Avalia flexibilidade cognitiva e formação de conceitos.' },
  { id: 'tmt', name: 'Trail Making Test (TMT A e B)', domain: 'Atenção / Executivo', description: 'Avalia busca visual, velocidade de processamento e alternância atencional.' },
  { id: 'ac', name: 'Teste de Atenção Concentrada (AC)', domain: 'Atenção', description: 'Avalia a capacidade de manter o foco sob pressão.' },
  { id: 'cpt', name: 'CPT (Continuous Performance Test)', domain: 'Atenção Sustentada', description: 'Avaliação computadorizada de atenção e impulsividade.' },

  // 3. Memória
  { id: 'wms4', name: 'WMS-IV', domain: 'Memória', description: 'Wechsler Memory Scale para avaliação detalhada de diversos sistemas de memória.' },
  { id: 'rey-figure', name: 'Figura Complexa de Rey', domain: 'Memória Visual / Visuoconstrução', description: 'Avalia percepção visual, organização e memória de curto/longo prazo.' },
  { id: 'ravlt', name: 'RAVLT', domain: 'Memória Auditivo-Verbal', description: 'Rey Auditory Verbal Learning Test. Avalia aprendizagem e memória verbal.' },
  { id: 'benton', name: 'Memória Visual de Benton', domain: 'Memória Visual', description: 'Avalia percepção visual e memória visual imediata.' },

  // 4. Linguagem
  { id: 'boston', name: 'Boston Naming Test', domain: 'Linguagem', description: 'Avalia a capacidade de nomeação por confronto visual.' },
  { id: 'fluencia', name: 'Fluência Verbal (FAS / Animais)', domain: 'Linguagem / Executivo', description: 'Avalia evocação lexical por critérios fonêmicos e semânticos.' },
  { id: 'token', name: 'Token Test', domain: 'Linguagem (Compreensão)', description: 'Avalia compreensão de comandos verbais com complexidade crescente.' },

  // 5. Habilidades Visuoespaciais
  { id: 'kohs', name: 'Cubos de Kohs', domain: 'Visuoespacial', description: 'Avalia organização espacial e raciocínio lógico-visual.' },
  { id: 'bender2', name: 'Bender-II', domain: 'Visuomotor', description: 'Teste Gestáltico Visuomotor de Bender para avaliação de maturação e sinais neurológicos.' },
  { id: 'hooper', name: 'Hooper Visual Organization Test', domain: 'Visuopercepção', description: 'Avalia a integração e organização de estímulos visuais fragmentados.' },

  // 6. Funções Emocionais e Psicopatologia
  { id: 'bdi2', name: 'BDI-II', domain: 'Emocional (Depressão)', description: 'Inventário de Depressão de Beck para avaliação de intensidade de sintomas depressivos.' },
  { id: 'bai', name: 'BAI', domain: 'Emocional (Ansiedade)', description: 'Inventário de Ansiedade de Beck.' },
  { id: 'hads', name: 'HADS', domain: 'Emocional (Hosp. Ansiedade/Depr)', description: 'Escala Hospitalar de Ansiedade e Depressão.' },
  { id: 'mmpi2', name: 'MMPI-2 / MMPI-2-RF', domain: 'Psicopatologia', description: 'Inventário Multifásico de Personalidade Minnesota.' },

  // 7. Desenvolvimento, Autismo e Comportamento
  { id: 'srs2', name: 'SRS-2', domain: 'Responsividade Social', description: 'Escala de Responsividade Social para triagem de TEA.' },
  { id: 'cbcl', name: 'CBCL (Child Behavior Checklist)', domain: 'Comportamento Infantil', description: 'Inventário de comportamentos para crianças e adolescentes.' },
  { id: 'vineland3', name: 'Vineland-3', domain: 'Comportamento Adaptativo', description: 'Escalas de Comportamento Adaptativo para avaliação de autonomia.' },
  { id: 'snap4', name: 'SNAP-IV', domain: 'Comportamento (TDAH)', description: 'Questionário para avaliação de sintomas de TDAH e Oposicionismo.' },
  { id: 'ados2', name: 'ADOS-2', domain: 'TEA (Observação)', description: 'Protocolo de observação para diagnóstico de autismo.' },

  // 8. Triagem Cognitiva
  { id: 'mmse', name: 'Mini-Mental State Examination (MMSE)', domain: 'Triagem Cognitiva', description: 'Mini-Exame do Estado Mental para rastreio rápido.' },
  { id: 'moca', name: 'MoCA', domain: 'Triagem Cognitiva', description: 'Montreal Cognitive Assessment, sensível para comprometimento cognitivo leve.' },
  { id: 'ace3', name: 'ACE-III', domain: 'Triagem Cognitiva', description: 'Addenbrooke’s Cognitive Examination - versão III.' },
  
  // Extra
  { id: 'fdt', name: 'FDT (Teste dos Cinco Dígitos)', domain: 'Velocidade de Processamento', description: 'Avalia velocidade cognitiva, flexibilidade e controle inibitório.' },
];

export const MOCK_RESULTS: TestResult[] = [
  { id: 'r1', patientId: '1', testId: 'stroop', rawScore: 45, standardScore: 105, percentile: 63, date: '2023-12-01', observations: 'Hesitação leve na condição de interferência.' },
  { id: 'r2', patientId: '1', testId: 'fdt', rawScore: 30, standardScore: 112, percentile: 79, date: '2023-12-05', observations: 'Respostas rápidas, bom controle motor.' }
];

export const MOCK_SESSIONS: Session[] = [
  {
    id: 's1',
    patientId: '1',
    professionalId: 'p1',
    dateTime: '2024-05-20T10:00:00',
    type: SessionType.EVALUATION,
    durationMinutes: 60,
    notes: 'Continuar administração do Stroop.',
    status: 'scheduled'
  },
  {
    id: 's2',
    patientId: '2',
    professionalId: 'p1',
    dateTime: '2024-05-21T14:30:00',
    type: SessionType.ANAMNESIS,
    durationMinutes: 90,
    notes: 'Entrevista inicial com os responsáveis.',
    status: 'confirmed'
  }
];
