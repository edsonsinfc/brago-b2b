// Verificar datas dos pedidos
const pool = require('../src/config/db.mysql');

async function verificarDatas() {
  console.log('🔍 Verificando datas dos pedidos...\n');
  
  try {
    const [pedidos] = await pool.execute(`
      SELECT 
        id, 
        data, 
        UNIX_TIMESTAMP(data) as timestamp,
        DATE_FORMAT(data, '%Y-%m-%d %H:%i:%s') as formatted,
        status
      FROM pedidos 
      ORDER BY id DESC 
      LIMIT 10
    `);
    
    console.log(`📋 Total de pedidos retornados: ${pedidos.length}\n`);
    
    pedidos.forEach(p => {
      console.log(`Pedido #${p.id}:`);
      console.log(`  Data (raw):`, p.data);
      console.log(`  Data (tipo):`, typeof p.data);
      console.log(`  Timestamp:`, p.timestamp);
      console.log(`  Formatted:`, p.formatted);
      console.log(`  Status:`, p.status);
      console.log('');
    });
    
    console.log('✅ Verificação concluída');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

verificarDatas();
