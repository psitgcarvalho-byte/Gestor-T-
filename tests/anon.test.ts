import { anonimizar } from '../src/laudo';
let ok = 0, bad = 0; const t = (n: string, got: string, exp: string) => { if (got === exp) ok++; else { bad++; console.log('FALHOU', n, '\n  obtido:  ', got, '\n  esperado:', exp); } };
const pac: any = { nome: 'Maria Eduarda Fontes', responsaveis: '' };
t('caso do teste', anonimizar('Maria Eduarda tem 9 anos. A mãe, Joana Fontes, telefone (22) 99876-5432, e-mail joana@exemplo.com, relata que Maria se distrai muito.', pac, 'a paciente'),
  'a paciente tem 9 anos. A mãe, [familiar], telefone [telefone], e-mail [e-mail], relata que a paciente se distrai muito.');
t('nome completo', anonimizar('Maria Eduarda Fontes compareceu.', pac, 'a paciente'), 'a paciente compareceu.');
t('com conectivo', anonimizar('João da Silva relata.', { nome: 'João da Silva' } as any, 'o paciente'), 'o paciente relata.');
t('pai com sobrenome composto', anonimizar('O pai, Carlos Alberto Fontes, trabalha.', pac, 'a paciente'), 'O pai, [familiar], trabalha.');
t('responsável cadastrado', anonimizar('Ana Paula acompanha.', { nome: 'Pedro Lima', responsaveis: 'Ana Paula Souza' } as any, 'o paciente'), '[responsável] acompanha.');
t('não mexe em termos clínicos', anonimizar('Atenção concentrada no BPA-2 percentil 5; WISC QI 92.', pac, 'a paciente'), 'Atenção concentrada no BPA-2 percentil 5; WISC QI 92.');
t('CPF', anonimizar('CPF 123.456.789-09.', pac, 'a paciente'), 'CPF [CPF].');
t('nome em minúsculas', anonimizar('maria chegou cedo', pac, 'a paciente'), 'a paciente chegou cedo');
t('palavra que contém o nome não é trocada', anonimizar('Mariana, colega de sala.', pac, 'a paciente'), 'Mariana, colega de sala.');
console.log(`${ok} ok, ${bad} falhas`);
process.exit(bad ? 1 : 0);
