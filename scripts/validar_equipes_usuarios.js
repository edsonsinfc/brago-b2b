const mysql = require('mysql2/promise');

async function validarEquipesUsuarios() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  console.log('📋 VALIDAÇÃO DE EQUIPES E USUÁRIOS\n');
  console.log('='.repeat(80));

  // Buscar todas as equipes
  const [equipes] = await conn.query(`
    SELECT id, nome 
    FROM equipes 
    ORDER BY nome
  `);

  console.log(`\n✅ Total de equipes: ${equipes.length}\n`);

  // Buscar usuários que têm acesso a todas as equipes (16 equipes)
  const [usuariosComAcessoTotal] = await conn.query(`
    SELECT u.id, u.nome, u.perfil, COUNT(ue.equipe_id) as total_equipes
    FROM usuarios u
    JOIN usuarios_equipes ue ON u.id = ue.usuario_id
    GROUP BY u.id
    HAVING COUNT(ue.equipe_id) >= 16
    ORDER BY u.nome
  `);

  console.log('👥 Usuários com acesso a TODAS as equipes (serão excluídos da validação):');
  console.log('-'.repeat(80));
  usuariosComAcessoTotal.forEach(u => {
    console.log(`   ${u.nome} (${u.perfil}) - ${u.total_equipes} equipes`);
  });

  const idsExcluir = usuariosComAcessoTotal.map(u => u.id);

  console.log('\n' + '='.repeat(80));
  console.log('📊 ANÁLISE POR EQUIPE:\n');

  let equipeSemGestor = [];
  let equipeSemSolicitante = [];
  let equipesCompletas = [];

  for (const equipe of equipes) {
    // Buscar gestores da equipe (excluindo os que têm acesso total)
    const [gestores] = await conn.query(`
      SELECT u.id, u.nome, u.email
      FROM usuarios u
      JOIN usuarios_equipes ue ON u.id = ue.usuario_id
      WHERE ue.equipe_id = ?
      AND u.perfil = 'gestor'
      ${idsExcluir.length > 0 ? `AND u.id NOT IN (${idsExcluir.join(',')})` : ''}
      ORDER BY u.nome
    `, [equipe.id]);

    // Buscar solicitantes da equipe (excluindo os que têm acesso total)
    const [solicitantes] = await conn.query(`
      SELECT u.id, u.nome, u.email
      FROM usuarios u
      JOIN usuarios_equipes ue ON u.id = ue.usuario_id
      WHERE ue.equipe_id = ?
      AND u.perfil = 'solicitante'
      ${idsExcluir.length > 0 ? `AND u.id NOT IN (${idsExcluir.join(',')})` : ''}
      ORDER BY u.nome
    `, [equipe.id]);

    const temGestor = gestores.length > 0;
    const temSolicitante = solicitantes.length > 0;

    if (!temGestor || !temSolicitante) {
      console.log(`⚠️  ${equipe.nome} (ID: ${equipe.id})`);
      
      if (!temGestor) {
        console.log(`   ❌ SEM GESTOR`);
        equipeSemGestor.push(equipe);
      } else {
        console.log(`   ✅ Gestores: ${gestores.length}`);
        gestores.forEach(g => console.log(`      - ${g.nome} (${g.email})`));
      }

      if (!temSolicitante) {
        console.log(`   ❌ SEM SOLICITANTE`);
        equipeSemSolicitante.push(equipe);
      } else {
        console.log(`   ✅ Solicitantes: ${solicitantes.length}`);
        solicitantes.forEach(s => console.log(`      - ${s.nome} (${s.email})`));
      }
      
      console.log('');
    } else {
      equipesCompletas.push(equipe);
      console.log(`✅ ${equipe.nome} (ID: ${equipe.id})`);
      console.log(`   Gestores: ${gestores.length} | Solicitantes: ${solicitantes.length}`);
      console.log('');
    }
  }

  console.log('='.repeat(80));
  console.log('\n📈 RESUMO:\n');
  console.log(`✅ Equipes completas (com gestor E solicitante): ${equipesCompletas.length}`);
  console.log(`⚠️  Equipes SEM gestor: ${equipeSemGestor.length}`);
  console.log(`⚠️  Equipes SEM solicitante: ${equipeSemSolicitante.length}`);

  if (equipeSemGestor.length > 0) {
    console.log('\n❌ Equipes sem GESTOR:');
    equipeSemGestor.forEach(e => console.log(`   - ${e.nome} (ID: ${e.id})`));
  }

  if (equipeSemSolicitante.length > 0) {
    console.log('\n❌ Equipes sem SOLICITANTE:');
    equipeSemSolicitante.forEach(e => console.log(`   - ${e.nome} (ID: ${e.id})`));
  }

  console.log('\n' + '='.repeat(80));

  await conn.end();
}

validarEquipesUsuarios().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
