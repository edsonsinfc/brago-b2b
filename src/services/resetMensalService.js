const pool = require('../config/db.mysql');

/**
 * Reset automático de saldo mensal das equipes
 * Esta função deve ser executada diariamente (pode usar cron job)
 */
async function verificarResetMensal() {
  try {
    console.log('🔄 Verificando reset mensal de saldo...');
    
    // Buscar equipes que precisam de reset (último reset foi em outro mês)
    const [equipes] = await pool.execute(`
      SELECT 
        id, 
        nome, 
        limite_credito,
        limite_disponivel,
        ultimo_reset_saldo,
        YEAR(ultimo_reset_saldo) as ano_reset,
        MONTH(ultimo_reset_saldo) as mes_reset,
        YEAR(CURDATE()) as ano_atual,
        MONTH(CURDATE()) as mes_atual
      FROM equipes
      WHERE 
        ultimo_reset_saldo IS NULL
        OR (YEAR(ultimo_reset_saldo) < YEAR(CURDATE()))
        OR (YEAR(ultimo_reset_saldo) = YEAR(CURDATE()) AND MONTH(ultimo_reset_saldo) < MONTH(CURDATE()))
    `);
    
    if (equipes.length === 0) {
      console.log('✅ Nenhuma equipe precisa de reset no momento');
      return { resetadas: 0, mensagem: 'Nenhuma equipe precisa de reset' };
    }
    
    console.log(`📋 ${equipes.length} equipes precisam de reset:\n`);
    
    let resetadas = 0;
    
    for (const equipe of equipes) {
      // Verificar se há pedidos ativos (não entregues/cancelados)
      const [pedidosAtivos] = await pool.execute(`
        SELECT COUNT(*) as total, SUM(valor_total) as valor_total
        FROM pedidos
        WHERE equipe_id = ?
        AND status IN ('APROVADO', 'EM_SEPARACAO', 'EM_TRANSPORTE', 'SAIU_ENTREGA')
      `, [equipe.id]);
      
      const temPedidosAtivos = pedidosAtivos[0].total > 0;
      const valorPedidos = Number(pedidosAtivos[0].valor_total || 0);
      
      console.log(`  ${equipe.nome}:`);
      console.log(`    Último reset: ${equipe.ultimo_reset_saldo || 'Nunca'}`);
      console.log(`    Limite total: R$ ${Number(equipe.limite_credito).toFixed(2)}`);
      console.log(`    Limite atual: R$ ${Number(equipe.limite_disponivel).toFixed(2)}`);
      
      if (temPedidosAtivos) {
        console.log(`    ⚠️  ${pedidosAtivos[0].total} pedidos ativos (R$ ${valorPedidos.toFixed(2)})`);
        console.log(`    Novo limite: R$ ${(equipe.limite_credito - valorPedidos).toFixed(2)}`);
        
        // Reset considerando pedidos ativos
        await pool.execute(`
          UPDATE equipes
          SET 
            limite_disponivel = limite_credito - ?,
            ultimo_reset_saldo = CURDATE()
          WHERE id = ?
        `, [valorPedidos, equipe.id]);
      } else {
        console.log(`    ✅ Sem pedidos ativos`);
        console.log(`    Novo limite: R$ ${Number(equipe.limite_credito).toFixed(2)}`);
        
        // Reset total
        await pool.execute(`
          UPDATE equipes
          SET 
            limite_disponivel = limite_credito,
            saldo_atual = 0,
            ultimo_reset_saldo = CURDATE()
          WHERE id = ?
        `, [equipe.id]);
      }
      
      console.log(`    ✅ Reset realizado!\n`);
      resetadas++;
    }
    
    console.log(`\n✅ Reset mensal concluído! ${resetadas} equipes atualizadas.`);
    
    return { 
      resetadas, 
      mensagem: `${resetadas} equipes resetadas com sucesso`,
      equipes: equipes.map(e => e.nome)
    };
    
  } catch (error) {
    console.error('❌ Erro ao verificar reset mensal:', error);
    throw error;
  }
}

/**
 * Força o reset manual de uma equipe específica
 */
async function forcarResetEquipe(equipeId) {
  try {
    const [equipe] = await pool.execute(`
      SELECT id, nome, limite_credito
      FROM equipes
      WHERE id = ?
    `, [equipeId]);
    
    if (equipe.length === 0) {
      throw new Error('Equipe não encontrada');
    }
    
    // Verificar pedidos ativos
    const [pedidosAtivos] = await pool.execute(`
      SELECT COUNT(*) as total, SUM(valor_total) as valor_total
      FROM pedidos
      WHERE equipe_id = ?
      AND status IN ('APROVADO', 'EM_SEPARACAO', 'EM_TRANSPORTE', 'SAIU_ENTREGA')
    `, [equipeId]);
    
    const valorPedidos = Number(pedidosAtivos[0].valor_total || 0);
    const novoLimite = equipe[0].limite_credito - valorPedidos;
    
    await pool.execute(`
      UPDATE equipes
      SET 
        limite_disponivel = ?,
        saldo_atual = 0,
        ultimo_reset_saldo = CURDATE()
      WHERE id = ?
    `, [novoLimite, equipeId]);
    
    console.log(`✅ Reset forçado para ${equipe[0].nome}`);
    console.log(`   Novo limite: R$ ${novoLimite.toFixed(2)}`);
    
    return {
      sucesso: true,
      equipe: equipe[0].nome,
      novoLimite
    };
    
  } catch (error) {
    console.error('❌ Erro ao forçar reset:', error);
    throw error;
  }
}

module.exports = {
  verificarResetMensal,
  forcarResetEquipe
};

// Se executado diretamente, roda a verificação
if (require.main === module) {
  verificarResetMensal()
    .then(resultado => {
      console.log('\n📊 Resultado:', resultado);
      process.exit(0);
    })
    .catch(error => {
      console.error('Erro:', error);
      process.exit(1);
    });
}
