const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nexus_b2b'
});

async function corrigirLimiteNegativo() {
  try {
    console.log('🔍 Buscando equipes com limite negativo...\n');
    
    const [equipes] = await pool.execute(`
      SELECT id, nome, limite_credito, limite_disponivel
      FROM equipes
      WHERE limite_disponivel < 0
    `);
    
    if (equipes.length === 0) {
      console.log('✅ Nenhuma equipe com limite negativo encontrada.');
      await pool.end();
      return;
    }
    
    console.log(`⚠️  Encontradas ${equipes.length} equipe(s) com limite negativo:\n`);
    
    for (const equipe of equipes) {
      console.log(`📊 ${equipe.nome}:`);
      console.log(`   Limite Total: R$ ${Number(equipe.limite_credito).toFixed(2)}`);
      console.log(`   Limite Disponível: R$ ${Number(equipe.limite_disponivel).toFixed(2)}`);
      
      // Calcular quanto precisa aumentar
      const limiteNegativo = Number(equipe.limite_disponivel);
      const aumentoNecessario = Math.abs(limiteNegativo) + 1000; // +R$ 1000 de margem
      
      console.log(`   💡 Sugestão: Aumentar limite em R$ ${aumentoNecessario.toFixed(2)}\n`);
      
      // Aplicar correção
      await pool.execute(`
        UPDATE equipes
        SET limite_credito = limite_credito + ?,
            limite_disponivel = limite_disponivel + ?
        WHERE id = ?
      `, [aumentoNecessario, aumentoNecessario, equipe.id]);
      
      console.log(`   ✅ Limite corrigido!`);
      console.log(`   Novo Limite Total: R$ ${(Number(equipe.limite_credito) + aumentoNecessario).toFixed(2)}`);
      console.log(`   Novo Limite Disponível: R$ ${(limiteNegativo + aumentoNecessario).toFixed(2)}\n`);
    }
    
    console.log('✨ Correção concluída!\n');
    
    // Mostrar resumo
    const [resumo] = await pool.execute(`
      SELECT nome, limite_credito, limite_disponivel,
             (limite_credito - limite_disponivel) as utilizado
      FROM equipes
      ORDER BY nome
    `);
    
    console.log('📊 Resumo de limites após correção:\n');
    console.table(resumo.map(e => ({
      Equipe: e.nome,
      'Limite Total': `R$ ${Number(e.limite_credito).toFixed(2)}`,
      'Disponível': `R$ ${Number(e.limite_disponivel).toFixed(2)}`,
      'Utilizado': `R$ ${Number(e.utilizado).toFixed(2)}`
    })));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

corrigirLimiteNegativo();
