// Verificar se produtos têm imagem_url
const pool = require('../src/config/db.mysql');

async function verificarImagensProdutos() {
  console.log('🔍 Verificando imagens dos produtos...\n');
  
  try {
    const [produtos] = await pool.execute(`
      SELECT id, codigo, descricao, imagem_url, preco
      FROM produtos 
      LIMIT 10
    `);
    
    console.log(`📊 Primeiros 10 produtos:\n`);
    
    produtos.forEach(p => {
      console.log(`#${p.id} - ${p.codigo}`);
      console.log(`  Descrição: ${p.descricao}`);
      console.log(`  Imagem URL: ${p.imagem_url || '❌ SEM IMAGEM'}`);
      console.log(`  Preço: R$ ${p.preco}`);
      console.log('');
    });
    
    const [[{ total, comImagem, semImagem }]] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN imagem_url IS NOT NULL AND imagem_url != '' THEN 1 ELSE 0 END) as comImagem,
        SUM(CASE WHEN imagem_url IS NULL OR imagem_url = '' THEN 1 ELSE 0 END) as semImagem
      FROM produtos
    `);
    
    console.log('📈 Estatísticas:');
    console.log(`  Total de produtos: ${total}`);
    console.log(`  Com imagem: ${comImagem}`);
    console.log(`  Sem imagem: ${semImagem}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

verificarImagensProdutos();
