const pool = require('../src/config/db.mysql');

async function corrigirPedidosAguardando() {
  try {
    console.log('🔄 Corrigindo status de pedidos AGUARDANDO para APROVADO...\n');
    
    // Buscar pedidos com status AGUARDANDO
    const [pedidos] = await pool.execute(
      `SELECT p.id, p.equipe_id, p.valor_total, p.status, e.nome as equipe_nome
       FROM pedidos p
       JOIN equipes e ON e.id = p.equipe_id
       WHERE p.status = 'AGUARDANDO'`
    );
    
    console.log(`📊 Encontrados ${pedidos.length} pedidos com status AGUARDANDO\n`);
    
    if (pedidos.length === 0) {
      console.log('✅ Nenhum pedido para corrigir');
      return;
    }
    
    for (const pedido of pedidos) {
      console.log(`\n🔄 Pedido #${pedido.id} - ${pedido.equipe_nome} - R$ ${pedido.valor_total}`);
      console.log('   Alterando status: AGUARDANDO → APROVADO');
      
      await pool.execute(
        'UPDATE pedidos SET status = ? WHERE id = ?',
        ['APROVADO', pedido.id]
      );
      
      console.log('   ✅ Status atualizado!');
    }
    
    console.log('\n✅ Todos os pedidos foram corrigidos!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

corrigirPedidosAguardando();
