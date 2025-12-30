const mysql = require('mysql2/promise');

async function checkEngine() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    const [result] = await pool.query(`
      SELECT TABLE_NAME, ENGINE 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'nexus_b2b' AND TABLE_NAME = 'produtos'
    `);
    
    console.log('Informações da tabela produtos:');
    console.log(result);
    
    if (result[0] && result[0].ENGINE !== 'InnoDB') {
      console.log('\n⚠️ Convertendo tabela produtos para InnoDB...');
      await pool.query('ALTER TABLE produtos ENGINE=InnoDB');
      console.log('✅ Tabela convertida!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkEngine();
