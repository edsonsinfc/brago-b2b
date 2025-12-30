const pool = require('../src/config/db.mysql');

async function verificarTabelas() {
  try {
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('📊 Tabelas no banco:\n');
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      if (tableName.includes('item') || tableName.includes('pedido')) {
        console.log(`  - ${tableName}`);
      }
    });
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    process.exit(0);
  }
}

verificarTabelas();
