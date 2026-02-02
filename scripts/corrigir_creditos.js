const mysql = require('mysql2/promise');

async function corrigirCreditos() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    console.log('🔧 Corrigindo créditos das equipes...\n');
    
    // 1. Ver pedidos existentes
    const [pedidos] = await conn.execute(`
      SELECT id, equipe_id, valor_total, status, created_at 
      FROM pedidos 
      ORDER BY created_at DESC
    `);
    
    if (pedidos.length > 0) {
      console.log('📋 Pedidos existentes:');
      pedidos.forEach(p => {
        console.log(`   • Pedido #${p.id} - Equipe ${p.equipe_id} - R$ ${parseFloat(p.valor_total).toFixed(2)} - Status: ${p.status}`);
      });
      console.log('');
    }
    
    // 2. Recalcular crédito disponível para cada equipe
    console.log('🔄 Recalculando créditos...\n');
    
    // Buscar todas as equipes
    const [equipes] = await conn.execute('SELECT id, nome, limite_credito FROM equipes');
    
    for (const equipe of equipes) {
      // Somar valor total dos pedidos APROVADOS dessa equipe
      const [resultado] = await conn.execute(`
        SELECT COALESCE(SUM(valor_total), 0) as total_usado
        FROM pedidos
        WHERE equipe_id = ? AND status = 'Aprovado'
      `, [equipe.id]);
      
      const totalUsado = parseFloat(resultado[0].total_usado || 0);
      const limiteTotal = parseFloat(equipe.limite_credito || 0);
      const limiteDisponivel = limiteTotal - totalUsado;
      
      // Atualizar limite disponível
      await conn.execute(`
        UPDATE equipes 
        SET limite_disponivel = ? 
        WHERE id = ?
      `, [limiteDisponivel, equipe.id]);
      
      console.log(`✅ ${equipe.nome}: Total R$ ${limiteTotal.toFixed(2)} - Usado R$ ${totalUsado.toFixed(2)} = Disponível R$ ${limiteDisponivel.toFixed(2)}`);
    }
    
    // 3. Mostrar resultado final
    console.log('\n📊 Status Final:');
    const [equipesAtualizadas] = await conn.execute(`
      SELECT 
        id, 
        nome, 
        limite_credito,
        limite_disponivel,
        (limite_credito - limite_disponivel) as credito_usado
      FROM equipes 
      ORDER BY nome
    `);
    
    console.log('┌─────┬──────────────────────────────────┬─────────────┬──────────────┬──────────────┐');
    console.log('│ ID  │ Nome                             │ Lim. Total  │ Disponível   │ Usado        │');
    console.log('├─────┼──────────────────────────────────┼─────────────┼──────────────┼──────────────┤');
    
    equipesAtualizadas.forEach(equipe => {
      const id = String(equipe.id).padEnd(3);
      const nome = String(equipe.nome || '').substring(0, 32).padEnd(32);
      const limiteTotal = `R$ ${parseFloat(equipe.limite_credito || 0).toFixed(2)}`.padStart(11);
      const disponivel = `R$ ${parseFloat(equipe.limite_disponivel || 0).toFixed(2)}`.padStart(12);
      const usado = `R$ ${parseFloat(equipe.credito_usado || 0).toFixed(2)}`.padStart(12);
      console.log(`│ ${id} │ ${nome} │ ${limiteTotal} │ ${disponivel} │ ${usado} │`);
    });
    
    console.log('└─────┴──────────────────────────────────┴─────────────┴──────────────┴──────────────┘');
    
    console.log('\n✨ Créditos corrigidos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await conn.end();
  }
}

corrigirCreditos();
