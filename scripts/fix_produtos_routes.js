const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/routes/produtos.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Atualizando rotas de produtos...\n');

// Substituir rotas POST/PUT/DELETE de mídias para usar requireAdmin
const replacements = [
  {
    old: /router\.(post|put|delete)\('\/:[^']+\/imagens/g,
    new: (match) => match.replace("async (req, res) => {", "requireAdmin, async (req, res) => {").replace(/router\.(post|put|delete)/, (m) => `router.${m.split('.')[1]}`)
  },
  {
    old: /router\.(post|put|delete)\('\/:[^']+\/videos/g,
    new: (match) => match.replace("async (req, res) => {", "requireAdmin, async (req, res) => {")
  },
  {
    old: /router\.(post|put|delete)\('\/:[^']+\/especificacoes/g,
    new: (match) => match.replace("async (req, res) => {", "requireAdmin, async (req, res) => {")
  }
];

// Remover verificações manuais de perfil !== 'gestor'
const linesToRemove = [
  `    if (req.user?.perfil !== 'gestor') {`,
  `      return res.status(403).json({ error: 'Acesso negado' });`,
  `    }`,
  `    `
];

// Remover as 4 linhas de verificação manual
let lines = content.split('\n');
let newLines = [];
let skipNext = 0;

for (let i = 0; i < lines.length; i++) {
  if (skipNext > 0) {
    skipNext--;
    continue;
  }
  
  // Se encontrar a verificação manual, pular as próximas 3 linhas
  if (lines[i].trim() === `if (req.user?.perfil !== 'gestor') {` &&
      i + 3 < lines.length &&
      lines[i+1].trim().includes('Acesso negado') &&
      lines[i+2].trim() === '}') {
    skipNext = 3; // Pular essa linha + próximas 3
    // Remover linha em branco extra se existir
    if (lines[i+3] && lines[i+3].trim() === '') {
      skipNext = 4;
    }
    continue;
  }
  
  newLines.push(lines[i]);
}

content = newLines.join('\n');

// Adicionar requireAdmin nos métodos de mídias que ainda não têm
const routes = [
  { pattern: /router\.post\('\/\:id\/imagens', async \(req, res\)/g, replacement: "router.post('/:id/imagens', requireAdmin, async (req, res)" },
  { pattern: /router\.delete\('\/\:id\/imagens\/\:imagemId', async \(req, res\)/g, replacement: "router.delete('/:id/imagens/:imagemId', requireAdmin, async (req, res)" },
  { pattern: /router\.put\('\/\:id\/imagens\/ordem', async \(req, res\)/g, replacement: "router.put('/:id/imagens/ordem', requireAdmin, async (req, res)" },
  { pattern: /router\.put\('\/\:id\/imagens\/\:imagemId\/principal', async \(req, res\)/g, replacement: "router.put('/:id/imagens/:imagemId/principal', requireAdmin, async (req, res)" },
  { pattern: /router\.post\('\/\:id\/videos', async \(req, res\)/g, replacement: "router.post('/:id/videos', requireAdmin, async (req, res)" },
  { pattern: /router\.delete\('\/\:id\/videos\/\:videoId', async \(req, res\)/g, replacement: "router.delete('/:id/videos/:videoId', requireAdmin, async (req, res)" },
  { pattern: /router\.post\('\/\:id\/especificacoes', async \(req, res\)/g, replacement: "router.post('/:id/especificacoes', requireAdmin, async (req, res)" },
  { pattern: /router\.put\('\/\:id\/especificacoes\/\:especId', async \(req, res\)/g, replacement: "router.put('/:id/especificacoes/:especId', requireAdmin, async (req, res)" },
  { pattern: /router\.delete\('\/\:id\/especificacoes\/\:especId', async \(req, res\)/g, replacement: "router.delete('/:id/especificacoes/:especId', requireAdmin, async (req, res)" }
];

routes.forEach(({ pattern, replacement }) => {
  if (pattern.test(content)) {
    content = content.replace(pattern, replacement);
    console.log(`✅ Adicionado requireAdmin em: ${replacement.split("'")[1]}`);
  }
});

// Salvar arquivo
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Arquivo atualizado com sucesso!');
console.log('   - Removidas verificações manuais de perfil');
console.log('   - Adicionado requireAdmin em todas rotas de gerenciamento de mídias');
