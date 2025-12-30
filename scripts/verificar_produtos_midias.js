const mysql = require('mysql2/promise');

async function verificar() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    // Produtos
    const [produtos] = await pool.query('SELECT id, codprod, descricao FROM produtos LIMIT 3');
    console.log('\n📦 Produtos disponíveis:');
    produtos.forEach(p => console.log(`  - ${p.codprod}: ${p.descricao} (ID: ${p.id})`));
    
    // Estatísticas
    const [stats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM produtos_imagens) as imgs,
        (SELECT COUNT(*) FROM produtos_videos) as vids,
        (SELECT COUNT(*) FROM produtos_especificacoes) as specs
    `);
    
    console.log('\n📊 Estatísticas de Mídias:');
    console.log(`  - Imagens: ${stats[0].imgs}`);
    console.log(`  - Vídeos: ${stats[0].vids}`);
    console.log(`  - Especificações: ${stats[0].specs}`);
    
    // Detalhes do produto LMP001
    const [detalhes] = await pool.query(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM produtos_imagens WHERE produto_id = p.id) as total_imagens,
        (SELECT COUNT(*) FROM produtos_videos WHERE produto_id = p.id) as total_videos,
        (SELECT COUNT(*) FROM produtos_especificacoes WHERE produto_id = p.id) as total_specs
      FROM produtos p
      WHERE p.codprod = 'LMP001'
    `);
    
    if (detalhes.length > 0) {
      console.log('\n🔍 Detalhes do produto LMP001:');
      console.log(`  - Imagens: ${detalhes[0].total_imagens}`);
      console.log(`  - Vídeos: ${detalhes[0].total_videos}`);
      console.log(`  - Especificações: ${detalhes[0].total_specs}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificar();
