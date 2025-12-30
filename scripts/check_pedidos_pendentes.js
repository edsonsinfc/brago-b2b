const pool = require('../src/config/db.mysql');

async function checkPedidos() {
  try {
    console.log('🔍 Verificando pedidos no banco...\n');
    
    // Ver todos os pedidos e seus status
    const [todosPedidos] = await pool.execute(`
      SELECT p.id, p.status, p.valor_total, DATE_FORMAT(p.data, '%Y-%m-%d %H:%i:%s') as data_formatada, e.nome as equipe_nome
      FROM pedidos p 
      JOIN equipes e ON e.id = p.equipe_id
      ORDER BY p.id DESC
      LIMIT 10
    `);
    
    console.log(`📊 Últimos 10 pedidos no banco:\n`);
    todosPedidos.forEach(p => {
      console.log(`  #${p.id} - ${p.status.padEnd(20)} - ${p.equipe_nome.substring(0, 20).padEnd(20)} - R$ ${String(p.valor_total).padStart(10)} - ${p.data_formatada}`);
    });
    
    console.log('\n📈 Resumo por status:');
    const [statusCount] = await pool.execute(`
      SELECT status, COUNT(*) as total
      FROM pedidos
      GROUP BY status
    `);
    statusCount.forEach(s => {
      console.log(`  ${s.status.padEnd(20)}: ${s.total} pedidos`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

checkPedidos();
