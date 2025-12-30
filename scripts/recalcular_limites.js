const mysql = require('mysql2/promise');

async function recalcularLimites() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    console.log('🔄 Recalculando limites disponíveis...\n');

    // Buscar todas as equipes
    const [equipes] = await connection.execute(
      'SELECT id, nome, limite_credito FROM equipes'
    );

    for (const equipe of equipes) {
      // Buscar valor total de pedidos aprovados (não cancelados e não pendentes)
      const [pedidos] = await connection.execute(`
        SELECT COALESCE(SUM(valor_total), 0) as total_usado
        FROM pedidos 
        WHERE equipe_id = ? 
          AND status NOT IN ('CANCELADO', 'PENDENTE_APROVACAO')
          AND status IN ('APROVADO', 'AGUARDANDO', 'EM_SEPARACAO', 'EM_TRANSPORTE', 'SAIU_ENTREGA')
      `, [equipe.id]);

      const totalUsado = Number(pedidos[0].total_usado || 0);
      const limiteTotal = Number(equipe.limite_credito || 0);
      const limiteDisponivel = limiteTotal - totalUsado;

      // Atualizar limite disponível
      await connection.execute(
        'UPDATE equipes SET limite_disponivel = ? WHERE id = ?',
        [limiteDisponivel, equipe.id]
      );

      console.log(`✅ ${equipe.nome}:`);
      console.log(`   Limite Total: R$ ${limiteTotal.toFixed(2)}`);
      console.log(`   Total Usado: R$ ${totalUsado.toFixed(2)}`);
      console.log(`   Limite Disponível: R$ ${limiteDisponivel.toFixed(2)}`);
      console.log('');
    }

    console.log('✨ Recálculo concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao recalcular limites:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

recalcularLimites().catch(console.error);
