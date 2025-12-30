require('dotenv').config();
const pool = require('../src/config/db.mysql');
const fs = require('fs');
const path = require('path');

async function createPasswordResetTable() {
  try {
    console.log('🔧 CRIANDO TABELA DE RECUPERAÇÃO DE SENHA\n');
    
    const sql = fs.readFileSync(
      path.join(__dirname, 'sql', 'create_password_reset_table.sql'),
      'utf8'
    );
    
    await pool.execute(sql);
    
    console.log('✅ Tabela password_reset_tokens criada com sucesso!\n');
    console.log('📋 Estrutura:');
    console.log('   - id (PK)');
    console.log('   - usuario_id (FK -> usuarios)');
    console.log('   - token (único, indexado)');
    console.log('   - expires_at (data de expiração)');
    console.log('   - usado (flag se já foi usado)');
    console.log('   - created_at (timestamp)\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

createPasswordResetTable();
