const mysql = require('mysql2/promise');

async function addLotePedido() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    console.log('🔄 Adicionando coluna lote_pedido...');
    
    await conn.execute(`
      ALTER TABLE pedidos 
      ADD COLUMN lote_pedido VARCHAR(50) NULL
      AFTER motivo_pendencia
    `);
    
    console.log('✅ Coluna lote_pedido adicionada com sucesso!');
    
    // Verificar
    const [columns] = await conn.execute(`
      SHOW COLUMNS FROM pedidos LIKE 'lote_pedido'
    `);
    
    console.log('📊 Verificação:', columns);
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ Coluna lote_pedido já existe');
    } else {
      console.error('❌ Erro:', error.message);
    }
  } finally {
    await conn.end();
  }
}

addLotePedido();
