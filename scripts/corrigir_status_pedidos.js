const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nexus_b2b',
  waitForConnections: true,
  connectionLimit: 10
});

async function corrigirStatus() {
  try {
    console.log('🔍 Buscando pedidos com status AGUARDANDO...\n');
    
    // Buscar pedidos AGUARDANDO
    const [pedidos] = await pool.execute(`
      SELECT p.id, p.equipe_id, p.status, p.valor_total, e.limite_disponivel, e.nome as equipe_nome
      FROM pedidos p
      JOIN equipes e ON e.id = p.equipe_id
      WHERE p.status = 'AGUARDANDO'
      ORDER BY p.id
    `);
    
    if (pedidos.length === 0) {
      console.log('✅ Nenhum pedido com status AGUARDANDO encontrado.');
      await pool.end();
      return;
    }
    
    console.log(`📦 Encontrados ${pedidos.length} pedidos:\n`);
    console.table(pedidos.map(p => ({
      ID: p.id,
      Equipe: p.equipe_nome,
      Status: p.status,
      Valor: `R$ ${Number(p.valor_total).toFixed(2)}`,
      'Limite Disponível': `R$ ${Number(p.limite_disponivel).toFixed(2)}`,
      'Precisa Aprovação?': p.valor_total > p.limite_disponivel ? '⚠️ SIM' : '✅ NÃO'
    })));
    
    console.log('\n🔄 Corrigindo status...\n');
    
    for (const pedido of pedidos) {
      const precisaAprovacao = Number(pedido.valor_total) > Number(pedido.limite_disponivel);
      
      if (precisaAprovacao) {
        // Mudar para PENDENTE_APROVACAO
        await pool.execute(`
          UPDATE pedidos 
          SET status = 'PENDENTE_APROVACAO', 
              motivo_pendencia = 'Limite de crédito insuficiente - Aguardando aprovação do gestor'
          WHERE id = ?
        `, [pedido.id]);
        
        console.log(`⚠️  Pedido ${pedido.id} (${pedido.equipe_nome}): AGUARDANDO → PENDENTE_APROVACAO`);
      } else {
        // Pode aprovar automaticamente
        await pool.execute(`
          UPDATE pedidos 
          SET status = 'APROVADO', 
              data_confirmacao = NOW()
          WHERE id = ?
        `, [pedido.id]);
        
        // Debitar do limite
        await pool.execute(`
          UPDATE equipes 
          SET limite_disponivel = limite_disponivel - ?
          WHERE id = ?
        `, [pedido.valor_total, pedido.equipe_id]);
        
        console.log(`✅ Pedido ${pedido.id} (${pedido.equipe_nome}): AGUARDANDO → APROVADO (auto)`);
      }
    }
    
    console.log('\n✨ Correção concluída com sucesso!\n');
    
    // Mostrar resumo final
    const [resumo] = await pool.execute(`
      SELECT status, COUNT(*) as total
      FROM pedidos
      GROUP BY status
      ORDER BY status
    `);
    
    console.log('📊 Resumo de pedidos por status:\n');
    console.table(resumo);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

corrigirStatus();
