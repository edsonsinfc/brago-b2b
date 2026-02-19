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
  console.log('📊 RELATÓRIO: SOLICITANTES DE MANIPULAÇÃO POR EQUIPE');
  console.log('='.repeat(80));

  // Buscar todas as equipes
  const [equipes] = await connection.execute(`
    SELECT id, nome FROM equipes ORDER BY nome
  `);

  console.log(`\n🏢 Total de equipes: ${equipes.length}\n`);

  let equipesComSolicitantes = 0;
  let equipesSemSolicitantes = 0;

  for (const equipe of equipes) {
    // Buscar solicitantes da equipe
    const [solicitantes] = await connection.execute(`
      SELECT u.id, u.nome, u.email, u.categoria_acesso, u.ativo
      FROM usuarios u
      INNER JOIN usuarios_equipes ue ON ue.usuario_id = u.id
      WHERE ue.equipe_id = ?
      AND u.perfil = 'solicitante'
      ORDER BY u.nome
    `, [equipe.id]);

    // Filtrar por categoria
    const solicitantesManipulacao = solicitantes.filter(s => 
      s.categoria_acesso === 'manipulacao' || s.categoria_acesso === 'ambas'
    );

    const solicitantesFacility = solicitantes.filter(s => 
      s.categoria_acesso === 'facility' || s.categoria_acesso === 'ambas'
    );

    const solicitantesAtivosManipulacao = solicitantesManipulacao.filter(s => s.ativo);
    const solicitantesAtivosFacility = solicitantesFacility.filter(s => s.ativo);

    console.log(`🏪 ${equipe.nome} (ID: ${equipe.id})`);
    console.log(`   Total de solicitantes: ${solicitantes.length}`);
    console.log(`   📦 Facility: ${solicitantesFacility.length} (${solicitantesAtivosFacility.length} ativos)`);
    console.log(`   💊 Manipulação: ${solicitantesManipulacao.length} (${solicitantesAtivosManipulacao.length} ativos)`);

    if (solicitantesAtivosManipulacao.length > 0) {
      equipesComSolicitantes++;
      solicitantesAtivosManipulacao.forEach(s => {
        const badge = s.categoria_acesso === 'ambas' ? '🔄' : '💊';
        console.log(`      ${badge} ${s.nome} (${s.email}) - ${s.categoria_acesso}`);
      });
    } else {
      equipesSemSolicitantes++;
      console.log(`      ⚠️  NENHUM SOLICITANTE ATIVO DE MANIPULAÇÃO`);
      if (solicitantesManipulacao.length > 0) {
        console.log(`      (${solicitantesManipulacao.length} inativos)`);
      }
    }
    console.log('');
  }

  // Resumo
  console.log('='.repeat(80));
  console.log('📊 RESUMO');
  console.log('='.repeat(80));
  console.log(`Total de equipes: ${equipes.length}`);
  console.log(`✅ Equipes COM solicitantes ativos de manipulação: ${equipesComSolicitantes}`);
  console.log(`❌ Equipes SEM solicitantes ativos de manipulação: ${equipesSemSolicitantes}`);

  if (equipesSemSolicitantes > 0) {
    console.log('\n⚠️  ATENÇÃO: As seguintes equipes NÃO possuem solicitantes de manipulação:');
    for (const equipe of equipes) {
      const [solicitantes] = await connection.execute(`
        SELECT u.id, u.nome, u.categoria_acesso, u.ativo
        FROM usuarios u
        INNER JOIN usuarios_equipes ue ON ue.usuario_id = u.id
        WHERE ue.equipe_id = ?
        AND u.perfil = 'solicitante'
        AND u.ativo = 1
        AND (u.categoria_acesso = 'manipulacao' OR u.categoria_acesso = 'ambas')
      `, [equipe.id]);

      if (solicitantes.length === 0) {
        console.log(`   - ${equipe.nome} (ID: ${equipe.id})`);
      }
    }
  }

  await connection.end();
}

test().catch(console.error);
