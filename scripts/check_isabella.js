const pool = require('../src/config/db.mysql');

async function checkIsabella() {
  try {
    // Verificar dados no banco
    const [usuario] = await pool.execute(`
      SELECT 
        u.id, 
        u.nome, 
        u.email,
        u.perfil,
        u.equipe_id as equipe_principal,
        GROUP_CONCAT(ue.equipe_id ORDER BY ue.equipe_id) as equipes_ids,
        GROUP_CONCAT(e.nome ORDER BY ue.equipe_id SEPARATOR ' | ') as equipes_nomes
      FROM usuarios u
      LEFT JOIN usuarios_equipes ue ON ue.usuario_id = u.id
      LEFT JOIN equipes e ON e.id = ue.equipe_id
      WHERE u.id = 5
      GROUP BY u.id, u.nome, u.email, u.perfil, u.equipe_id
    `);
    
    console.log('\n📊 DADOS DA ISABELLA NO BANCO DE DADOS:\n');
    console.log('='.repeat(80));
    console.log(`Nome: ${usuario[0].nome}`);
    console.log(`Email: ${usuario[0].email}`);
    console.log(`Perfil: ${usuario[0].perfil}`);
    console.log(`\nEquipe Principal (campo legado): ${usuario[0].equipe_principal}`);
    console.log(`\nEquipes vinculadas na tabela usuarios_equipes:`);
    console.log(`  IDs: [${usuario[0].equipes_ids}]`);
    console.log(`  Nomes: ${usuario[0].equipes_nomes}`);
    
    // Verificar se a equipe principal bate com a primeira equipe vinculada
    const primeiraEquipe = usuario[0].equipes_ids ? usuario[0].equipes_ids.split(',')[0] : null;
    console.log('\n' + '='.repeat(80));
    console.log('VERIFICAÇÃO DE SINCRONIZAÇÃO:');
    console.log('='.repeat(80));
    
    if (usuario[0].equipe_principal == primeiraEquipe) {
      console.log('✅ Campo equipe_id está sincronizado com a primeira equipe');
    } else {
      console.log(`⚠️  DESSINCRONIZADO!`);
      console.log(`   equipe_id: ${usuario[0].equipe_principal}`);
      console.log(`   primeira equipe vinculada: ${primeiraEquipe}`);
    }
    
    // Buscar nome das equipes
    if (usuario[0].equipe_principal) {
      const [equipePrincipal] = await pool.execute(
        'SELECT nome FROM equipes WHERE id = ?',
        [usuario[0].equipe_principal]
      );
      console.log(`\n🏢 Equipe Principal Atual: ${equipePrincipal[0]?.nome || 'NÃO ENCONTRADA'} (ID: ${usuario[0].equipe_principal})`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  ATENÇÃO - TOKEN JWT:');
    console.log('='.repeat(80));
    console.log('O token de autenticação da Isabella contém a equipe_id antiga!');
    console.log('Quando ela fez login, o token foi criado com equipe_id = 26 (CD)');
    console.log('\n💡 SOLUÇÃO:');
    console.log('   1. Isabella precisa fazer LOGOUT');
    console.log('   2. Fazer LOGIN novamente');
    console.log('   3. O novo token terá a equipe_id atualizada');
    console.log('\nOu você pode atualizar manualmente o campo equipe_id:');
    console.log(`   UPDATE usuarios SET equipe_id = ${primeiraEquipe} WHERE id = 5;`);
    console.log('='.repeat(80) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

checkIsabella();
