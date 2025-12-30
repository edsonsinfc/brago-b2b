const mysql = require('mysql2/promise');

async function verificarPedidos() {
  console.log('🔍 Verificando pedidos no banco de dados...\n');
  
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    // Total de pedidos
    const [[total]] = await conn.execute('SELECT COUNT(*) as total FROM pedidos');
    console.log(`📊 Total de pedidos no banco: ${total.total}`);
    
    if (total.total === 0) {
      console.log('❌ NENHUM PEDIDO ENCONTRADO!');
      return;
    }
    
    // Últimos 10 pedidos
    console.log('\n📋 Últimos 10 pedidos:\n');
    const [pedidos] = await conn.execute(`
      SELECT 
        p.id,
        p.equipe_id,
        e.nome as equipe_nome,
        p.status,
        p.valor_total,
        p.data
      FROM pedidos p
      LEFT JOIN equipes e ON e.id = p.equipe_id
      ORDER BY p.id DESC
      LIMIT 10
    `);
    
    pedidos.forEach(p => {
      console.log(`Pedido #${p.id}`);
      console.log(`  Equipe: ${p.equipe_nome || 'N/A'}`);
      console.log(`  Status: ${p.status}`);
      console.log(`  Valor: R$ ${Number(p.valor_total).toFixed(2)}`);
      console.log(`  Data: ${p.data}`);
      console.log('');
    });
    
  } finally {
    await conn.end();
  }
}

verificarPedidos().catch(console.error);
