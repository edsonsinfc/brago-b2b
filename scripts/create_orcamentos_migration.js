const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'nexus_b2b',
      multipleStatements: true
    });

    console.log('✅ Conectado ao banco de dados');

    // Ler arquivo SQL
    const sqlPath = path.join(__dirname, 'sql', 'create_orcamentos_tables.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');

    console.log('📄 Executando migration...');

    // Executar SQL
    await connection.query(sql);

    console.log('✅ Tabelas de orçamentos criadas com sucesso!');
    console.log('   - orcamentos');
    console.log('   - orcamento_itens');

  } catch (error) {
    console.error('❌ Erro na migration:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Executar
runMigration()
  .then(() => {
    console.log('\n✨ Migration concluída!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Falha na migration:', error.message);
    process.exit(1);
  });
