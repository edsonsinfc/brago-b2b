const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });
  
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();
    
    // Criar pedido com valor alto (R$ 15.000,00)
    const [result] = await conn.execute(
      'INSERT INTO pedidos (equipe_id, valor_total, status, motivo_pendencia) VALUES (?, ?, ?, ?)',
      [2, 15000.00, 'PENDENTE_APROVACAO', 'Limite de crédito insuficiente - Aguardando aprovação do gestor']
    );
    
    const pedidoId = result.insertId;
    
    // Adicionar itens
    await conn.execute(
      'INSERT INTO itens_pedido (pedido_id, codprod, descricao, quantidade, valor_unitario, valor_total) VALUES (?, ?, ?, ?, ?, ?)',
      [pedidoId, 'TESTE001', 'Produto Teste de Alto Valor', 100, 150.00, 15000.00]
    );
    
    await conn.commit();
    
    console.log(`\n✅ Pedido #${pedidoId} criado com sucesso!`);
    console.log(`   Valor: R$ 15.000,00`);
    console.log(`   Status: PENDENTE_APROVACAO`);
    console.log(`   Equipe: Oba Aguas Claras`);
    console.log(`\n🎯 Agora vá ao dashboard do gestor e aprove este pedido!\n`);
    
  } catch (e) {
    await conn.rollback();
    console.error('❌ Erro:', e.message);
  } finally {
    conn.release();
    await pool.end();
  }
})();
