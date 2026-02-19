#!/usr/bin/env node

/**
 * Script de Preparação para Migração Hostinger
 * Executa verificações e gera relatório antes da migração
 * 
 * Uso: node scripts/prepare-migration.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n========================================');
console.log('🚀 PREPARAÇÃO PARA MIGRAÇÃO HOSTINGER');
console.log('========================================\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function check(name, condition, message) {
  if (condition) {
    console.log(`✅ ${name}`);
    checks.passed++;
  } else {
    console.log(`❌ ${name}`);
    console.log(`   └─ ${message}`);
    checks.failed++;
  }
}

function warn(name, message) {
  console.log(`⚠️  ${name}`);
  console.log(`   └─ ${message}`);
  checks.warnings++;
}

// 1. Verificar estrutura de pastas
console.log('📁 Verificando Estrutura de Pastas...\n');
check('Pasta src/', fs.existsSync('./src'), 'Pasta src/ não encontrada');
check('Pasta public/', fs.existsSync('./public'), 'Pasta public/ não encontrada');
check('Pasta uploads/', fs.existsSync('./uploads'), 'Pasta uploads/ não encontrada');
check('Pasta logs/', fs.existsSync('./logs'), 'Pasta logs/ não existe (será criada no servidor)');
check('Pasta scripts/', fs.existsSync('./scripts'), 'Pasta scripts/ não encontrada');

// 2. Verificar arquivos críticos
console.log('\n📄 Verificando Arquivos Críticos...\n');
check('package.json existe', fs.existsSync('./package.json'), 'package.json não encontrado');
check('ecosystem.config.js existe', fs.existsSync('./ecosystem.config.js'), 'ecosystem.config.js não encontrado');
check('.env.hostinger existe', fs.existsSync('./.env.hostinger'), 'Crie .env.hostinger (template fornecido)');
check('.env NÃO está em git', !fs.existsSync('./.env'), '.env encontrado (não deve estar no repositório)');
check('.gitignore configurado', fs.existsSync('./.gitignore'), '.gitignore não encontrado');

// 3. Verificar package.json
console.log('\n📦 Verificando Dependências...\n');
try {
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
  
  const requiredDeps = ['express', 'mysql2', 'dotenv', 'bcryptjs', 'jsonwebtoken'];
  const hasDeps = requiredDeps.every(dep => pkg.dependencies[dep]);
  check('Dependências principais instaladas', hasDeps, 'Faltam dependências críticas');
  
  check('Node version especificada', pkg.engines?.node, 'package.json sem engines.node (recomendado: >=18.0.0)');
  
  const scripts = ['start'];
  const hasScripts = scripts.every(s => pkg.scripts[s]);
  check('Scripts necessários configurados', hasScripts, 'Faltam scripts em package.json');
  
} catch (e) {
  console.log(`❌ Erro ao ler package.json: ${e.message}`);
  checks.failed++;
}

// 4. Verificar variáveis de ambiente
console.log('\n🔐 Verificando Configurações de Segurança...\n');
const envExample = fs.existsSync('./.env.example');
const envHostinger = fs.existsSync('./.env.hostinger');
check('.env.example existe', envExample, 'Template .env.example não encontrado');
check('.env.hostinger existe', envHostinger, 'Template .env.hostinger não encontrado');

try {
  const exampleContent = fs.readFileSync('./.env.example', 'utf-8');
  if (exampleContent.includes('seu_usuario_mysql')) {
    warn('Exemplo .env com placeholders', 'Verificar se os placeholders serão substituídos antes do deploy');
  }
} catch (e) {
  console.log(`⚠️  Erro ao ler .env.example`);
}

// 5. Verificar banco de dados
console.log('\n🗄️  Verificando Configuração do Banco de Dados...\n');
const dbMysql = fs.existsSync('./src/config/db.mysql.js');
const dbOracle = fs.existsSync('./src/config/db.oracle.js');
check('Configuração MySQL existe', dbMysql, 'src/config/db.mysql.js não encontrado');
warn('Configuração Oracle existente', 'Oracle é opcional, pode ser removido se não usar', dbOracle);

// 6. Verificar backup
console.log('\n💾 Verificando Backups...\n');
const backups = fs.readdirSync('./backups').filter(f => f.endsWith('.sql'));
if (backups.length > 0) {
  console.log(`✅ ${backups.length} backup(s) de banco de dados encontrado(s)`);
  console.log(`   └─ Último: ${backups[backups.length - 1]}`);
  checks.passed++;
} else {
  warn('Nenhum backup SQL encontrado', 
    'Execute: mysqldump -u root -p nexus_b2b > backups/backup_$(date +%s).sql');
}

// 7. Verificar documentação
console.log('\n📚 Verificando Documentação...\n');
check('MIGRACAO_HOSTINGER.md existe', fs.existsSync('./MIGRACAO_HOSTINGER.md'), 'Guia de migração não encontrado');
check('README.md existe', fs.existsSync('./README.md'), 'README.md não encontrado');

// 8. Verificar tamanho do projeto
console.log('\n📊 Análise do Projeto...\n');
try {
  const result = execSync('powershell -Command "Get-ChildItem -Path . -Recurse -Exclude node_modules | Measure-Object -Property Length -Sum | Select-Object Sum"', 
    { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
  
  const split = result.split('\n').find(line => line.match(/\d+/));
  if (split) {
    const sizeBytes = parseInt(split.match(/\d+/)[0]);
    const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
    console.log(`📦 Tamanho do projeto (sem node_modules): ~${sizeMB} MB`);
  }
} catch (e) {
  console.log('⚠️  Não foi possível calcular tamanho do projeto');
}

// 9. Verificar node_modules
console.log('\nVerificando dependências instaladas...');
if (fs.existsSync('./node_modules')) {
  console.log('✅ node_modules encontrado (pode ser grande para upload, considere instalar em servidor)');
  checks.passed++;
} else {
  warn('node_modules não encontrado', 'Execute: npm install antes de fazer upload');
}

// 10. Verificar git config
console.log('\n🔧 Verificando Configuração Git...\n');
try {
  const gitExists = fs.existsSync('./.git');
  if (gitExists) {
    console.log('✅ Repositório Git encontrado');
    checks.passed++;
  } else {
    console.log('⚠️  Não é um repositório Git (pode ser intencional)');
  }
} catch (e) {
  console.log('⚠️  Erro ao verificar git');
}

// Relatório Final
console.log('\n========================================');
console.log('📋 RELATÓRIO DE PREPARAÇÃO');
console.log('========================================\n');
console.log(`✅ Verificações passadas: ${checks.passed}`);
console.log(`❌ Problemas encontrados: ${checks.failed}`);
console.log(`⚠️  Avisos: ${checks.warnings}\n`);

// Recomendações
console.log('📝 PRÓXIMOS PASSOS:\n');
console.log('[ ] 1. Fazer backup do banco de dados atual');
console.log('      mysqldump -u root -p nexus_b2b > backup_nexus_$(Get-Date -Format "yyyyMMdd_HHmmss").sql\n');

console.log('[ ] 2. Preparar credenciais Hostinger:');
console.log('      - Host MySQL');
console.log('      - Usuário MySQL');
console.log('      - Senha MySQL');
console.log('      - Nome do banco de dados\n');

console.log('[ ] 3. Gerar JWT_SECRET seguro:');
console.log('      node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');

console.log('[ ] 4. Criar .env final baseado em .env.hostinger:');
console.log('      cp .env.hostinger .env (local)\n');

console.log('[ ] 5. Testar localmente:\n');
console.log('      npm install\n');
console.log('      npm start\n');

console.log('[ ] 6. Fazer upload dos arquivos para Hostinger\n');

console.log('[ ] 7. No servidor Hostinger:');
console.log('      npm install --production');
console.log('      pm2 start ecosystem.config.js');
console.log('      pm2 save\n');

console.log('[ ] 8. Validar endpoints após deploy\n');

// Status final
const status = checks.failed === 0 ? '✅ PRONTO PARA MIGRAÇÃO' : '⚠️  VERIFIQUE OS PROBLEMAS ACIMA';
console.log('----------------------------------------');
console.log(`Status: ${status}`);
console.log('----------------------------------------\n');

process.exit(checks.failed > 0 ? 1 : 0);
