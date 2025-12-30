const mysql = require('mysql2/promise');

async function addContObriColumn() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    console.log('📝 Adicionando coluna cont_obri...');
    
    await conn.query(`
      ALTER TABLE produtos 
      ADD COLUMN cont_obri CHAR(1) DEFAULT 'N' 
      COMMENT 'Contrato obrigatório: S=Sim, N=Não'
    `);
    
    await conn.query(`UPDATE produtos SET cont_obri = 'N' WHERE cont_obri IS NULL`);
    
    console.log('✅ Coluna cont_obri adicionada com sucesso!');
    console.log('\nTodos os produtos foram configurados com cont_obri = "N" (padrão)');
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  Coluna cont_obri já existe!');
    } else {
      console.error('❌ Erro:', error.message);
    }
  } finally {
    await conn.end();
  }
}

addContObriColumn();
