const db = require('../src/config/db.mysql');

async function atribuirProdutosEquipe2() {
  const connection = await db.getConnection();
  
  try {
    const equipeId = 2; // Oba Aguas Claras
    
    console.log(`🔄 Atribuindo produtos com cont_oba='S' para equipe ID ${equipeId}...\n`);
    
    // Buscar produtos com cont_oba='S' e ativo=1
    const [produtos] = await connection.query(
      `SELECT id, codprod, descricao FROM produtos WHERE cont_oba = 'S' AND ativo = 1`
    );
    
    console.log(`📦 Encontrados ${produtos.length} produtos para atribuir:\n`);
    
    let atribuidos = 0;
    for (const produto of produtos) {
      // Verificar se já existe
      const [existing] = await connection.query(
        'SELECT id FROM equipe_produtos WHERE equipe_id = ? AND produto_id = ?',
        [equipeId, produto.id]
      );
      
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO equipe_produtos (equipe_id, produto_id) VALUES (?, ?)',
          [equipeId, produto.id]
        );
        console.log(`✅ Atribuído: ${produto.codprod} - ${produto.descricao}`);
        atribuidos++;
      } else {
        console.log(`⏭️  Já atribuído: ${produto.codprod} - ${produto.descricao}`);
      }
    }
    
    console.log(`\n✅ Total: ${atribuidos} produtos atribuídos com sucesso!`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

atribuirProdutosEquipe2();
