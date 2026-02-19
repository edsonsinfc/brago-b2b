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
  console.log('📦 RELATÓRIO COMPLETO DE PRODUTOS E RESTRIÇÕES');
  console.log('='.repeat(80));

  // Buscar todos os produtos ativos
  const [produtos] = await connection.execute(`
    SELECT p.id, p.codprod, p.descricao, p.acesso_especifico, p.ativo,
           p.categoria_facility, p.categoria_manipulacao, p.estoque, p.cont_oba
    FROM produtos p
    WHERE p.ativo = 1
    ORDER BY p.descricao
  `);

  console.log(`\n📊 Total de produtos ativos: ${produtos.length}\n`);

  // Buscar todas as restrições de equipe
  const [restricoes] = await connection.execute(`
    SELECT pe.produto_id, pe.equipe_id, e.nome as equipe_nome
    FROM produtos_equipes_especificas pe
    JOIN equipes e ON e.id = pe.equipe_id
    ORDER BY pe.produto_id
  `);

  // Agrupar restrições por produto
  const restricoesPorProduto = {};
  restricoes.forEach(r => {
    if (!restricoesPorProduto[r.produto_id]) restricoesPorProduto[r.produto_id] = [];
    restricoesPorProduto[r.produto_id].push(r);
  });

  // Buscar todas as equipes
  const [equipes] = await connection.execute(`SELECT id, nome FROM equipes ORDER BY nome`);
  console.log(`🏢 Total de equipes ativas: ${equipes.length}`);
  equipes.forEach(e => console.log(`   - [${e.id}] ${e.nome}`));

  // Buscar todos os solicitantes e suas equipes
  const [solicitantes] = await connection.execute(`
    SELECT u.id, u.nome, u.categoria_acesso, ue.equipe_id, e.nome as equipe_nome
    FROM usuarios u
    JOIN usuarios_equipes ue ON u.id = ue.usuario_id
    JOIN equipes e ON e.id = ue.equipe_id
    WHERE u.perfil = 'solicitante' AND u.ativo = 1
    ORDER BY u.nome, e.nome
  `);

  // Agrupar solicitantes por equipe
  const solicitantesPorEquipe = {};
  solicitantes.forEach(s => {
    if (!solicitantesPorEquipe[s.equipe_id]) solicitantesPorEquipe[s.equipe_id] = { nome: s.equipe_nome, solicitantes: [] };
    solicitantesPorEquipe[s.equipe_id].solicitantes.push(s);
  });

  console.log('\n' + '='.repeat(80));
  console.log('📋 DETALHES POR PRODUTO');
  console.log('='.repeat(80));

  let problemasEncontrados = 0;

  for (const p of produtos) {
    const categoria = [];
    if (p.categoria_facility) categoria.push('FACILITY');
    if (p.categoria_manipulacao) categoria.push('MANIPULAÇÃO');
    const catStr = categoria.length > 0 ? categoria.join(' + ') : 'NENHUMA';

    const restricoesDoP = restricoesPorProduto[p.id] || [];
    const temRestricao = p.acesso_especifico === 1;

    console.log(`\n📦 [${p.codprod}] ${p.descricao}`);
    console.log(`   ID: ${p.id} | Categoria: ${catStr} | Estoque: ${p.estoque} | OBA: ${p.cont_oba || 'N'}`);
    console.log(`   Acesso Específico: ${temRestricao ? '🔒 SIM (restrito)' : '🌐 NÃO (todos)'}`);

    if (temRestricao) {
      if (restricoesDoP.length > 0) {
        console.log(`   🔑 Equipes com acesso:`);
        restricoesDoP.forEach(r => console.log(`      ✅ ${r.equipe_nome} (ID: ${r.equipe_id})`));
      } else {
        console.log(`   ⚠️  PROBLEMA: acesso_especifico = 1 mas NENHUMA equipe vinculada!`);
        problemasEncontrados++;
      }
    }

    if (!temRestricao && restricoesDoP.length > 0) {
      console.log(`   ⚠️  INCONSISTÊNCIA: acesso_especifico = 0 mas tem ${restricoesDoP.length} equipe(s) vinculada(s)!`);
      restricoesDoP.forEach(r => console.log(`      - ${r.equipe_nome} (ID: ${r.equipe_id})`));
      problemasEncontrados++;
    }
  }

  // Testar a query corrigida para cada equipe
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTE: Produtos visíveis por equipe (query CORRIGIDA)');
  console.log('='.repeat(80));

  for (const equipe of equipes) {
    // Simular query para solicitante facility
    const [produtosFacility] = await connection.execute(`
      SELECT DISTINCT p.id, p.codprod, p.descricao, p.acesso_especifico
      FROM produtos p
      LEFT JOIN produtos_equipes_especificas pe ON p.id = pe.produto_id
      WHERE p.ativo = 1
      AND (
        (p.categoria_facility = 1 AND (p.acesso_especifico = 0 OR p.acesso_especifico IS NULL))
        OR (p.acesso_especifico = 1 AND pe.equipe_id IN (${equipe.id}))
      )
      ORDER BY p.descricao
    `);

    const restritos = produtosFacility.filter(p => p.acesso_especifico === 1);
    
    console.log(`\n🏢 ${equipe.nome} (ID: ${equipe.id}) - ${produtosFacility.length} produtos visíveis`);
    if (restritos.length > 0) {
      restritos.forEach(r => console.log(`   🔒 [RESTRITO] ${r.codprod} - ${r.descricao}`));
    }
  }

  // Resumo
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO');
  console.log('='.repeat(80));
  console.log(`Total de produtos ativos: ${produtos.length}`);
  console.log(`Produtos com acesso_especifico = 1 (restritos): ${produtos.filter(p => p.acesso_especifico === 1).length}`);
  console.log(`Produtos com acesso_especifico = 0 (todos): ${produtos.filter(p => p.acesso_especifico === 0 || p.acesso_especifico === null).length}`);
  console.log(`Problemas encontrados: ${problemasEncontrados}`);

  await connection.end();
}

test().catch(console.error);
