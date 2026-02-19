#!/usr/bin/env node

/**
 * Script de Backup do Banco de Dados
 * Cria backup automático em múltiplos formatos
 * 
 * Uso: node scripts/backup-database.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'nexus_b2b',
  port: process.env.MYSQL_PORT || '3306'
};

const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

console.log('\n========================================');
console.log('💾 BACKUP DO BANCO DE DADOS');
console.log('========================================\n');

console.log('📋 Configuração:');
console.log(`  Database: ${config.database}`);
console.log(`  Host: ${config.host}`);
console.log(`  User: ${config.user}\n`);

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const filename = `backup_${config.database}_${timestamp}.sql`;
const filepath = path.join(backupDir, filename);

try {
  const passwordPart = config.password ? `-p${config.password}` : '';
  
  console.log('⏳ Executando backup...');
  
  // Comando mysqldump
  const command = `mysqldump -h ${config.host} -P ${config.port} -u ${config.user} ${passwordPart} --single-transaction --quick --lock-tables=false ${config.database}`;
  
  const output = execSync(command, { encoding: 'utf-8' });
  
  // Salvar arquivo
  fs.writeFileSync(filepath, output);
  
  // Obter tamanho do arquivo
  const stats = fs.statSync(filepath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  
  console.log(`✅ Backup concluído com sucesso!\n`);
  console.log(`📁 Arquivo: ${filename}`);
  console.log(`📊 Tamanho: ${sizeKB} KB (${sizeMB} MB)`);
  console.log(`📂 Localização: ${filepath}\n`);
  
  // Listar últimos backups
  console.log('📚 Últimos backups criados:\n');
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
    .sort()
    .reverse()
    .slice(0, 5);
  
  files.forEach((file, index) => {
    const filepath = path.join(backupDir, file);
    const stats = fs.statSync(filepath);
    const size = (stats.size / 1024 / 1024).toFixed(2);
    const date = new Date(stats.mtime).toLocaleString('pt-BR');
    console.log(`  ${index + 1}. ${file} (${size} MB) - ${date}`);
  });
  
  console.log('\n========================================');
  console.log('✅ BACKUP DISPONÍVEL PARA MIGRAÇÃO');
  console.log('========================================\n');
  
  console.log('📤 Para fazer upload para Hostinger:');
  console.log(`  scp backups/${filename} usuario@host:/caminho-destino/\n`);
  
  console.log('📥 Para restaurar no servidor:');
  console.log(`  mysql -h host -u user -p database < ${filename}\n`);
  
} catch (error) {
  console.error('\n❌ Erro ao fazer backup:\n');
  console.error(error.message);
  
  if (error.message.includes('command not found')) {
    console.error('\n⚠️  mysqldump não encontrado!');
    console.error('   Solução: Instruções para diferentes SO:');
    console.error('   • Windows: Instale MySQL Community Server');
    console.error('   • macOS: brew install mysql');
    console.error('   • Linux: sudo apt-get install mysql-client\n');
  } else if (error.message.includes('Access denied')) {
    console.error('\n⚠️  Erro de autenticação!');
    console.error('   Verifique credenciais em .env\n');
  }
  
  process.exit(1);
}
