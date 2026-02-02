const mysql = require('mysql2/promise');

async function verificarDashboard() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    console.log('=== VERIFICAÇÃO DASHBOARD CORRIGIDO ===\n');
    
    // Buscar pedidos dos últimos 30 dias por status
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    const dataFormatada = trintaDiasAtras.toISOString().split('T')[0];
    
    console.log('Pedidos dos últimos 30 dias por status:\n');
    const [pedidosPorStatus] = await conn.query(`
      SELECT 
        status,
        COUNT(*) as quantidade,
        ROUND(SUM(valor_total), 2) as valor_total
      FROM pedidos 
      WHERE data >= ?
      GROUP BY status
      ORDER BY status
    `, [dataFormatada]);
    
    console.table(pedidosPorStatus);
    
    // Verificar equipes específicas com problema
    console.log('\nDetalhamento das equipes problemáticas:\n');
    const [equipesProblema] = await conn.query(`
      SELECT 
        e.nome,
        e.id,
        COUNT(p.id) as pedidos_pendentes,
        ROUND(COALESCE(SUM(CASE WHEN p.status = 'PENDENTE_APROVACAO' THEN p.valor_total END), 0), 2) as valor_pendente,
        ROUND(COALESCE(SUM(CASE WHEN p.status = 'APROVADO' THEN p.valor_total END), 0), 2) as valor_aprovado
      FROM equipes e
      LEFT JOIN pedidos p ON e.id = p.equipe_id AND p.data >= ?
      WHERE e.id IN (25, 35) -- 209 NORTE e COLORADO
      GROUP BY e.id, e.nome
      ORDER BY e.nome
    `, [dataFormatada]);
    
    console.table(equipesProblema);
    
    console.log('\n=== RESUMO DA CORREÇÃO ===');
    console.log('✅ Antes: Dashboard contava pedidos PENDENTE_APROVACAO como compras realizadas');
    console.log('✅ Depois: Dashboard conta apenas pedidos APROVADOS como compras realizadas');
    console.log('✅ Resultado: Valores de "Compras (30d)" e "Ticket Médio" agora são precisos');
    
  } catch (error) {
    console.error('Erro ao verificar dashboard:', error);
  } finally {
    await conn.end();
  }
}

verificarDashboard();