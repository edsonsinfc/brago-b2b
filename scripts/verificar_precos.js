const mysql = require('mysql2/promise');

async function verificarPrecos() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'nexus_b2b'
  });
  
  try {
    console.log('🔍 Verificando preços dos produtos...\n');
    
    const [produtos] = await conn.execute(`
      SELECT codprod, descricao, preco 
      FROM produtos 
      ORDER BY codprod 
      LIMIT 15
    `);
    
    console.log('Produtos cadastrados:');
    console.log(''.padEnd(80, '='));
    
    let comPreco = 0;
    let semPreco = 0;
    
    produtos.forEach(p => {
      const preco = Number(p.preco || 0);
      const status = preco > 0 ? '✅' : '❌';
      console.log(`${status} ${p.codprod.padEnd(12)} ${(p.descricao || '').substring(0, 45).padEnd(45)} R$ ${preco.toFixed(2)}`);
      
      if (preco > 0) comPreco++;
      else semPreco++;
    });
    
    console.log(''.padEnd(80, '='));
    console.log(`\n📊 Total: ${produtos.length} produtos`);
    console.log(`✅ Com preço: ${comPreco}`);
    console.log(`❌ Sem preço: ${semPreco}`);
    
    if (semPreco > 0) {
      console.log('\n⚠️  ATENÇÃO: Há produtos sem preço cadastrado!');
      console.log('Para cadastrar preços, você pode:');
      console.log('1. Acessar o Gestor e editar os produtos');
      console.log('2. Executar um UPDATE SQL: UPDATE produtos SET preco = [valor] WHERE codprod = [codigo]');
    }
    
  } finally {
    await conn.end();
  }
}

verificarPrecos().catch(console.error);
