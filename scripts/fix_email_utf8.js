const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'services', 'emailService.js');

console.log('🔧 Corrigindo encoding do emailService.js...');

// Ler arquivo
let content = fs.readFileSync(filePath, 'utf8');

// Mapa de substituições
const replacements = {
  // Palavras comuns
  'InformaÃ§Ãµes': 'Informações',
  'AprovaÃ§Ã£o': 'Aprovação',
  'aprovaÃ§Ã£o': 'aprovação',
  'notificaÃ§Ã£o': 'notificação',
  'CÃ³digo': 'Código',
  'PrÃ³ximos': 'Próximos',
  'NÃ£o': 'Não',
  'nÃ£o': 'não',
  'CrÃ©dito': 'Crédito',
  'crÃ©dito': 'crédito',
  'GestÃ£o': 'Gestão',
  'AÃ§Ã£o': 'Ação',
  'NecessÃ¡ria': 'Necessária',
  'NECESSÃRIA': 'NECESSÁRIA',
  'PendÃªncia': 'Pendência',
  'Ã"timas': 'Ótimas',
  'notÃ­cias': 'notícias',
  'Â©': '©',
  
  // Status
  'APROVAÃ‡ÃƒO': 'APROVAÇÃO',
  
  // Emojis - substituir caracteres corrompidos
  'ðŸ"§': '📧',
  'ðŸ›'': '🛒',
  'ðŸ"‹': '📋',
  'ðŸ¢': '🏢',
  'ðŸ"…': '📅',
  'ðŸ'°': '💰',
  'ðŸ"Š': '📊',
  'ðŸ›ï¸': '🛍️',
  'â³': '⏳',
  'âš ï¸': '⚠️',
  'âœ…': '✅',
  'âŒ': '❌',
  'ðŸŽ¯': '🎯',
  'ðŸ'¨â€ðŸ'¼': '👨‍💼',
  'ðŸŽ‰': '🎉',
  'ðŸ'¤': '👤',
  'â„¹ï¸': 'ℹ️',
  'â€¢': '•'
};

// Aplicar substituições
let changes = 0;
for (const [wrong, correct] of Object.entries(replacements)) {
  const regex = new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matches = (content.match(regex) || []).length;
  if (matches > 0) {
    content = content.replace(regex, correct);
    changes += matches;
    console.log(`   ✓ Substituído "${wrong}" -> "${correct}" (${matches}x)`);
  }
}

// Salvar arquivo com UTF-8
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✅ Arquivo corrigido com sucesso!`);
console.log(`📊 Total de correções: ${changes}`);
console.log(`📁 Arquivo: ${filePath}`);
