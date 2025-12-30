const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nexus_b2b'
});

async function sincronizarLimites() {
  try {
    console.log('🔄 Sincronizando limite_total com limite_credito...\n');
    
    const [equipes] = await pool.execute(`
      SELECT id, nome, limite_total, limite_credito, limite_disponivel
      FROM equipes
    `);
    
    console.log('📊 Estado atual:\n');
    console.table(equipes.map(e => ({
      ID: e.id,
      Equipe: e.nome,
      'limite_total (legado)': `R$ ${Number(e.limite_total).toFixed(2)}`,
      'limite_credito (novo)': `R$ ${Number(e.limite_credito).toFixed(2)}`,
      'limite_disponivel': `R$ ${Number(e.limite_disponivel).toFixed(2)}`,
      'Diferença': `R$ ${(Number(e.limite_total) - Number(e.limite_credito)).toFixed(2)}`
    })));
    
    console.log('\n🔧 Aplicando correção: definir limite_total = limite_credito...\n');
    
    for (const equipe of equipes) {
      await pool.execute(`
        UPDATE equipes
        SET limite_total = limite_credito
        WHERE id = ?
      `, [equipe.id]);
      
      console.log(`✅ ${equipe.nome}: limite_total atualizado para R$ ${Number(equipe.limite_credito).toFixed(2)}`);
    }
    
    console.log('\n✨ Sincronização concluída!\n');
    
    // Mostrar resultado final
    const [resultado] = await pool.execute(`
      SELECT id, nome, limite_total, limite_credito, limite_disponivel
      FROM equipes
    `);
    
    console.log('📊 Estado final:\n');
    console.table(resultado.map(e => ({
      ID: e.id,
      Equipe: e.nome,
      'Limite Total': `R$ ${Number(e.limite_total).toFixed(2)}`,
      'Limite Crédito': `R$ ${Number(e.limite_credito).toFixed(2)}`,
      'Disponível': `R$ ${Number(e.limite_disponivel).toFixed(2)}`,
      'Utilizado': `R$ ${(Number(e.limite_credito) - Number(e.limite_disponivel)).toFixed(2)}`
    })));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

sincronizarLimites();
