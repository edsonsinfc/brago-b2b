const pool = require('../src/config/db.mysql');

async function testarPedidoComCodigos() {
  try {
    console.log('🧪 Testando criação de pedido com codigo_erp e cgc...\n');
    
    // Buscar um pedido recente para verificar os dados
    const [pedidos] = await pool.execute(`
      SELECT p.id, p.equipe_id, p.valor_total, p.codigo_erp, p.cgc, p.status,
             e.nome as equipe_nome, e.codigo_erp as equipe_codigo_erp, e.cgc as equipe_cgc
      FROM pedidos p
      JOIN equipes e ON e.id = p.equipe_id
      ORDER BY p.id DESC
      LIMIT 5
    `);
    
    console.log('📦 Últimos 5 pedidos:\n');
    
    pedidos.forEach(p => {
      console.log(`Pedido #${p.id} - ${p.equipe_nome}`);
      console.log(`  Status: ${p.status}`);
      console.log(`  Valor: R$ ${p.valor_total}`);
      console.log(`  Código ERP: ${p.codigo_erp || '❌ não informado'}`);
      console.log(`  CGC: ${p.cgc || '❌ não informado'}`);
      console.log(`  Equipe - Código ERP: ${p.equipe_codigo_erp || 'não cadastrado'}`);
      console.log(`  Equipe - CGC: ${p.equipe_cgc || 'não cadastrado'}`);
      console.log('');
    });
    
    console.log('✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

testarPedidoComCodigos();
