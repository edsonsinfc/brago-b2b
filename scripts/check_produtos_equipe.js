const db = require('../src/config/db.mysql');

(async () => {
  try {
    console.log('\n🔍 Verificando produtos com cont_oba = "S"...\n');
    
    // Buscar produtos com cont_oba = 'S'
    const [produtosS] = await db.query(`
      SELECT id, codprod, descricao, cont_oba, ativo 
      FROM produtos 
      WHERE cont_oba = 'S'
      ORDER BY codprod
    `);
    
    console.log(`📦 ${produtosS.length} produto(s) com cont_oba = 'S':`);
    produtosS.forEach(p => {
      console.log(`  - ID: ${p.id} | Código: ${p.codprod} | ${p.descricao} | Ativo: ${p.ativo}`);
    });
    
    console.log('\n👥 Verificando atribuições na tabela equipe_produtos...\n');
    
    // Buscar todas as equipes
    const [equipes] = await db.query(`SELECT id, nome FROM equipes`);
    
    for (const equipe of equipes) {
      const [atribuicoes] = await db.query(`
        SELECT ep.*, p.codprod, p.descricao 
        FROM equipe_produtos ep
        INNER JOIN produtos p ON p.id = ep.produto_id
        WHERE ep.equipe_id = ?
      `, [equipe.id]);
      
      console.log(`🏢 Equipe: ${equipe.nome} (ID: ${equipe.id})`);
      if (atribuicoes.length === 0) {
        console.log(`   ❌ Nenhum produto atribuído\n`);
      } else {
        console.log(`   ✅ ${atribuicoes.length} produto(s) atribuído(s):`);
        atribuicoes.forEach(a => {
          console.log(`      - ${a.codprod} - ${a.descricao}`);
        });
        console.log('');
      }
    }
    
    console.log('\n💡 Para que produtos com cont_oba="S" apareçam:');
    console.log('   1. O produto deve ter cont_oba = "S"');
    console.log('   2. O produto deve ter ativo = 1');
    console.log('   3. O produto deve estar na tabela equipe_produtos vinculado à equipe do usuário\n');
    
    await db.end();
  } catch (e) {
    console.error('❌ Erro:', e.message);
    process.exit(1);
  }
})();
