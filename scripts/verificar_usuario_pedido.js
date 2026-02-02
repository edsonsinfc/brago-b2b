const mysql = require('mysql2/promise');

async function verificarUsuarioPedido() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    console.log('🔍 Verificando estrutura da tabela pedidos...\n');
    
    // 1. Ver estrutura da tabela
    const [columns] = await conn.execute('DESCRIBE pedidos');
    console.log('📐 Colunas da tabela pedidos:');
    columns.forEach(col => {
      console.log(`   • ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `(default: ${col.Default})` : ''}`);
    });
    
    console.log('\n🔍 Verificando pedidos existentes...\n');
    
    // 2. Ver pedidos e se tem usuario_id
    const [pedidos] = await conn.execute(`
      SELECT 
        p.id, 
        p.equipe_id,
        p.criado_por,
        p.valor_total,
        p.status,
        e.nome as equipe_nome,
        u.nome as usuario_nome,
        u.email as usuario_email
      FROM pedidos p
      LEFT JOIN equipes e ON e.id = p.equipe_id
      LEFT JOIN usuarios u ON u.id = p.criado_por
      ORDER BY p.id DESC
      LIMIT 10
    `);
    
    console.log('📋 Últimos 10 pedidos:');
    console.log('┌────────┬───────────┬────────────┬──────────────────┬──────────────────────────────┐');
    console.log('│ Pedido │ Equipe ID │ Usuário ID │ Equipe Nome      │ Usuário Nome                 │');
    console.log('├────────┼───────────┼────────────┼──────────────────┼──────────────────────────────┤');
    
    pedidos.forEach(p => {
      const pedidoId = String(p.id).padEnd(6);
      const equipeId = String(p.equipe_id || 'NULL').padEnd(9);
      const usuarioId = String(p.criado_por || 'NULL').padEnd(10);
      const equipeName = String(p.equipe_nome || 'N/A').substring(0, 16).padEnd(16);
      const usuarioName = String(p.usuario_nome || 'NÃO INFORMADO').substring(0, 28).padEnd(28);
      
      console.log(`│ ${pedidoId} │ ${equipeId} │ ${usuarioId} │ ${equipeName} │ ${usuarioName} │`);
    });
    
    console.log('└────────┴───────────┴────────────┴──────────────────┴──────────────────────────────┘');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await conn.end();
  }
}

verificarUsuarioPedido();
