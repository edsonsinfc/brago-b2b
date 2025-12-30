const fs = require('fs');
const path = require('path');

const arquivo = path.join(__dirname, '..', 'src', 'services', 'emailService.js');
let conteudo = fs.readFileSync(arquivo, 'utf-8');

console.log('🧹 Limpando TODOS os caracteres especiais...\n');

// Mapa de substituições específicas
const substituicoes = {
  // Emojis e símbolos
  '📋': '',
  '👥': '',
  '📅': '',
  '💰': '',
  '📊': '',
  '🔢': '',
  '🏢': '',
  '🛒': '',
  '⚠️': '',
  '⚠': '',
  '⏳': '',
  '✅': '',
  '❌': '',
  '📧': '',
  '🚀': '',
  '⚙️': '',
  '⚙': '',
  
  // Palavras com acento
  'Informações': 'Informacoes',
  'informações': 'informacoes',
  'Código': 'Codigo',
  'código': 'codigo',
  'Não': 'Nao',
  'não': 'nao',
  'Aprovação': 'Aprovacao',
  'aprovação': 'aprovacao',
  'APROVAÇÃO': 'APROVACAO',
  'Atenção': 'Atencao',
  'atenção': 'atencao',
  'configurado': 'configurado',
  'destinatário': 'destinatario',
  'histórico': 'historico',
  'Histórico': 'Historico',
  'última': 'ultima',
  'últimas': 'ultimas',
  'já': 'ja',
  'está': 'esta',
  'Gestão': 'Gestao',
  'gestão': 'gestao',
  'Pendência': 'Pendencia',
  'pendência': 'pendencia',
  'crítico': 'critico',
  'Crítico': 'Critico',
  'Até': 'Ate',
  'até': 'ate',
  'próprio': 'proprio',
  'Próprio': 'Proprio',
  'Situação': 'Situacao',
  'situação': 'situacao',
  'automáticamente': 'automaticamente',
  'Verificação': 'Verificacao',
  'verificação': 'verificacao',
  'Análise': 'Analise',
  'análise': 'analise',
  'padrão': 'padrao',
  'Padrão': 'Padrao'
};

let mudancas = 0;

// Aplicar cada substituição
for (const [procurar, substituir] of Object.entries(substituicoes)) {
  const regex = new RegExp(procurar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const novoConteudo = conteudo.replace(regex, substituir);
  
  if (novoConteudo !== conteudo) {
    const ocorrencias = (conteudo.match(regex) || []).length;
    console.log(`✓ "${procurar}" → "${substituir}" (${ocorrencias}x)`);
    mudancas += ocorrencias;
    conteudo = novoConteudo;
  }
}

// Salvar
fs.writeFileSync(arquivo, conteudo, 'utf-8');

console.log(`\n✅ ${mudancas} substituições realizadas!`);
console.log(`📄 ${arquivo}`);
