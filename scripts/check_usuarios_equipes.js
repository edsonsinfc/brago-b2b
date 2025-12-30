const pool = require('../src/config/db.mysql');

async function checkUsuarios() {
  const [usuarios] = await pool.execute(`
    SELECT 
      u.id, 
      u.nome, 
      u.perfil,
      GROUP_CONCAT(ue.equipe_id ORDER BY ue.equipe_id) as equipes_ids,
      GROUP_CONCAT(e.nome ORDER BY ue.equipe_id SEPARATOR ' | ') as equipes_nomes
    FROM usuarios u
    LEFT JOIN usuarios_equipes ue ON ue.usuario_id = u.id
    LEFT JOIN equipes e ON e.id = ue.equipe_id
    WHERE u.perfil != 'admin'
    GROUP BY u.id, u.nome, u.perfil
    ORDER BY u.id
  `);
  
  console.log('\n📊 USUÁRIOS E SUAS EQUIPES:\n');
  console.log('='.repeat(80));
  
  usuarios.forEach(u => {
    const qtdEquipes = u.equipes_ids ? u.equipes_ids.split(',').length : 0;
    const icone = qtdEquipes === 0 ? '⚠️' : qtdEquipes === 1 ? '📍' : '🏢';
    
    console.log(`\n${icone} ID ${u.id}: ${u.nome} (${u.perfil})`);
    if (qtdEquipes === 0) {
      console.log(`   ❌ Nenhuma equipe vinculada`);
    } else {
      console.log(`   ✅ ${qtdEquipes} equipe${qtdEquipes > 1 ? 's' : ''}: ${u.equipes_nomes}`);
      console.log(`   📋 IDs: [${u.equipes_ids}]`);
    }
  });
  
  console.log('\n' + '='.repeat(80) + '\n');
  process.exit(0);
}

checkUsuarios().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
