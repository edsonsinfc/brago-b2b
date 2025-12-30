const pool = require('../src/config/db.mysql');

async function checkMultiStoreUsers() {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        u.id, 
        u.nome, 
        u.email, 
        u.perfil,
        COUNT(ue.equipe_id) as qtd_equipes,
        GROUP_CONCAT(e.nome SEPARATOR ', ') as equipes_nomes
      FROM usuarios u 
      LEFT JOIN usuarios_equipes ue ON ue.usuario_id = u.id 
      LEFT JOIN equipes e ON e.id = ue.equipe_id
      WHERE u.perfil = 'solicitante' 
      GROUP BY u.id, u.nome, u.email, u.perfil
      HAVING COUNT(ue.equipe_id) > 1
      ORDER BY qtd_equipes DESC
    `);
    
    console.log('\n📊 Usuários solicitantes com múltiplas equipes:');
    console.log('='.repeat(80));
    
    if (rows.length === 0) {
      console.log('\n⚠️  Nenhum usuário solicitante tem múltiplas equipes vinculadas!');
      console.log('Para testar o dropdown, você precisa vincular um usuário a 2+ equipes.\n');
    } else {
      rows.forEach(user => {
        console.log(`\n👤 ${user.nome} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Total de equipes: ${user.qtd_equipes}`);
        console.log(`   Equipes: ${user.equipes_nomes}`);
      });
      console.log('\n✅ Total:', rows.length, 'usuário(s) com múltiplas equipes');
    }
    
    // Mostrar todos os solicitantes
    const [allSolicitantes] = await pool.execute(`
      SELECT 
        u.id, 
        u.nome, 
        u.email, 
        COUNT(ue.equipe_id) as qtd_equipes,
        GROUP_CONCAT(e.nome SEPARATOR ', ') as equipes_nomes
      FROM usuarios u 
      LEFT JOIN usuarios_equipes ue ON ue.usuario_id = u.id 
      LEFT JOIN equipes e ON e.id = ue.equipe_id
      WHERE u.perfil = 'solicitante' AND u.ativo = 1
      GROUP BY u.id, u.nome, u.email
      ORDER BY u.nome
    `);
    
    console.log('\n\n📋 Todos os solicitantes ativos:');
    console.log('='.repeat(80));
    allSolicitantes.forEach(user => {
      const status = user.qtd_equipes > 1 ? '✅ MÚLTIPLAS' : user.qtd_equipes === 1 ? '📍 UMA' : '❌ SEM';
      console.log(`${status} | ${user.nome.padEnd(30)} | ${user.qtd_equipes} equipe(s)`);
      if (user.equipes_nomes) {
        console.log(`       ${user.equipes_nomes}`);
      }
    });
    
    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkMultiStoreUsers();
