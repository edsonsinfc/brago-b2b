const mysql = require('mysql2/promise');

async function verificarTabelas() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📊 TABELAS NO BANCO DE DADOS:\n');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${Object.values(table)[0]}`);
    });
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await connection.end();
  }
}

verificarTabelas();
