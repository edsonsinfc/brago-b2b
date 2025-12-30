const fs = require('fs');
const path = require('path');

const arquivo = path.join(__dirname, '..', 'src', 'services', 'emailService.js');
let conteudo = fs.readFileSync(arquivo, 'utf-8');

console.log('🔧 Removendo emojis e corrigindo acentos...\n');

// Remover/substituir emojis corrompidos e normais
const substituicoes = [
  // Remover todos os caracteres não-ASCII problemáticos
  [/[^\x00-\x7F]+/g, function(match) {
    // Manter apenas alguns caracteres específicos (como à, é, ã, etc)
    if (/[àáâãäåèéêëìíîïòóôõöùúûüñç]/i.test(match)) {
      return match;
    }
    // Remover tudo que não for ASCII normal
    return '';
  }],
  
  // Substituir palavras com acentos por versões sem acento
  [/Informações/gi, 'Informacoes'],
  [/Código/gi, 'Codigo'],
  [/Não/g, 'Nao'],
  [/não/g, 'nao'],
  [/Aprovação/gi, 'Aprovacao'],
  [/Atenção/gi, 'Atencao'],
  [/ção/g, 'cao'],
  [/ções/g, 'coes'],
  [/configurado/g, 'configurado'],
  [/destinatário/g, 'destinatario'],
  [/histórico/gi, 'historico'],
  [/última/gi, 'ultima'],
  [/já/g, 'ja'],
  [/automáticamente/g, 'automaticamente'],
  [/automático/g, 'automatico'],
];

// Aplicar todas as substituições
substituicoes.forEach(([padrao, substituir]) => {
  const antes = conteudo.length;
  conteudo = conteudo.replace(padrao, substituir);
  const depois = conteudo.length;
  if (antes !== depois) {
    console.log(`✓ Substituído: ${padrao} → "${substituir}"`);
  }
});

// Salvar arquivo
fs.writeFileSync(arquivo, conteudo, 'utf-8');

console.log('\n✅ Arquivo atualizado com sucesso!');
console.log(`📄 ${arquivo}`);
