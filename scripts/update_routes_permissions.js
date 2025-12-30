const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../src/routes');
const files = ['equipes.js', 'pedidos.js', 'usuarios.js', 'notificacoes.js'];

console.log('🔧 Atualizando rotas para permitir acesso de ADMIN e GESTOR...\n');

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Arquivo não encontrado: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Substituir requireRole('gestor') por requireRole('admin', 'gestor')
  // Mas NÃO substituir quando já tem 'equipe' no requireRole
  const pattern1 = /requireRole\('gestor'\)(?!.*'equipe')/g;
  if (pattern1.test(content)) {
    content = content.replace(/requireRole\('gestor'\)/g, "requireRole('admin', 'gestor')");
    modified = true;
  }
  
  // Substituir requireRole('gestor', 'equipe') por requireRole('admin', 'gestor', 'equipe')
  const pattern2 = /requireRole\('gestor', 'equipe'\)/g;
  if (pattern2.test(content)) {
    content = content.replace(pattern2, "requireRole('admin', 'gestor', 'equipe')");
    modified = true;
  }
  
  // Substituir requireRole('equipe', 'gestor') por requireRole('admin', 'gestor', 'equipe')
  const pattern3 = /requireRole\('equipe', 'gestor'\)/g;
  if (pattern3.test(content)) {
    content = content.replace(pattern3, "requireRole('admin', 'gestor', 'equipe')");
    modified = true;
  }
  
  // Substituir authenticate, requireRole('gestor') por authenticate, requireRole('admin', 'gestor')
  const pattern4 = /authenticate, requireRole\('gestor'\)/g;
  if (pattern4.test(content)) {
    content = content.replace(pattern4, "authenticate, requireRole('admin', 'gestor')");
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${file} atualizado`);
  } else {
    console.log(`⏭️  ${file} - sem alterações necessárias`);
  }
});

console.log('\n✅ Atualização concluída!');
console.log('   Agora ADMIN e GESTOR têm acesso a pedidos, equipes, usuários e notificações');
console.log('   Apenas ADMIN pode gerenciar produtos');
