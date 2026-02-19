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

  console.log('🔍 Teste de restrição de produto Rexona (ID 42)\n');

  // Verificar produto
  const [produto] = await connection.execute(`
    SELECT id, codprod, descricao, acesso_especifico, categoria_facility, categoria_manipulacao
    FROM produtos WHERE id = 42
  `);
  console.log('📦 Produto:', produto[0]);

  // Verificar equipes com acesso
  const [equipes] = await connection.execute(`
    SELECT pe.equipe_id, e.nome 
    FROM produtos_equipes_especificas pe
    JOIN equipes e ON e.id = pe.equipe_id
    WHERE pe.produto_id = 42
  `);
  console.log('\n🔒 Equipes com acesso:', equipes);

  // Simular query ANTIGA (COM BUG) para solicitante de outra equipe (ex: equipe 18)
  const categoriaFilter = 'p.categoria_facility = 1';
  const equipeOutra = [18]; // equipe que NÃO tem acesso ao Rexona
  
  const [resultadoAntigo] = await connection.execute(`
    SELECT DISTINCT p.id, p.codprod, p.descricao, p.acesso_especifico
    FROM produtos p
    LEFT JOIN produtos_equipes_especificas pe ON p.id = pe.produto_id
    WHERE p.ativo = 1
    AND (
      (${categoriaFilter})
      OR (p.acesso_especifico = 1 AND pe.equipe_id IN (${equipeOutra.join(',')}))
    )
    AND p.id = 42
  `);
  console.log('\n❌ Query ANTIGA (com bug) - equipe 18 vê Rexona?', resultadoAntigo.length > 0 ? 'SIM (BUG!)' : 'NÃO');

  // Simular query NOVA (CORRIGIDA) para solicitante de outra equipe
  const [resultadoNovo] = await connection.execute(`
    SELECT DISTINCT p.id, p.codprod, p.descricao, p.acesso_especifico
    FROM produtos p
    LEFT JOIN produtos_equipes_especificas pe ON p.id = pe.produto_id
    WHERE p.ativo = 1
    AND (
      (${categoriaFilter} AND (p.acesso_especifico = 0 OR p.acesso_especifico IS NULL))
      OR (p.acesso_especifico = 1 AND pe.equipe_id IN (${equipeOutra.join(',')}))
    )
    AND p.id = 42
  `);
  console.log('✅ Query NOVA (corrigida) - equipe 18 vê Rexona?', resultadoNovo.length > 0 ? 'SIM' : 'NÃO (correto!)');

  // Simular query NOVA para equipe 37 (JARDIM BOTÂNICO - tem acesso)
  const equipeCorreta = [37];
  const [resultadoCorreto] = await connection.execute(`
    SELECT DISTINCT p.id, p.codprod, p.descricao, p.acesso_especifico
    FROM produtos p
    LEFT JOIN produtos_equipes_especificas pe ON p.id = pe.produto_id
    WHERE p.ativo = 1
    AND (
      (${categoriaFilter} AND (p.acesso_especifico = 0 OR p.acesso_especifico IS NULL))
      OR (p.acesso_especifico = 1 AND pe.equipe_id IN (${equipeCorreta.join(',')}))
    )
    AND p.id = 42
  `);
  console.log('✅ Query NOVA (corrigida) - equipe 37 vê Rexona?', resultadoCorreto.length > 0 ? 'SIM (correto!)' : 'NÃO');

  await connection.end();
}

test().catch(console.error);
