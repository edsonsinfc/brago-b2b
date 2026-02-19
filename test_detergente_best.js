const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'nexus_b2b',
    charset: 'utf8mb4'
  });

  console.log('🔍 Verificando DETERGENTE NEUTRO BEST...\n');

  // Buscar produto Best
  const [produtos] = await connection.execute(`
    SELECT id, codprod, descricao, acesso_especifico, ativo
    FROM produtos 
    WHERE descricao LIKE '%BEST%' AND descricao LIKE '%DETERGENTE%'
  `);

  if (produtos.length > 0) {
    const produto = produtos[0];
    console.log('📦 Produto encontrado:');
    console.log('   ID:', produto.id);
    console.log('   Código:', produto.codprod);
    console.log('   Descrição:', produto.descricao);
    console.log('   Acesso Específico:', produto.acesso_especifico);
    console.log('   Ativo:', produto.ativo);
    console.log('');

    // Verificar se tem restrições de equipe
    const [restricoes] = await connection.execute(`
      SELECT equipe_id, e.nome as equipe_nome
      FROM produtos_equipes_especificas pe
      LEFT JOIN equipes e ON e.id = pe.equipe_id
      WHERE pe.produto_id = ?
    `, [produto.id]);

    if (restricoes.length > 0) {
      console.log('🔒 Produto RESTRITO às seguintes equipes:');
      restricoes.forEach(r => {
        console.log(`   - ${r.equipe_nome} (ID: ${r.equipe_id})`);
      });
    } else {
      console.log('✅ Produto DISPONÍVEL para todas as equipes');
    }
  } else {
    console.log('❌ Produto não encontrado');
  }

  await connection.end();
}

test().catch(console.error);
