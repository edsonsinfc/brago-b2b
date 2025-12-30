const db = require('../src/config/db.mysql');

(async () => {
  try {
    // Atribuir produtos com cont_oba='S' para a equipe de teste
    const equipeId = 4; // Oba Hortifruti - Área de Manipulação
    
    // IDs dos produtos com cont_oba='S' (17-24)
    const produtosS = [17, 18, 19, 20, 21, 22, 23, 24];
    
    console.log(`\n📝 Atribuindo ${produtosS.length} produtos com cont_oba='S' para equipe ID ${equipeId}...\n`);
    
    for (const produtoId of produtosS) {
      // Verificar se já existe
      const [existe] = await db.query(`
        SELECT id FROM equipe_produtos 
        WHERE equipe_id = ? AND produto_id = ?
      `, [equipeId, produtoId]);
      
      if (existe.length === 0) {
        await db.query(`
          INSERT INTO equipe_produtos (equipe_id, produto_id)
          VALUES (?, ?)
        `, [equipeId, produtoId]);
        
        const [produto] = await db.query('SELECT codprod, descricao FROM produtos WHERE id = ?', [produtoId]);
        console.log(`✅ Atribuído: ${produto[0].codprod} - ${produto[0].descricao}`);
      } else {
        console.log(`⏭️  Produto ID ${produtoId} já estava atribuído`);
      }
    }
    
    console.log('\n✅ Atribuição concluída!');
    console.log('Agora os usuários da equipe ID 4 devem ver esses produtos no menu.\n');
    
    await db.end();
  } catch (e) {
    console.error('❌ Erro:', e.message);
    process.exit(1);
  }
})();
