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

  console.log('🔍 Verificando produto ID 42 (Rexona)...\n');

  // Testar a query exatamente como está no código
  const [rows] = await connection.execute(`
    SELECT p.id, p.codprod, p.descricao, p.acesso_especifico,
    (
      SELECT GROUP_CONCAT(DISTINCT pe2.equipe_id)
      FROM produtos_equipes_especificas pe2
      WHERE pe2.produto_id = p.id
    ) as equipes_com_acesso
    FROM produtos p
    WHERE p.id = 42
  `);

  console.log('📦 Resultado da query:', rows);

  // Verificar também a tabela de relacionamento diretamente
  const [relacoes] = await connection.execute(`
    SELECT * FROM produtos_equipes_especificas WHERE produto_id = 42
  `);

  console.log('\n🔗 Relacionamentos na tabela produtos_equipes_especificas:');
  console.log(relacoes);

  await connection.end();
}

test().catch(console.error);
