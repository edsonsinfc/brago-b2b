require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db.mysql');

async function runMigration() {
  try {
    console.log('🔄 Executando migration: add vendedor_email...');
    
    const sqlPath = path.join(__dirname, 'sql', '20251106_add_vendedor_email.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar as queries
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    
    for (const statement of statements) {
      console.log('📝 Executando:', statement.substring(0, 100) + '...');
      await pool.execute(statement);
    }
    
    console.log('✅ Migration executada com sucesso!');
    console.log('\n📧 Agora você pode configurar o email do vendedor para cada equipe.');
    console.log('💡 Acesse o painel do gestor > Equipes e adicione o email do vendedor.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  }
}

runMigration();
