// Teste direto da query de pedidos
const pool = require('../src/config/db.mysql');

async function testarQuery() {
  console.log('🔍 Testando query de pedidos...\n');
  
  try {
    const inicio = Date.now();
    
    console.log('1️⃣ Testando COUNT...');
    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM pedidos p JOIN equipes e ON e.id = p.equipe_id'
    );
    console.log(`   ✅ Total de pedidos: ${total} (${Date.now() - inicio}ms)\n`);
    
    const inicio2 = Date.now();
    console.log('2️⃣ Testando SELECT com LIMIT 100...');
    const [rows] = await pool.execute(
      `SELECT p.*, e.nome AS equipe_nome, e.codigo_erp, e.cgc 
       FROM pedidos p 
       JOIN equipes e ON e.id = p.equipe_id 
       ORDER BY p.data DESC 
       LIMIT 100`
    );
    console.log(`   ✅ Pedidos retornados: ${rows.length} (${Date.now() - inicio2}ms)\n`);
    
    if (rows.length > 0) {
      console.log('📋 Primeiro pedido:');
      console.log('   ID:', rows[0].id);
      console.log('   Status:', rows[0].status);
      console.log('   Data:', rows[0].data);
      console.log('   Data tipo:', typeof rows[0].data);
      console.log('   Data toString:', String(rows[0].data));
      console.log('   Equipe:', rows[0].equipe_nome);
      console.log('   Valor:', rows[0].valor_total);
    }
    
    const inicio3 = Date.now();
    console.log('\n3️⃣ Testando SELECT com filtro PENDENTE_APROVACAO...');
    const [pendentes] = await pool.execute(
      `SELECT p.*, e.nome AS equipe_nome, e.codigo_erp, e.cgc 
       FROM pedidos p 
       JOIN equipes e ON e.id = p.equipe_id 
       WHERE p.status = ?
       ORDER BY p.data DESC 
       LIMIT 100`,
      ['PENDENTE_APROVACAO']
    );
    console.log(`   ✅ Pedidos PENDENTE_APROVACAO: ${pendentes.length} (${Date.now() - inicio3}ms)\n`);
    
    if (pendentes.length > 0) {
      console.log('📋 Pedidos pendentes:');
      pendentes.forEach(p => {
        console.log(`   → #${p.id} - ${p.equipe_nome} - R$ ${p.valor_total} - ${p.data}`);
      });
    }
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

testarQuery();
