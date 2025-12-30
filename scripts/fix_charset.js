const pool = require('../src/config/db.mysql');

async function fixCharset() {
  const conn = await pool.getConnection();
  
  try {
    console.log('🔧 Corrigindo charset do banco de dados...');
    
    // Alterar charset do banco
    await conn.query(`ALTER DATABASE nexus_b2b CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✅ Banco de dados alterado para utf8mb4');
    
    // Alterar charset das tabelas principais
    const tables = ['usuarios', 'equipes', 'produtos', 'pedidos', 'notificacoes'];
    
    for (const table of tables) {
      try {
        await conn.query(`ALTER TABLE ${table} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Tabela ${table} convertida para utf8mb4`);
      } catch (error) {
        console.log(`⚠️  Tabela ${table} não existe ou erro: ${error.message}`);
      }
    }
    
    console.log('🎉 Charset corrigido com sucesso!');
    console.log('📝 Agora atualize a página no navegador');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir charset:', error);
  } finally {
    conn.release();
    process.exit();
  }
}

fixCharset();
