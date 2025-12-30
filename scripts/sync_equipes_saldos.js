const pool = require('../src/config/db.mysql');

async function syncSaldos() {
  console.log('🔄 Sincronizando saldos das equipes...\n');
  
  try {
    // Buscar todas as equipes
    const [equipes] = await pool.execute('SELECT id, nome, limite_total, saldo_atual, limite_credito, limite_disponivel FROM equipes');
    
    console.log(`📊 Encontradas ${equipes.length} equipes\n`);
    
    for (const equipe of equipes) {
      console.log(`\nEquipe #${equipe.id} - ${equipe.nome}:`);
      console.log(`  Antes:`);
      console.log(`    limite_total: ${equipe.limite_total}`);
      console.log(`    saldo_atual: ${equipe.saldo_atual}`);
      console.log(`    limite_credito: ${equipe.limite_credito}`);
      console.log(`    limite_disponivel: ${equipe.limite_disponivel}`);
      
      // Usar limite_credito como referência (ou limite_total se não existir)
      const limiteReferencia = equipe.limite_credito || equipe.limite_total;
      const saldoReferencia = equipe.limite_disponivel !== null ? equipe.limite_disponivel : equipe.saldo_atual;
      
      // Atualizar para manter consistência
      await pool.execute(
        `UPDATE equipes 
         SET limite_total = ?, 
             saldo_atual = ?,
             limite_credito = ?,
             limite_disponivel = ?
         WHERE id = ?`,
        [limiteReferencia, saldoReferencia, limiteReferencia, saldoReferencia, equipe.id]
      );
      
      console.log(`  Depois:`);
      console.log(`    limite_total: ${limiteReferencia}`);
      console.log(`    saldo_atual: ${saldoReferencia}`);
      console.log(`    limite_credito: ${limiteReferencia}`);
      console.log(`    limite_disponivel: ${saldoReferencia}`);
      console.log(`  ✅ Sincronizado`);
    }
    
    console.log('\n✅ Sincronização concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao sincronizar:', error);
  } finally {
    await pool.end();
  }
}

syncSaldos();
