const pool = require('../src/config/db.mysql');

async function recalcularSaldo(equipeId) {
  try {
    console.log(`🔄 Recalculando saldo da equipe #${equipeId}...\n`);
    
    // Buscar dados da equipe
    const [[equipe]] = await pool.execute(
      'SELECT id, nome, limite_credito, limite_total FROM equipes WHERE id = ?',
      [equipeId]
    );
    
    if (!equipe) {
      console.log('❌ Equipe não encontrada');
      return;
    }
    
    console.log(`📊 Equipe: ${equipe.nome}`);
    console.log(`💰 Limite de crédito: R$ ${equipe.limite_credito}`);
    
    // Buscar pedidos APROVADOS e AGUARDANDO (ambos já debitaram do saldo)
    const [pedidosDebitados] = await pool.execute(
      `SELECT id, valor_total, status, DATE_FORMAT(data, '%Y-%m-%d %H:%i:%s') as data_formatada
       FROM pedidos 
       WHERE equipe_id = ? AND status IN ('APROVADO', 'AGUARDANDO')
       ORDER BY data DESC`,
      [equipeId]
    );
    
    console.log(`\n📦 Pedidos que JÁ DEBITARAM do saldo: ${pedidosDebitados.length}`);
    
    let totalGasto = 0;
    pedidosDebitados.forEach(p => {
      console.log(`  #${p.id} - ${p.status.padEnd(20)} - R$ ${String(p.valor_total).padStart(10)} - ${p.data_formatada}`);
      totalGasto += Number(p.valor_total);
    });
    
    const limiteDisponivel = Number(equipe.limite_credito) - totalGasto;
    
    console.log(`\n💸 Total gasto: R$ ${totalGasto.toFixed(2)}`);
    console.log(`🔓 Limite disponível calculado: R$ ${limiteDisponivel.toFixed(2)}`);
    
    // Atualizar na base
    await pool.execute(
      `UPDATE equipes 
       SET saldo_atual = ?,
           limite_disponivel = ?
       WHERE id = ?`,
      [limiteDisponivel, limiteDisponivel, equipeId]
    );
    
    console.log('\n✅ Saldo atualizado com sucesso!');
    
    // Verificar pedidos PENDENTE_APROVACAO (não debitaram ainda)
    const [pedidosPendentes] = await pool.execute(
      `SELECT id, valor_total, status, motivo_pendencia
       FROM pedidos 
       WHERE equipe_id = ? AND status = 'PENDENTE_APROVACAO'
       ORDER BY data DESC`,
      [equipeId]
    );
    
    if (pedidosPendentes.length > 0) {
      console.log(`\n⚠️  Pedidos PENDENTES (não debitaram saldo): ${pedidosPendentes.length}`);
      pedidosPendentes.forEach(p => {
        console.log(`  #${p.id} - R$ ${p.valor_total}`);
        console.log(`    Motivo: ${p.motivo_pendencia || 'N/A'}`);
        if (Number(p.valor_total) <= limiteDisponivel) {
          console.log(`    ✅ Limite SUFICIENTE agora! Pode aprovar.`);
        } else {
          console.log(`    ❌ Limite INSUFICIENTE (precisa de R$ ${p.valor_total}, tem R$ ${limiteDisponivel.toFixed(2)})`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

// Executar para a equipe Oba Aguas Claras (ID 2)
recalcularSaldo(2);
