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

  console.log('='.repeat(80));
  console.log('🔍 DIAGNÓSTICO: ONDE ESTÁ O PROBLEMA?');
  console.log('='.repeat(80));

  // TESTE 1: O que o filtro por manipulacao retorna?
  console.log('\n📋 TESTE 1: Query com WHERE categoria_acesso = "manipulacao"');
  const [filtrados] = await connection.execute(`
    SELECT id, nome, categoria_acesso, perfil
    FROM usuarios 
    WHERE categoria_acesso = 'manipulacao'
    ORDER BY nome
  `);
  console.log(`   Resultado: ${filtrados.length} usuários`);
  filtrados.forEach(u => console.log(`   [${u.id}] ${u.nome} → ${u.categoria_acesso}`));

  // TESTE 2: Qual a categoria real de cada um dos IDs da imagem?
  console.log('\n📋 TESTE 2: Categorias reais dos 21 IDs da imagem');
  const ids = [12, 36, 44, 33, 32, 18, 42, 14, 50, 52, 38, 22, 16, 28, 29, 46, 47, 25, 24, 40, 20];
  const [reais] = await connection.execute(`
    SELECT id, nome, categoria_acesso
    FROM usuarios WHERE id IN (${ids.join(',')})
    ORDER BY nome
  `);
  
  const porCategoria = {};
  reais.forEach(u => {
    const cat = u.categoria_acesso || 'NULL';
    if (!porCategoria[cat]) porCategoria[cat] = [];
    porCategoria[cat].push(u);
  });
  
  Object.entries(porCategoria).forEach(([cat, users]) => {
    console.log(`\n   📂 Categoria "${cat}": ${users.length} usuários`);
    users.forEach(u => console.log(`      [${u.id}] ${u.nome}`));
  });

  // TESTE 3: Existe alguma coluna diferente que pode estar confundindo?
  console.log('\n📋 TESTE 3: Verificar estrutura da tabela usuarios');
  const [colunas] = await connection.execute(`
    SHOW COLUMNS FROM usuarios WHERE Field LIKE '%categ%' OR Field LIKE '%tipo%' OR Field LIKE '%manip%'
  `);
  console.log('   Colunas relacionadas:');
  colunas.forEach(c => console.log(`   - ${c.Field}: ${c.Type} (Default: ${c.Default})`));

  // TESTE 4: Contagem geral de categorias
  console.log('\n📋 TESTE 4: Contagem de categoria_acesso no banco');
  const [contagem] = await connection.execute(`
    SELECT categoria_acesso, COUNT(*) as total 
    FROM usuarios 
    WHERE perfil = 'solicitante'
    GROUP BY categoria_acesso
  `);
  contagem.forEach(c => console.log(`   ${c.categoria_acesso || 'NULL'}: ${c.total} solicitantes`));

  // TESTE 5: Verificar se o problema era que esses users tinham manipulacao e alguém mudou
  console.log('\n📋 TESTE 5: Verificar possível causa');
  console.log('   A interface mostrava "Manipulação" na coluna Categoria para esses 21 IDs');
  console.log('   O banco mostra "facility" para 19 deles');
  console.log('');
  console.log('   HIPÓTESES:');
  console.log('   1. A interface exibe o valor do FILTRO aplicado, não o valor real');
  console.log('   2. Os dados foram alterados por algum script depois');
  console.log('   3. A query do filtro está errada e retorna usuários errados');
  console.log('');
  
  // Simular exatamente a query do backend com filtro manipulacao
  console.log('📋 TESTE 6: Simulando query do backend com filtro manipulacao');
  const [simulacao] = await connection.execute(`
    SELECT u.id, u.nome, u.email, u.perfil, u.ativo, u.categoria_acesso
    FROM usuarios u
    WHERE u.categoria_acesso = ?
    ORDER BY u.nome
    LIMIT 100
  `, ['manipulacao']);
  
  console.log(`   Query retornou ${simulacao.length} resultados:`);
  simulacao.forEach(u => console.log(`   [${u.id}] ${u.nome} - categoria: ${u.categoria_acesso}`));

  await connection.end();
}

test().catch(console.error);
